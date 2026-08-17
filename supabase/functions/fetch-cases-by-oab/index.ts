import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/auth.ts"
import { decryptSecret } from "../_shared/crypto.ts"

function normalizeCase(item: Record<string, unknown>, userId: string) {
  const status = String(item.status || "em_andamento").toLowerCase()
  return {
    user_id: userId,
    titulo: String(item.title || item.titulo || item.client_name || "Processo sincronizado"),
    area: String(item.area || "Previdenciário"),
    tribunal: String(item.tribunal || item.court || "Não informado"),
    numero_processo: String(item.process_number || item.numero_processo || "") || null,
    data_prazo: item.deadline || item.data_prazo || null,
    status: ["ganho", "arquivado", "recurso", "documentacao", "aguardando"].includes(status) ? status : "em_andamento",
    prioridade: ["alta", "baixa"].includes(String(item.priority || item.prioridade)) ? String(item.priority || item.prioridade) : "normal",
    descricao: item.description || item.descricao || null,
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { user } = await requireUser(req)
    const { oab } = await req.json()
    if (!oab || String(oab).length > 80) return json({ error: "OAB inválida." }, 400)

    const admin = serviceClient()
    const { data: credential } = await admin.from("user_integrations")
      .select("secret_ciphertext,secret_iv").eq("user_id", user.id).eq("provider", "jusbrasil").maybeSingle()
    if (!credential) return json({ error: "Configure a credencial JusBrasil antes de sincronizar." }, 424)

    const token = await decryptSecret(credential.secret_ciphertext, credential.secret_iv)
    const apiUrl = Deno.env.get("JUSBRASIL_API_URL")
    if (!apiUrl) return json({ error: "JUSBRASIL_API_URL não configurada no backend." }, 503)

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/lawyers/${encodeURIComponent(String(oab))}/cases`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) return json({ error: "A fonte de processos rejeitou a consulta.", status: response.status }, 502)

    const sourceCases = Array.isArray(payload) ? payload : (payload.cases || payload.data || [])
    const rows = sourceCases.map((item: Record<string, unknown>) => normalizeCase(item, user.id))
    if (rows.length) {
      const { error } = await admin.from("casos").insert(rows)
      if (error) throw error
    }
    return json({ success: true, cases_synced: rows.length, oab_searched: String(oab) })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro desconhecido." }, 500)
  }
})
