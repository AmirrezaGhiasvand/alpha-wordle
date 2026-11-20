-- Manual admin choices may use any accepted word. Random choices remain curated.
CREATE OR REPLACE FUNCTION public.wordle_api(action text, payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Tehran')::date;
  p wordle_private.puzzles;
  g wordle_private.games;
  candidate text;
  candidate_kind text;
  candidate_date date;
  candidate_status text;
  token text;
  guess text;
  request_id text;
  marks jsonb;
  n integer;
  result jsonb;
begin
  if uid is null then raise exception 'not_admin'; end if;
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text)>4096 then raise exception 'invalid_action'; end if;

  if action like 'admin_%' then
    if not exists(select 1 from wordle_private.admins where user_id=uid)
      or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'not_admin'; end if;

    if action='admin_list' then
      return jsonb_build_object(
        'puzzles',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from
          (select id,answer,kind,date,status,revision,created_at from wordle_private.puzzles order by created_at desc limit 150) x),'[]'::jsonb),
        'words','[]'::jsonb);
    elsif action='admin_random' then
      select w.word into candidate from wordle_private.words w
      where w.dictionary_version=1 and w.eligible and not exists (
        select 1 from wordle_private.puzzles pp where pp.answer=w.word and pp.status in ('scheduled','published')
          and pp.kind='daily' and pp.date >= today-180
      ) order by random() limit 1;
      if candidate is null then raise exception 'no_words'; end if;
      return jsonb_build_object('answer',candidate);
    elsif action='admin_save' then
      perform pg_advisory_xact_lock(38475);
      candidate:=wordle_private.normalize_word(payload->>'answer');
      candidate_kind:=payload->>'kind';
      if candidate_kind not in ('daily','recording') or candidate_kind is null then raise exception 'invalid_action'; end if;
      if candidate is null or char_length(candidate)<>5 or candidate !~ '^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$' then raise exception 'invalid_length'; end if;
      if not exists(select 1 from wordle_private.words where dictionary_version=1 and word=candidate) then raise exception 'invalid_word'; end if;
      if candidate_kind='daily' then
        candidate_date:=(payload->>'date')::date;
        if candidate_date is null or candidate_date<today then raise exception 'invalid_date'; end if;
      end if;
      candidate_status:=case when coalesce((payload->>'publish')::boolean,false) then
        case when candidate_kind='daily' then 'scheduled' else 'published' end else 'draft' end;
      if candidate_kind='recording' and candidate_status='published' then
        token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
      end if;
      if payload->>'id' is not null then
        select * into p from wordle_private.puzzles where id=(payload->>'id')::uuid for update;
        if not found then raise exception 'not_found'; end if;
        if p.status <> 'draft' and not (p.status='scheduled' and p.date>today) then raise exception 'locked'; end if;
        if p.revision<>(payload->>'revision')::integer or payload->>'revision' is null then raise exception 'conflict'; end if;
        update wordle_private.puzzles set answer=candidate,kind=candidate_kind,date=candidate_date,status=candidate_status,
          token_hash=case when token is not null then encode(sha256(convert_to(token,'UTF8')),'hex') end,revision=revision+1
        where id=p.id returning * into p;
      else
        insert into wordle_private.puzzles(kind,date,answer,status,token_hash)
        values(candidate_kind,candidate_date,candidate,candidate_status,case when token is not null then encode(sha256(convert_to(token,'UTF8')),'hex') end) returning * into p;
      end if;
      insert into wordle_private.audit(actor,action,puzzle_id) values(uid,action,p.id);
      return jsonb_build_object('id',p.id,'token',token);
    elsif action in ('admin_revoke','admin_retire') then
      update wordle_private.puzzles set status=case when action='admin_retire' then 'retired' else 'revoked' end,revision=revision+1
      where id=(payload->>'id')::uuid and kind='recording' and status in ('published','revoked')
        and (action='admin_retire' or status='published') returning * into p;
      if not found then raise exception 'locked'; end if;
      insert into wordle_private.audit(actor,action,puzzle_id) values(uid,action,p.id);
      return jsonb_build_object('ok',true);
    else raise exception 'invalid_action'; end if;
  end if;

  if action='open' then
    if payload->>'token' is not null then
      token:=payload->>'token';
      if token !~ '^[a-f0-9]{64}$' then raise exception 'not_found'; end if;
      select * into p from wordle_private.puzzles where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and kind='recording';
      if not found or p.status not in ('published','revoked') then raise exception 'not_found'; end if;
    else
      perform pg_advisory_xact_lock(38475);
      select * into p from wordle_private.puzzles where kind='daily' and date=today and status in ('scheduled','published') for update;
      if not found then
        select w.word into candidate from wordle_private.words w
        where w.dictionary_version=1 and w.eligible and not exists (
          select 1 from wordle_private.puzzles pp where pp.answer=w.word and pp.status in ('scheduled','published')
            and pp.kind='daily' and pp.date>=today-180
        ) order by random() limit 1;
        if candidate is null then raise exception 'no_words'; end if;
        insert into wordle_private.puzzles(kind,date,answer,status) values('daily',today,candidate,'published') returning * into p;
      elsif p.status='scheduled' then
        update wordle_private.puzzles set status='published',revision=revision+1 where id=p.id returning * into p;
      end if;
    end if;
    select * into g from wordle_private.games where puzzle_id=p.id and user_id=uid;
    if not found then
      if p.status='revoked' then raise exception 'revoked'; end if;
      if (select count(*) from wordle_private.games where user_id=uid and created_at>now()-interval '1 day')>=80 then raise exception 'rate_limit'; end if;
      -- Serialize recording starts and revocation. Existing games can finish.
      perform 1 from wordle_private.puzzles where id=p.id for update;
      if exists(select 1 from wordle_private.puzzles where id=p.id and status not in ('published')) then raise exception 'revoked'; end if;
      insert into wordle_private.games(user_id,puzzle_id) values(uid,p.id) on conflict(user_id,puzzle_id) do nothing;
      select * into g from wordle_private.games where puzzle_id=p.id and user_id=uid;
    end if;
    return wordle_private.game_view(g,p);

  elsif action in ('guess','reset') then
    select * into g from wordle_private.games where user_id=uid and puzzle_id=(payload->>'puzzleId')::uuid for update;
    if not found then raise exception 'not_found'; end if;
    select * into p from wordle_private.puzzles where id=g.puzzle_id;
    if p.status not in ('published','revoked') then raise exception 'unavailable'; end if;
    if action='reset' then
      if payload->>'round' is null then raise exception 'invalid_action'; end if;
      if (payload->>'round')::integer < g.round then return wordle_private.game_view(g,p); end if;
      if (payload->>'round')::integer <> g.round then raise exception 'stale_round'; end if;
      update wordle_private.games set attempts='[]',request_ids='[]',status='playing',round=round+1,updated_at=now()
      where id=g.id returning * into g;
      return wordle_private.game_view(g,p);
    end if;
    if coalesce((payload->>'round')::integer,1) <> g.round then raise exception 'stale_round'; end if;
    request_id:=payload->>'requestId';
    if request_id is null or request_id !~ '^[a-f0-9-]{36}$' then raise exception 'invalid_action'; end if;
    if g.request_ids ? request_id then return wordle_private.game_view(g,p); end if;
    if g.status<>'playing' or jsonb_array_length(g.attempts)>=6 then raise exception 'finished'; end if;
    n:=jsonb_array_length(g.attempts);
    if (payload->>'turn') is null or (payload->>'turn')::integer<>n then raise exception 'stale_turn'; end if;
    guess:=wordle_private.normalize_word(payload->>'guess');
    if guess is null or char_length(guess)<>5 or guess !~ '^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$' then raise exception 'invalid_length'; end if;
    if not exists(select 1 from wordle_private.words where dictionary_version=p.dictionary_version and word=guess) then raise exception 'invalid_word'; end if;
    marks:=wordle_private.score(p.answer,guess);
    update wordle_private.games set attempts=attempts||jsonb_build_array(jsonb_build_object('guess',guess,'marks',marks)),
      request_ids=request_ids||jsonb_build_array(request_id),
      status=case when guess=p.answer then 'won' when n=5 then 'lost' else 'playing' end,
      updated_at=now() where id=g.id returning * into g;
    return wordle_private.game_view(g,p);
  else raise exception 'invalid_action'; end if;
exception when unique_violation then raise exception 'conflict';
end $function$
