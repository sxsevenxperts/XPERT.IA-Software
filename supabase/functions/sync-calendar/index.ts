import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { json, requireUser, serviceClient } from "../_shared/auth.ts"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true })

  try {
    const { user } = await requireUser(req)
    const { integrationId } = await req.json()
    if (!integrationId) return json({ error: "Integração obrigatória." }, 400)

    const admin = serviceClient()
    const { data: integration, error: integrationError } = await admin.from("calendar_integrations")
      .select("id,user_id,provider,calendar_id,ativo")
      .eq("id", integrationId).eq("user_id", user.id).eq("ativo", true).single()
    if (integrationError || !integration) return json({ error: "Integração não encontrada." }, 404)

    const providerUrl = Deno.env.get("CALENDAR_SYNC_API_URL")
    if (!providerUrl) return json({ error: "CALENDAR_SYNC_API_URL não configurada no backend." }, 503)

    const startedAt = Date.now()
    const response = await fetch(providerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ userId: user.id, provider: integration.provider, calendarId: integration.calendar_id }),
    })
    const result = await response.json().catch(() => ({})) as { events?: unknown[] }
    if (!response.ok) return json({ error: "O provedor de calendário recusou a sincronização." }, 502)

    const syncedAt = new Date().toISOString()
    const { error: updateError } = await admin.from("calendar_integrations").update({
      sincronizado_em: syncedAt,
      ultim_sync: syncedAt,
    }).eq("id", integration.id).eq("user_id", user.id)
    if (updateError) throw updateError

    const { error: logError } = await admin.from("calendar_sync_log").insert({
      integration_id: integration.id,
      tipo_sync: "manual",
      status: "sucesso",
      eventos_sincronizados: Array.isArray(result.events) ? result.events.length : 0,
      duracao_ms: Date.now() - startedAt,
    })
    if (logError) throw logError

    return json({ success: true, events: Array.isArray(result.events) ? result.events.length : 0 })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro ao sincronizar calendário." }, 500)
  }
})
