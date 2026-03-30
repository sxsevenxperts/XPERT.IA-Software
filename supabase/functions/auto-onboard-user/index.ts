import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { email, cpf, nome, oab } = await req.json()

    if (!email || !cpf || !nome) {
      return new Response(
        JSON.stringify({ error: "Email, CPF e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // Cria cliente Supabase com service role key para bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: cpf,
      email_confirm: true,
      user_metadata: { nome, oab },
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    const userId = authData.user?.id
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Falha ao criar usuário" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      )
    }

    // 2. Cria perfil do usuário
    await supabase.from("profiles").insert([{
      id: userId,
      name: nome,
      oab: oab || null,
      created_at: new Date().toISOString(),
    }])

    return new Response(
      JSON.stringify({
        success: true,
        message: `Conta criada automaticamente para ${nome}`,
        user: { id: userId, email },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
})
