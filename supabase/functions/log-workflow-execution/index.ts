import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const payload = await req.json();

    // Validate JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Validate token and get user
    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = data.user.id;

    // Validate payload
    const requiredFields = [
      "agent_type",
      "duracao_ms",
      "status",
      "tokens_input",
      "tokens_output",
    ];
    const missingFields = requiredFields.filter((field) => !(field in payload));

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          missing: missingFields,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare data for insertion
    const executionData = {
      user_id,
      lead_id: payload.lead_id || null,
      agent_type: payload.agent_type, // 'principal', 'objecao', 'extra'
      agent_index: payload.agent_index || 0,
      
      // Performance
      duracao_ms: payload.duracao_ms,
      timestamp_inicio: payload.timestamp_inicio || new Date().toISOString(),
      timestamp_fim: new Date().toISOString(),
      status: payload.status, // 'sucesso', 'erro', 'timeout'
      
      // Tokens e Custo
      tokens_input: payload.tokens_input || 0,
      tokens_output: payload.tokens_output || 0,
      tokens_total: (payload.tokens_input || 0) + (payload.tokens_output || 0),
      custo_usd:
        ((payload.tokens_input || 0) * 0.00003 +
          (payload.tokens_output || 0) * 0.00006) || payload.custo_usd || 0,
      
      // Contexto
      modelo_usado: payload.modelo_usado || "gpt-4-turbo",
      prompt_usado: payload.prompt_usado ? payload.prompt_usado.substring(0, 3000) : null,
      resposta_gerada: payload.resposta_gerada ? payload.resposta_gerada.substring(0, 5000) : null,
      numero_whatsapp: payload.numero_whatsapp || null,
      
      // Erros
      erro_mensagem: payload.erro_mensagem || null,
      erro_tipo: payload.erro_tipo || null,
    };

    // Insert execution log
    const { data: execution, error: insertError } = await supabase
      .from("workflow_executions")
      .insert([executionData])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting execution log:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to log execution",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If there was an error in execution, also log it in workflow_errors
    if (payload.erro_mensagem && payload.status === "erro") {
      const errorData = {
        user_id,
        execution_id: execution.id,
        tipo_erro: payload.erro_tipo || "n8n_error",
        codigo_erro: payload.codigo_erro || null,
        mensagem: payload.erro_mensagem,
        stack_trace: payload.stack_trace || null,
        numero_whatsapp: payload.numero_whatsapp || null,
        agente: payload.agent_type,
        resolvido: false,
      };

      const { error: errorLogError } = await supabase
        .from("workflow_errors")
        .insert([errorData]);

      if (errorLogError) {
        console.warn("Warning: Failed to log error details:", errorLogError);
        // Don't fail the request, just log warning
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        execution_id: execution.id,
        message: "Execution logged successfully",
        stats: {
          tokens_total: executionData.tokens_total,
          custo_usd: executionData.custo_usd,
          duracao_ms: executionData.duracao_ms,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
