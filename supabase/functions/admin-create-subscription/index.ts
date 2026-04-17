/**
 * admin-create-subscription — Cria assinatura com usuário via admin
 *
 * Endpoint: POST /functions/v1/admin-create-subscription
 * Autenticação: Requer admin_id válido
 *
 * Body:
 * {
 *   email: string (obrigatório, único)
 *   name: string (opcional)
 *   phone: string (opcional)
 *   plan: 'monthly' | 'free' (obrigatório)
 *   admin_id: string (obrigatório)
 * }
 *
 * Response:
 * {
 *   ok: boolean
 *   user: { id, email, name, phone }
 *   credentials: { email, password }
 *   subscription: { plan, status, expires_at }
 *   message: string
 * }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

// ── Types ──────────────────────────────────────────────────────────────────
interface RequestBody {
  email: string;
  name?: string;
  phone?: string;
  plan: "monthly" | "free";
  admin_id: string;
}

interface SuccessResponse {
  ok: true;
  user: { id: string; email: string; name: string; phone: string };
  credentials: { email: string; password: string };
  subscription: { plan: string; status: string; expires_at: string };
  message: string;
}

interface ErrorResponse {
  ok?: false;
  error: string;
  code?: string;
  existing_user_id?: string;
}

// ── Utilities ──────────────────────────────────────────────────────────────
function json(data: SuccessResponse | ErrorResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  let pwd = "";
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleRequest(req: Request): Promise<Response> {
  // ── CORS Preflight ─────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método HTTP não permitido. Use POST." }, 405);
  }

  const startTime = Date.now();
  let userId: string | null = null;

  try {
    // ── Parse & Validate Input ─────────────────────────────────────────────────
    const body = (await req.json()) as Partial<RequestBody>;

    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim() || "Usuário";
    const phone = (body.phone || "").trim() || "";
    const plan = (body.plan || "monthly") as "monthly" | "free";
    const adminId = (body.admin_id || "").trim();

    // Input validation
    if (!email) {
      return json({ error: "Email é obrigatório", code: "MISSING_EMAIL" }, 400);
    }
    if (!validateEmail(email)) {
      return json({ error: "Email inválido", code: "INVALID_EMAIL" }, 400);
    }
    if (!adminId) {
      return json({ error: "Admin ID é obrigatório", code: "MISSING_ADMIN_ID" }, 400);
    }
    if (!["monthly", "free"].includes(plan)) {
      return json({ error: "Plano inválido (monthly ou free)", code: "INVALID_PLAN" }, 400);
    }

    // ── Initialize Supabase ────────────────────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase credentials in environment");
      return json({ error: "Erro de configuração do servidor", code: "CONFIG_ERROR" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date();

    // ── Validate Admin ─────────────────────────────────────────────────────────
    const { data: adminProfile, error: adminCheckError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", adminId)
      .single();

    if (adminCheckError || !adminProfile) {
      console.warn(`[AdminCreate] Admin não encontrado: ${adminId}`);
      return json({ error: "Admin não autorizado", code: "ADMIN_NOT_FOUND" }, 403);
    }

    // ── Check Email Not Already Registered ─────────────────────────────────────
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      console.warn(`[AdminCreate] Email já cadastrado: ${email}`);
      return json({
        error: "Este email já está cadastrado",
        code: "EMAIL_EXISTS",
        existing_user_id: existingProfile.id,
      }, 409);
    }

    // ── 1. Create User in Auth ─────────────────────────────────────────────────
    const password = generatePassword();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(`[AdminCreate] Auth error: ${authError?.message}`);
      return json({ error: "Falha ao criar usuário na autenticação", code: "AUTH_ERROR" }, 500);
    }

    userId = authData.user.id;
    console.log(`[AdminCreate] Usuário criado: ${email} (${userId})`);

    // ── 2. Create Profile ──────────────────────────────────────────────────────
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        name,
        phone,
        created_at: now.toISOString(),
      });

    if (profileError) {
      console.error(`[AdminCreate] Profile creation error: ${profileError.message}`);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(userId).catch(err =>
        console.error(`[AdminCreate] Cleanup failed: ${err.message}`)
      );
      return json({ error: "Falha ao criar perfil do usuário", code: "PROFILE_ERROR" }, 500);
    }

    console.log(`[AdminCreate] Perfil criado: ${userId}`);

    // ── 3. Create Subscription ─────────────────────────────────────────────────
    const expiryDays = plan === "monthly" ? 30 : 365;
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        status: "active",
        plan,
        expires_at: expiresAt,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });

    if (subError) {
      console.error(`[AdminCreate] Subscription error: ${subError.message}`);
      return json({ error: "Falha ao criar subscrição", code: "SUBSCRIPTION_ERROR" }, 500);
    }

    console.log(`[AdminCreate] ✅ Assinatura criada: ${email} (${plan}, ${expiryDays} dias)`);

    // ── Success Response ───────────────────────────────────────────────────────
    const duration = Date.now() - startTime;
    return json({
      ok: true,
      user: { id: userId, email, name, phone },
      credentials: { email, password },
      subscription: { plan, status: "active", expires_at: expiresAt },
      message: `✅ Usuário criado! Acesso garantido por ${expiryDays} dias.`,
    } as SuccessResponse, 201);

  } catch (error) {
    console.error(`[AdminCreate] Unexpected error:`, error);

    // Cleanup attempt if user was partially created
    if (userId && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.auth.admin.deleteUser(userId).catch(() => {});
      } catch {
        // Silent fail on cleanup
      }
    }

    return json(
      {
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      } as ErrorResponse,
      500
    );
  }
}

Deno.serve(handleRequest);
