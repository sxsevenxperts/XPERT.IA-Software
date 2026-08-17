const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
const healthTable = process.env.SUPABASE_HEALTH_TABLE || 'app_health'

if (!supabaseUrl || !publishableKey) {
  console.error('SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY são obrigatórios.')
  process.exit(1)
}

const headers = {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
}

async function request(path) {
  const response = await fetch(`${supabaseUrl}${path}`, { headers })
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 240)}`)
  }

  return body
}

try {
  // Prefer a lightweight read in the public schema. The canonical migration
  // creates this table with a read-only anon policy for this purpose.
  await request(`/rest/v1/${healthTable}?id=eq.1&select=id,updated_at&limit=1`)
  console.log(`Supabase keep-alive OK (${new Date().toISOString()})`)
} catch (error) {
  // Before the canonical schema is deployed, still touch the project through
  // Auth so the workflow remains observable and fails loudly only on outage.
  try {
    await request('/auth/v1/settings')
    console.warn(`Tabela ${healthTable} indisponível; Auth respondeu normalmente.`)
    console.log(`Supabase keep-alive OK (${new Date().toISOString()})`)
  } catch (fallbackError) {
    console.error(`Supabase keep-alive falhou: ${fallbackError.message}`)
    process.exit(1)
  }
}
