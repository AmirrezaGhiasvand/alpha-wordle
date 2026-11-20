-- Two seats; answers and attempts remain private behind the authenticated RPC.
create table wordle_private.friend_rooms (
 id uuid primary key default gen_random_uuid(), token_hash text unique not null,
 host_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '7 days'
);
create index friend_rooms_host_created on wordle_private.friend_rooms(host_id,created_at);
create table wordle_private.friend_players (
 room_id uuid not null references wordle_private.friend_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 seat integer not null check(seat in (1,2)), word text, dictionary_version integer not null default 1,
 attempts jsonb not null default '[]', request_ids jsonb not null default '[]',
 status text not null default 'playing' check(status in ('playing','won','lost')),
 primary key(room_id,user_id), unique(room_id,seat), check(jsonb_array_length(attempts)<=6),
 foreign key(dictionary_version,word) references wordle_private.words(dictionary_version,word)
);
create index friend_players_user on wordle_private.friend_players(user_id);
create index friend_players_word on wordle_private.friend_players(dictionary_version,word);
alter table wordle_private.friend_rooms enable row level security;
alter table wordle_private.friend_players enable row level security;
revoke all on wordle_private.friend_rooms,wordle_private.friend_players from public,anon,authenticated;

create function public.friend_api(action text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); r wordle_private.friend_rooms; me wordle_private.friend_players;
 other wordle_private.friend_players; tok text:=payload->>'token'; w text; marks jsonb;
 ready boolean; result text:='pending'; my_score integer; their_score integer;
begin
 if uid is null then raise exception 'not_found'; end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4096 or tok is null or tok !~ '^[a-f0-9]{64}$' then raise exception 'invalid_action'; end if;
 if action='create' then
   perform pg_advisory_xact_lock(hashtextextended(uid::text,19));
   select * into r from wordle_private.friend_rooms where token_hash=encode(sha256(convert_to(tok,'UTF8')),'hex');
   if found then
     if r.host_id<>uid then raise exception 'not_found'; end if;
   else
     if (select count(*) from wordle_private.friend_rooms where host_id=uid and created_at>now()-interval '1 day')>=20 then raise exception 'rate_limit'; end if;
     insert into wordle_private.friend_rooms(token_hash,host_id) values(encode(sha256(convert_to(tok,'UTF8')),'hex'),uid) returning * into r;
     insert into wordle_private.friend_players(room_id,user_id,seat) values(r.id,uid,1);
   end if;
 end if;
 select * into r from wordle_private.friend_rooms where token_hash=encode(sha256(convert_to(tok,'UTF8')),'hex') for update;
 if not found then raise exception 'not_found'; end if;
 if r.expires_at<=now() then raise exception 'expired'; end if;
 select * into me from wordle_private.friend_players where room_id=r.id and user_id=uid;
 if not found then
   if action<>'join' then raise exception 'not_found'; end if;
   if exists(select 1 from wordle_private.friend_players where room_id=r.id and seat=2) then raise exception 'room_full'; end if;
   insert into wordle_private.friend_players(room_id,user_id,seat) values(r.id,uid,2) returning * into me;
 end if;
 select * into other from wordle_private.friend_players where room_id=r.id and user_id<>uid;
 if action='choose' then
   w:=wordle_private.normalize_word(payload->>'word');
   if me.word is not null then
     if w is distinct from me.word then raise exception 'locked'; end if;
   else
     if w is null or char_length(w)<>5 or w !~ '^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$' then raise exception 'invalid_length'; end if;
     if not exists(select 1 from wordle_private.words where dictionary_version=1 and word=w) then raise exception 'invalid_word'; end if;
     update wordle_private.friend_players set word=w where room_id=r.id and user_id=uid returning * into me;
   end if;
 elsif action='guess' then
   if me.word is null or other.word is null then raise exception 'not_ready'; end if;
   if coalesce(payload->>'requestId','') !~ '^[a-f0-9-]{36}$' then raise exception 'invalid_action'; end if;
   if not me.request_ids @> jsonb_build_array(payload->>'requestId') then
     if me.status<>'playing' then raise exception 'finished'; end if;
     if (payload->>'turn')::integer is distinct from jsonb_array_length(me.attempts) then raise exception 'stale_turn'; end if;
     w:=wordle_private.normalize_word(payload->>'guess');
     if w is null or char_length(w)<>5 or w !~ '^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]+$' then raise exception 'invalid_length'; end if;
     if not exists(select 1 from wordle_private.words where dictionary_version=1 and word=w) then raise exception 'invalid_word'; end if;
     marks:=wordle_private.score(other.word,w);
     update wordle_private.friend_players set attempts=attempts||jsonb_build_array(jsonb_build_object('guess',w,'marks',marks)),
       request_ids=request_ids||jsonb_build_array(payload->>'requestId'),
       status=case when w=other.word then 'won' when jsonb_array_length(attempts)=5 then 'lost' else 'playing' end
       where room_id=r.id and user_id=uid returning * into me;
   end if;
 elsif action not in ('create','join','view') then raise exception 'invalid_action';
 end if;
 ready:=me.word is not null and other.word is not null;
 if me.status<>'playing' and other.status<>'playing' then
   my_score:=case when me.status='won' then jsonb_array_length(me.attempts) else 7 end;
   their_score:=case when other.status='won' then jsonb_array_length(other.attempts) else 7 end;
   result:=case when my_score<their_score then 'me' when my_score>their_score then 'other' else 'draw' end;
 end if;
 return jsonb_build_object('id',r.id,'seat',me.seat,'chosen',me.word,'opponentJoined',other.user_id is not null,
   'opponentReady',other.word is not null,'ready',ready,'expiresAt',r.expires_at,'result',result,
   'opponent',jsonb_build_object('status',other.status,'attempts',coalesce(jsonb_array_length(other.attempts),0)),
   'game',case when ready then jsonb_build_object('id',r.id,'kind','recording','label','دوئل دوستانه','round',1,
     'attempts',me.attempts,'status',me.status,'answer',case when me.status<>'playing' then other.word else null end) else null end);
end $$;
revoke all on function public.friend_api(text,jsonb) from public,anon;
grant execute on function public.friend_api(text,jsonb) to authenticated;
