import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyJWT } from '../_shared/jwt.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // JWT Verification
    const authHeader = req.headers.get('authorization')?.split(' ')[1];
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = await verifyJWT(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request
    const { lead_id, user_id } = await req.json();

    if (!lead_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id and user_id are required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Fetch feedback data for the lead
    const { data: feedback, error: feedbackError } = await supabase
      .from('lead_feedback')
      .select('*')
      .eq('lead_id', lead_id)
      .eq('user_id', user_id)
      .single();

    // Fetch agent statistics
    const { data: agentStats, error: agentError } = await supabase
      .from('vw_feedback_por_agente')
      .select('*')
      .eq('user_id', user_id)
      .limit(1);

    // Fetch workflow execution data
    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('lead_id', lead_id)
      .eq('user_id', user_id)
      .order('timestamp_inicio', { ascending: false })
      .limit(1)
      .single();

    // Scoring Algorithm
    let score = 50; // Baseline
    const factors = {
      positive: [] as string[],
      negative: [] as string[],
      risks: [] as string[],
    };

    // Positive Factors from Feedback
    if (feedback?.prompt_foi_util === true) {
      score += 20;
      factors.positive.push('prompt_util');
    }
    if (feedback?.sdr_foi_empatico === true) {
      score += 15;
      factors.positive.push('empatia');
    }
    if (feedback?.sdr_criou_engajamento === true) {
      score += 25;
      factors.positive.push('engajamento');
    }

    // Agent Type Performance
    if (agentStats && agentStats.length > 0) {
      const agent = agentStats[0];
      if ((agent.taxa_conversao_percent || 0) > 60) {
        score += 20;
        factors.positive.push('agent_performance_alta');
      }
      if ((agent.nota_media_sdr || 0) >= 4.0) {
        score += 15;
        factors.positive.push('sdr_nota_alta');
      }
    }

    // Execution Quality
    if (execution?.status === 'sucesso') {
      score += 10;
      factors.positive.push('execucao_sucesso');
    } else if (execution?.status === 'erro' || execution?.status === 'timeout') {
      score -= 25;
      factors.negative.push('execution_error');
      factors.risks.push('timeout_detecção');
    }

    if ((execution?.duracao_ms || 0) < 2000) {
      score += 5;
      factors.positive.push('resposta_rapida');
    } else if ((execution?.duracao_ms || 0) > 5000) {
      score -= 10;
      factors.risks.push('resposta_lenta');
    }

    // Lead History Risks
    if (feedback?.motivo_desistencia === 'orçamento') {
      factors.risks.push('budget_concern');
      score -= 5;
    }
    if (feedback?.motivo_desistencia === 'timing') {
      factors.risks.push('timing_issue');
      score -= 8;
    }
    if (feedback?.motivo_desistencia === 'concorrência') {
      factors.risks.push('competition');
      score -= 10;
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Calculate conversion probability (sigmoid-like function)
    const probability = score / 100;

    // Calculate confidence based on data points
    const dataPoints = (agentStats?.length || 0) + (feedback ? 1 : 0) + (execution ? 1 : 0);
    const confidence = Math.min(dataPoints / 5, 1.0);

    // Recommendation
    let recomendacao = 'standard_follow_up';
    if (probability >= 0.75 && confidence >= 0.7) {
      recomendacao = 'close_now';
    } else if (probability >= 0.60 && probability < 0.75) {
      recomendacao = 'follow_up_urgente';
    } else if (probability < 0.3) {
      recomendacao = 'wait_ou_requalificar';
    }

    return new Response(
      JSON.stringify({
        lead_id,
        conversion_probability: Number(probability.toFixed(2)),
        score: Number(score.toFixed(1)),
        confidence: Number(confidence.toFixed(2)),
        factors,
        recomendacao,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
