import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/auth.ts"
import { decryptSecret } from "../_shared/crypto.ts"

const defaultSystem = `Você é um assistente jurídico especializado em Direito Brasileiro.
Responda em português, seja preciso, cite fontes verificáveis quando possível e não prometa resultados.
O conteúdo é apoio ao trabalho do advogado e deve ser revisado por profissional habilitado.`

async function resolveAnthropicKey(userId: string, admin: ReturnType<typeof serviceClient>) {
  const globalKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (globalKey) return globalKey
  const { data, error } = await admin.from("user_integrations")
    .select("secret_ciphertext,secret_iv").eq("user_id", userId).eq("provider", "anthropic").maybeSingle()
  if (error) throw error
  if (!data) throw new Error("Chave da Anthropic não configurada em Configurações.")
  return decryptSecret(data.secret_ciphertext, data.secret_iv)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { user } = await requireUser(req)
    const body = await req.json()
    const prompt = String(body.prompt || "").trim()
    if (!prompt || prompt.length > 120000) return json({ error: "Prompt inválido ou grande demais." }, 400)

    const key = await resolveAnthropicKey(user.id, serviceClient())
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }]
    if (body.file?.data && body.file?.mediaType) {
      content.unshift({
        type: body.file.mediaType === "application/pdf" ? "document" : "image",
        source: { type: "base64", media_type: body.file.mediaType, data: body.file.data },
      })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: body.model || "claude-3-5-sonnet-20241022",
        max_tokens: Math.min(Number(body.maxTokens) || 4096, 8192),
        system: body.system || defaultSystem,
        messages: [{ role: "user", content }],
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) return json({ error: result?.error?.message || "A API de IA rejeitou a solicitação." }, response.status)
    return json({ text: result.content?.[0]?.text || "", usage: result.usage || null })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno." }, 500)
  }
})
