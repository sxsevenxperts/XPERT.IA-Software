import { createClient, type User } from "jsr:@supabase/supabase-js@2"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  })
}

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function requireUser(req: Request): Promise<{ user: User; token: string }> {
  const authorization = req.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) throw new Error("Não autenticado.")

  const token = authorization.slice("Bearer ".length)
  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  )
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new Error("Sessão inválida ou expirada.")
  return { user: data.user, token }
}
