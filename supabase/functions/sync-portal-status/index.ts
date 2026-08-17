import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/auth.ts"

type PortalData = {
  status_atual: string
  ultima_movimentacao?: string
  data_ultima_movimentacao?: string
  fase_processual?: string
  juizo_atual?: string
  partes?: string[]
  advogados?: string[]
  eventos_ultimos_30_dias?: number
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  const startedAt = new Date().toISOString()

  try {
    const { user } = await requireUser(req)
    const { integrationId, portalTipo, numeroProcesso } = await req.json()
    if (!integrationId || !portalTipo || !numeroProcesso) return json({ error: "Integração, portal e processo são obrigatórios." }, 400)

    const admin = serviceClient()
    const { data: integration, error: integrationError } = await admin.from("portal_integrations")
      .select("id,user_id,caso_id,numero_processo").eq("id", integrationId).eq("user_id", user.id).eq("ativo", true).single()
    if (integrationError || !integration) return json({ error: "Integração não encontrada para este usuário." }, 404)

    const providerUrl = Deno.env.get("PORTAL_STATUS_API_URL")
    if (!providerUrl) {
      await admin.from("portal_sync_log").insert({ user_id: user.id, integration_id: integrationId, portal_tipo: portalTipo, numero_processo: numeroProcesso, data_inicio: startedAt, data_fim: new Date().toISOString(), status: "falha", mensagem_erro: "PORTAL_STATUS_API_URL não configurada." })
      return json({ error: "Integração externa de portal ainda não configurada no backend." }, 503)
    }

    const response = await fetch(providerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ portalTipo, numeroProcesso }),
    })
    const portalData = await response.json().catch(() => ({})) as PortalData
    if (!response.ok || !portalData.status_atual) throw new Error("A fonte externa não retornou um status processual válido.")

    const { data: previous } = await admin.from("processo_status").select("status_atual,ultima_movimentacao").eq("integration_id", integrationId).order("sincronizado_em", { ascending: false }).limit(1).maybeSingle()
    const { error: statusError } = await admin.from("processo_status").upsert({ integration_id: integrationId, user_id: user.id, caso_id: integration.caso_id, portal_tipo: portalTipo, numero_processo: numeroProcesso, ...portalData, sincronizado_em: new Date().toISOString(), notificacao_enviada: false })
    if (statusError) throw statusError

    let notifications = 0
    if (previous && (previous.status_atual !== portalData.status_atual || previous.ultima_movimentacao !== portalData.ultima_movimentacao)) {
      const { error } = await admin.from("alertas").insert({ user_id: user.id, caso_id: integration.caso_id, titulo: `Nova movimentação em ${numeroProcesso}`, tipo: "prazo", data_alerta: new Date().toISOString().slice(0, 10) })
      if (!error) notifications = 1
    }
    await admin.from("portal_sync_log").insert({ user_id: user.id, integration_id: integrationId, portal_tipo: portalTipo, numero_processo: numeroProcesso, data_inicio: startedAt, data_fim: new Date().toISOString(), status: "sucesso", movimentacoes_encontradas: previous ? 1 : 0, notificacoes_geradas: notifications })
    return json({ success: true, status: portalData.status_atual, movimentacoes: previous ? 1 : 0, notificacoes: notifications })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro desconhecido." }, 500)
  }
})
