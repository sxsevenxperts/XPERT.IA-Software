import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jwtVerify } from "https://esm.sh/jose@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

interface ExecutionLog {
  user_id: string;
  lead_id?: string;
  agent_type: "principal" | "objecao" | "extra";
  agent_index?: number;
  duracao_ms: number;
  status: "sucesso" | "erro" | "timeout" | "pendente";
  tokens_input: number;
  tokens_output: number;
  modelo_usado?: string;
  resposta_gerada?: string;
  numero_whatsapp?: string;
  erro_mensagem?: string;
  erro_tipo?: string;
  prompt_usado?: string;
}

async function verifyJWT(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(Deno.env.get("JWT_SECRET") || "");
    if (!secret) {
      console.error("JWT_SECRET not configured");
      return null;
    }

    const verified = await jwtVerify(token, secret);
    return verified.payload.sub as string;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

async function logExecution(req: ExecutionLog): Promise<Response> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  // Validação de campos obrigatórios
  if (
    !req.agent_type ||
    typeof req.duracao_ms !== "number" ||
    !req.status ||
    typeof req.tokens_input !== "number" ||
    typeof req.tokens_output !== "number"
  ) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required fields: agent_type, duracao_ms, status, tokens_input, tokens_output",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    // Calcular tokens totais e custo
    const tokens_total = req.tokens_input + req.tokens_output;
    // Preço típico: GPT-4 = $0.00003/input, $0.00006/output
    const custo_usd = req.tokens_input * 0.00003 + req.tokens_output * 0.00006;

    // Inserir na tabela workflow_executions
    const { data: execution, error: execError } = await supabase
      .from("workflow_executions")
      .insert({
        user_id: req.user_id,
        lead_id: req.lead_id || null,
        agent_type: req.agent_type,
        agent_index: req.agent_index || 0,
        duracao_ms: req.duracao_ms,
        timestamp_inicio: new Date().toISOString(),
        timestamp_fim: new Date().toISOString(),
        status: req.status,
        tokens_input: req.tokens_input,
        tokens_output: req.tokens_output,
        tokens_total,
        custo_usd,
        modelo_usado: req.modelo_usado || "gpt-4",
        resposta_gerada: req.resposta_gerada || null,
        numero_whatsapp: req.numero_whatsapp || null,
        erro_mensagem: req.erro_mensagem || null,
        erro_tipo: req.erro_tipo || null,
        prompt_usado: req.prompt_usado || null,
      })
      .select();

    if (execError) {
      console.error("Error inserting execution:", execError);
      return new Response(
        JSON.stringify({
          success: false,
          error: execError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const execution_id = execution[0]?.id;

    // Se houve erro, inserir também em workflow_errors
    if (req.status === "erro" && execution_id) {
      const { error: errorInsertError } = await supabase
        .from("workflow_errors")
        .insert({
          user_id: req.user_id,
          execution_id,
          tipo_erro: req.erro_tipo || "n8n_error",
          mensagem: req.erro_mensagem || "Unknown error",
          numero_whatsapp: req.numero_whatsapp || null,
          agente: req.agent_type,
        });

      if (errorInsertError) {
        console.error("Error inserting error log:", errorInsertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        execution_id,
        stats: {
          tokens_total,
          custo_usd: parseFloat(custo_usd.toFixed(6)),
          duracao_ms: req.duracao_ms,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Apenas POST é permitido
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Extrair e verificar JWT
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid Authorization header",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = authHeader.substring(7);
    const userId = await verifyJWT(token);

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse do body
    const body = await request.json() as ExecutionLog;
    body.user_id = userId;

    // Log the execution
    return await logExecution(body);
  } catch (error) {
    console.error("Request handling error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

Deno.serve(handleRequest);