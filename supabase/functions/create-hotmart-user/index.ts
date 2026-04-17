import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const body = await req.json() as Record<string, unknown>;

    const email         = (body.email as string)?.trim();
    const password      = (body.password as string)?.trim(); // senha escolhida pelo motorista
    const phone         = (body.phone as string)?.trim() || "";
    const name          = (body.name as string)?.trim() || email?.split("@")[0] || "Motorista";
    const transactionId = (body.transaction_id as string) || "";

    if (!email) return json({ error: "Email é obrigatório" }, 400);
    if (!password || password.length < 6) return json({ error: "Senha deve ter ao menos 6 caracteres" }, 400);

    const supabaseUrl    = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase       = createClient(supabaseUrl, serviceRoleKey);

    // ── 1. Verificar se usuário já existe (O(1) via profiles) ─────────────────
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile?.id) {
      // Já existe: apenas atualiza a senha escolhida e renova subscrição
      userId = existingProfile.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) {
        console.error(`⚠️  Erro ao atualizar senha para ${email}: ${updateError.message}`);
        return json({ error: "Erro ao atualizar senha. Tente fazer login com sua senha anterior ou entre em contato com suporte." }, 400);
      }
    } else {
      // ── 2. Criar usuário com a senha escolhida pelo motorista ─────────────────
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // sem envio de email — confirmado automaticamente
        user_metadata: { name, phone, created_via: "hotmart" },
      });

      if (authError || !authData.user) {
        return json({ error: "Erro ao criar usuário: " + (authError?.message || "Desconhecido") }, 500);
      }

      userId = authData.user.id;
      isNewUser = true;
    }

    // ── 3. Criar/renovar subscrição 30 dias ──────────────────────────────────
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan: "monthly",
      status: "active",
      expires_at: expiresAt.toISOString(),
      hotmart_transaction: transactionId || null,
      updated_at: now.toISOString(),
    }, { onConflict: "user_id" });

    // ── 4. Criar/atualizar perfil ─────────────────────────────────────────────
    await supabase.from("profiles").upsert({
      id: userId,
      email, phone, name,
      hotmart_customer: true,
      updated_at: now.toISOString(),
    }, { onConflict: "id" }).catch(() => null);

    // ── 5. Registrar transação ────────────────────────────────────────────────
    if (transactionId) {
      await supabase.from("hotmart_transactions").insert({
        user_id: userId,
        transaction_id: transactionId,
        email, phone, name,
        created_at: now.toISOString(),
      }).catch(() => null);
    }

    // ── 6. Login real com a senha escolhida ───────────────────────────────────
    let loginAttempts = 0;
    let loginData = null;
    let loginError = null;

    // Retry logic para login — às vezes o banco leva um tempo para sincronizar
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase.auth.signInWithPassword({ email, password });
      loginError = result.error;
      loginData = result.data;

      if (!loginError && loginData.session) {
        break; // Sucesso!
      }

      if (attempt < 2) {
        // Espera um pouco antes de tentar novamente (eventual consistency)
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }

    if (loginError || !loginData?.session) {
      // Mesmo com erro no login, se a conta foi criada, retorna sucesso
      // O cliente pode tentar fazer login manualmente
      console.log(`⚠️  Hotmart: ${email} criada, mas erro no login: ${loginError?.message}`);
      return json({
        ok: true,
        is_new_user: isNewUser,
        user: { id: userId, email, name },
        session: null, // Cliente precisará fazer login manualmente
        subscription: {
          plan: "monthly",
          expires_at: expiresAt.toISOString(),
        },
        message: "Conta criada, mas tivemos um erro no login automático. Por favor, faça login manualmente com seu email e senha.",
        error_login: loginError?.message,
      }, 200); // 200 OK porque a conta foi criada com sucesso
    }

    console.log(`✅ Hotmart: ${email} (${isNewUser ? "NOVO" : "EXISTENTE"})`);

    return json({
      ok: true,
      is_new_user: isNewUser,
      user: { id: userId, email, name },
      session: loginData.session,
      subscription: {
        plan: "monthly",
        expires_at: expiresAt.toISOString(),
      },
      message: isNewUser ? "Conta criada com sucesso!" : "Bem-vindo de volta! Subscrição renovada.",
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
}

Deno.serve(handleRequest);
