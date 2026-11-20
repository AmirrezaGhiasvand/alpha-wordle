import { createClient } from '@supabase/supabase-js'

async function main() {
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Set the public Supabase project URL and publishable key before deployment.')
if (key.startsWith('sb_secret_')) throw new Error('Use a publishable key, never a Supabase secret key.')
if (key.split('.').length === 3) {
  const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
  if (claims.role !== 'anon') throw new Error('A privileged Supabase key must not be included in a frontend build.')
}

const settings = await fetch(new URL('/auth/v1/settings', url), { headers: { apikey:key }, signal:AbortSignal.timeout(25_000) })
if (!settings.ok) throw new Error(`Supabase connection failed (HTTP ${settings.status}). Verify the public connection settings.`)
const configuration = await settings.json()
if (!configuration.external?.anonymous_users) throw new Error('Enable anonymous sign-ins in Supabase Auth before deploying this guest-play application.')

const client = createClient(url,key, { auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init) => fetch(input,{...init,signal:AbortSignal.timeout(25_000)})} })
const { error:authError } = await client.auth.signInAnonymously()
if (authError) throw new Error(`Guest authentication failed: ${authError.message}`)
const { data, error } = await client.rpc('wordle_api', { action:'open',payload:{} })
if (error) throw new Error(`Game API is not ready: ${error.message}. Apply both database migrations and populate the approved answer pool.`)
if (!data?.id || data.kind !== 'daily' || data.status !== 'playing' || !Array.isArray(data.attempts) || data.attempts.length || data.answer) throw new Error('Daily game smoke check returned an unexpected or unsafe response.')
console.log('Live backend verified: guest authentication and daily puzzle API are ready; no answer exposed.')
await client.auth.signOut({ scope:'local' })

}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
