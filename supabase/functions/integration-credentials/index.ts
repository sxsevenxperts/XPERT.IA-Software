import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, json, requireUser, serviceClient } from "../_shared/auth.ts"
import { encryptSecret } from "../_shared/crypto.ts"

const allowedProviders = new Set(["anthropic", "whatsapp", "asaas", "email", "jusbrasil", "esocial"])

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { user } = await requireUser(req)
    const body = await req.json()
    const provider = String(body.provider || "")
    const action = String(body.action || "status")
    if (!allowedProviders.has(provider)) return json({ error: "Integração não suportada." }, 400)

    const admin = serviceClient()
    if (action === "status") {
      const { data, error } = await admin
        .from("user_integrations")
        .select("provider,updated_at")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .maybeSingle()
      if (error) throw error
      return json({ configured: Boolean(data), updated_at: data?.updated_at ?? null })
    }

    if (action === "delete") {
      const { error } = await admin.from("user_integrations").delete()
        .eq("user_id", user.id).eq("provider", provider)
      if (error) throw error
      return json({ configured: false })
    }

    const value = String(body.value || "").trim()
    if (!value || value.length > 4096) return json({ error: "Chave inválida." }, 400)

    if (action === "test" && provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": value, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 8, messages: [{ role: "user", content: "Responda apenas OK." }] }),
      })
      if (!response.ok) return json({ error: "A chave Anthropic foi rejeitada." }, 400)
      return json({ valid: true })
    }

    if (action === "test") return json({ error: "Esta integração ainda não possui um teste automático configurado." }, 422)

    const encrypted = await encryptSecret(value)
    const { error } = await admin.from("user_integrations").upsert({
      user_id: user.id,
      provider,
      secret_ciphertext: encrypted.ciphertext,
      secret_iv: encrypted.iv,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    return json({ configured: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno." }, 500)
  }
})
