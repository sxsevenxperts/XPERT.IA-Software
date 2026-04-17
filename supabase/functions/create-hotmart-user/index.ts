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

    // ── 1. Tentar criar usuário (detecta "already exists" via try/catch) ──────
    let userId: string;
    let isNewUser = false;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sem envio de email — confirmado automaticamente
      user_metadata: { name, phone, created_via: "hotmart" },
    });

    if (authError) {
      // Email já existe em auth
      if (authError.message?.includes("already registered") || authError.message?.includes("User already exists")) {
        console.log(`ℹ️  Email já registrado: ${email}. Atualizando senha...`);

        // Buscar o usuário para pegar seu ID (com timeout protection)
        let existingUser = null;
        try {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          existingUser = users?.find(u => u.email === email);
        } catch (listErr) {
          console.error(`⚠️  Erro ao listar usuários: ${listErr}. Tentando fallback...`);
          // Fallback: tenta fazer login com a senha nova - se funcionar, userId está correto
          const fallbackLogin = await supabase.auth.signInWithPassword({ email, password });
          if (fallbackLogin.data?.user?.id) {
            userId = fallbackLogin.data.user.id;
            existingUser = fallbackLogin.data.user;
          } else {
            return json({ error: "Não conseguimos encontrar sua conta. Entre em contato com suporte." }, 500);
          }
        }

        if (!existingUser) {
          return json({ error: "Usuário não encontrado. Entre em contato com suporte." }, 500);
        }

        userId = existingUser.id;

        // Atualizar a senha (se ainda não foi feito via fallback login)
        if (userId && !isNewUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
          if (updateError) {
            console.error(`⚠️  Erro ao atualizar senha para ${email}: ${updateError.message}`);
            return json({ error: "Erro ao atualizar senha. Tente fazer login com sua senha anterior ou entre em contato com suporte." }, 400);
          }
          console.log(`✅ Senha atualizada para usuário existente: ${email}`);
        }
      } else {
        // Outro erro ao criar usuário
        console.error(`❌ Erro ao criar usuário ${email}: ${authError.message}`);
        return json({ error: "Erro ao criar usuário: " + (authError.message || "Desconhecido") }, 500);
      }
    } else if (authData.user) {
      // Usuário novo criado com sucesso
      userId = authData.user.id;
      isNewUser = true;
      console.log(`✅ Novo usuário criado: ${email} (ID: ${userId})`);
    } else {
      return json({ error: "Erro desconhecido ao criar usuário" }, 500);
    }

    // ── 3. Criar/renovar subscrição 30 dias ──────────────────────────────────
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: subError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan: "monthly",
      status: "active",
      expires_at: expiresAt.toISOString(),
      hotmart_transaction: transactionId || null,
      updated_at: now.toISOString(),
    }, { onConflict: "user_id" });

    if (subError) {
      console.error(`⚠️  Erro ao criar subscrição para ${email}: ${subError.message}`);
      return json({ error: "Erro ao ativar subscrição. Entre em contato com suporte." }, 500);
    }
    console.log(`✅ Subscrição criada/renovada para ${email}`);

    // ── 4. Criar/atualizar perfil ─────────────────────────────────────────────
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email, phone, name,
      hotmart_customer: true,
      updated_at: now.toISOString(),
    }, { onConflict: "id" });

    if (profileError) {
      console.error(`⚠️  Erro ao criar perfil para ${email}: ${profileError.message}`);
      // Não falha aqui - perfil é secundário
    } else {
      console.log(`✅ Perfil criado/atualizado para ${email}`);
    }

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
    let loginData = null;
    let loginError = null;

    // Retry logic para login — às vezes o banco leva um tempo para sincronizar
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`🔐 Tentativa de login ${attempt + 1}/3 para ${email}...`);
      const result = await supabase.auth.signInWithPassword({ email, password });
      loginError = result.error;
      loginData = result.data;

      if (!loginError && loginData.session) {
        console.log(`✅ Login automático sucesso na tentativa ${attempt + 1}`);
        break; // Sucesso!
      }

      if (loginError) {
        console.warn(`⚠️  Tentativa ${attempt + 1} falhou: ${loginError.message}`);
      }

      if (attempt < 2) {
        // Espera um pouco antes de tentar novamente (eventual consistency)
        const delay = 500 * (attempt + 1);
        console.log(`⏳ Aguardando ${delay}ms antes de próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (loginError || !loginData?.session) {
      // Mesmo com erro no login, se a conta foi criada, retorna sucesso
      // O cliente pode tentar fazer login manualmente
      console.warn(`⚠️  Hotmart: ${email} criada, mas erro no login automático: ${loginError?.message}`);
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
