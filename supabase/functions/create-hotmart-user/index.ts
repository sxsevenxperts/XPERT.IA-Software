import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { JWT } from "https://deno.land/x/jose@v5.6.3/index.ts";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const body = await req.json() as Record<string, unknown>;

    const email = (body.email as string)?.trim();
    const phone = (body.phone as string)?.trim() || "";
    const name = (body.name as string)?.trim() || email?.split("@")[0] || "Driver";
    const transactionId = (body.transaction_id as string) || "";

    if (!email) {
      return json({ error: "Email é obrigatório" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ─── 1. Check if user already exists ─────────────────────────────────────
    const { data: existingUser } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let userId: string;
    let newUser = false;

    if (existingUser) {
      // User already exists, use their ID
      userId = existingUser.id as string;
    } else {
      // ─── 2. Create new user in auth.users ────────────────────────────────────
      // Generate random password for internal use (won't be used to login)
      const tempPassword = generateRandomPassword(16);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          phone,
          created_via: "hotmart",
        },
      });

      if (authError || !authData.user) {
        console.error("Error creating auth user:", authError);
        return json(
          { error: "Erro ao criar usuário: " + (authError?.message || "Desconhecido") },
          500
        );
      }

      userId = authData.user.id;
      newUser = true;
    }

    // ─── 3. Create/Update subscription (30 days) ─────────────────────────────
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "monthly",
          status: "active",
          expires_at: expiresAt.toISOString(),
          hotmart_transaction_id: transactionId || null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      return json(
        { error: "Erro ao criar subscrição" },
        500
      );
    }

    // ─── 4. Create/Update profile ────────────────────────────────────────────
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          phone,
          name,
          hotmart_customer: true,
          updated_at: now.toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't fail if profile creation fails, it's not critical
    }

    // ─── 5. Generate JWT token for immediate login ──────────────────────────
    const secret = new TextEncoder().encode(jwtSecret);
    const jwt = await new JWT.SignJWT({
      sub: userId,
      email,
      aud: "authenticated",
      role: "authenticated",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // ─── 6. Create session object ────────────────────────────────────────────
    const session = {
      access_token: jwt,
      refresh_token: `refresh_${userId}_${Date.now()}`,
      expires_in: 86400, // 24 hours
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: "bearer",
      user: {
        id: userId,
        email,
        user_metadata: {
          name,
          phone,
          created_via: "hotmart",
        },
      },
    };

    // ─── 7. Log the Hotmart transaction ──────────────────────────────────────
    if (transactionId) {
      await supabase
        .from("hotmart_transactions")
        .insert({
          user_id: userId,
          transaction_id: transactionId,
          email,
          phone,
          name,
          created_at: now.toISOString(),
        })
        .then(() => null)
        .catch((err) => {
          console.error("Error logging hotmart transaction:", err);
          // Don't fail if logging fails
        });
    }

    console.log(`✅ Hotmart user processed: ${email} (${newUser ? "NEW" : "EXISTING"})`);

    return json({
      ok: true,
      user: {
        id: userId,
        email,
      },
      session,
      subscription: {
        plan: "monthly",
        expires_at: expiresAt.toISOString(),
      },
      message: newUser
        ? "Conta criada com sucesso!"
        : "Bem-vindo de volta! Sua subscrição foi renovada.",
    });
  } catch (error) {
    console.error("Error in create-hotmart-user:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      500
    );
  }
}

function generateRandomPassword(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(handleRequest);
