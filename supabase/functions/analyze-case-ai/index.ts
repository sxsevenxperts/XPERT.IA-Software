import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/auth.ts"
import { decryptSecret } from "../_shared/crypto.ts"

async function getKey(userId: string, admin: ReturnType<typeof serviceClient>) {
  if (Deno.env.get("ANTHROPIC_API_KEY")) return Deno.env.get("ANTHROPIC_API_KEY")!
  const { data, error } = await admin.from("user_integrations").select("secret_ciphertext,secret_iv").eq("user_id", userId).eq("provider", "anthropic").maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Chave da Anthropic não configurada.")
  return decryptSecret(data.secret_ciphertext, data.secret_iv)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  try {
    const { user } = await requireUser(req)
    const body = await req.json()
    if (!body.caso_id) return json({ error: "caso_id é obrigatório." }, 400)
    const admin = serviceClient()
    const { data: caso, error: caseError } = await admin.from("casos").select("*").eq("id", body.caso_id).eq("user_id", user.id).single()
    if (caseError || !caso) return json({ error: "Caso não encontrado." }, 404)
    const prompt = `Analise este caso jurídico e retorne exclusivamente JSON válido com as chaves viabilidade_percentual (0-100), confianca_percentual (0-100), risco_nivel (baixo|medio|alto|critico), fatores_positivos (array), fatores_negativos (array), recomendacoes (array), analise_completa (string). Dados: ${JSON.stringify(caso)}`
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": await getKey(user.id, admin), "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1800, system: "Você apoia um advogado brasileiro. Não prometa resultados.", messages: [{ role: "user", content: prompt }] }) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) return json({ error: result?.error?.message || "Erro da API de IA." }, response.status)
    const text = result.content?.[0]?.text || ""
    const start = text.indexOf("{"); const end = text.lastIndexOf("}")
    if (start < 0 || end < start) throw new Error("A IA não retornou uma análise estruturada.")
    const prediction = JSON.parse(text.slice(start, end + 1))
    const row = { caso_id: caso.id, user_id: user.id, ...prediction, gerado_por_ia: true, modelo_ia: "claude-3-5-sonnet-20241022" }
    const { data: saved, error: saveError } = await admin.from("case_predictions").insert(row).select().single()
    if (saveError) throw saveError
    return json({ prediction: saved })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno." }, 500)
  }
})
