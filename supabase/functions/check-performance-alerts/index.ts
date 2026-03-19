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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const alerts = [];

    // ===== ALERT 1: Error Rate Spike =====
    const { data: recentStats } = await supabase
      .from('vw_workflow_stats_por_usuario')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (recentStats && recentStats.taxa_sucesso_percent < 95) {
      const errorRate = 100 - (recentStats.taxa_sucesso_percent || 0);
      if (errorRate > 5) {
        alerts.push({
          tipo: 'error_rate_spike',
          severidade: errorRate > 10 ? 'critical' : 'warning',
          mensagem: `Taxa de erro: ${errorRate.toFixed(1)}% (limite: 5%)`,
          dados: {
            taxa_atual: errorRate / 100,
            taxa_limite: 0.05,
            total_execucoes: recentStats.total_execucoes,
          },
          acao: 'revisar logs, verificar API keys',
        });
      }
    }

    // ===== ALERT 2: Conversion Drop =====
    const { data: current7d } = await supabase
      .from('vw_performance_7dias')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const { data: previous7d } = await supabase
      .from('vw_performance_periodo_anterior')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (current7d && previous7d) {
      const currentRate = (current7d.taxa_conversao_7d || 0) / 100;
      const previousRate = (previous7d.taxa_conversao_anterior || 0) / 100;
      const changePct = ((currentRate - previousRate) / previousRate) * 100;

      if (changePct < -20) {
        alerts.push({
          tipo: 'conversion_drop',
          severidade: changePct < -30 ? 'critical' : 'warning',
          mensagem: `Taxa de conversão baixou ${Math.abs(changePct).toFixed(1)}% (era ${previousRate * 100}%, agora ${currentRate * 100}%)`,
          dados: {
            taxa_atual: currentRate,
            taxa_anterior: previousRate,
            mudanca_percent: changePct,
            periodo: '7 dias',
          },
          acao: 'aplicar otimização de prompt, revisar leads recentes',
        });
      }
    }

    // ===== ALERT 3: Token Budget =====
    const { data: userPlan } = await supabase
      .from('assinaturas')
      .select('creditos_tokens')
      .eq('user_id', user_id)
      .single();

    if (userPlan && userPlan.creditos_tokens) {
      const { data: monthlyStats } = await supabase
        .from('vw_workflow_stats_por_usuario')
        .select('tokens_totais')
        .eq('user_id', user_id)
        .single();

      if (monthlyStats && monthlyStats.tokens_totais) {
        const tokensUsed = monthlyStats.tokens_totais;
        const tokenLimit = userPlan.creditos_tokens;
        const usagePercent = (tokensUsed / tokenLimit) * 100;

        if (usagePercent > 80) {
          const daysRemaining = Math.ceil((new Date().getDate()) / 30 * 30);
          const tokensPerDay = tokensUsed / Math.max(1, new Date().getDate());

          alerts.push({
            tipo: 'token_budget',
            severidade: usagePercent > 95 ? 'critical' : 'warning',
            mensagem: `Tokens consumidos: ${(tokensUsed / 1000000).toFixed(1)}M / ${(tokenLimit / 1000000).toFixed(1)}M (${usagePercent.toFixed(0)}%)`,
            dados: {
              tokens_usados: tokensUsed,
              tokens_limite: tokenLimit,
              percentual: usagePercent / 100,
              dias_restantes: daysRemaining,
              tokens_por_dia: Math.round(tokensPerDay),
            },
            acao: usagePercent > 95 ? 'upgrade imediato recomendado' : 'considerar upgrade de plano',
          });
        }
      }
    }

    // ===== ALERT 4: Response Timeout =====
    const { data: recentTimeouts, error: timeoutError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'timeout')
      .gte('timestamp_inicio', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('timestamp_inicio', { ascending: false });

    if (recentTimeouts && recentTimeouts.length >= 3) {
      const modelos = [...new Set(recentTimeouts.map(t => t.modelo_usado))];
      alerts.push({
        tipo: 'response_timeout',
        severidade: 'critical',
        mensagem: `Detectados ${recentTimeouts.length} timeouts nas últimas 6 horas`,
        dados: {
          ultimos_timeouts: recentTimeouts.length,
          periodo_horas: 6,
          modelos_afetados: modelos,
        },
        acao: 'switch para modelo mais rápido, contatar provider',
      });
    }

    // ===== ALERT 5: Response Slow =====
    if (recentStats && recentStats.duracao_media_ms > 5000) {
      alerts.push({
        tipo: 'response_slow',
        severidade: 'warning',
        mensagem: `Duração média de resposta: ${recentStats.duracao_media_ms.toFixed(0)}ms (ideal: <2s)`,
        dados: {
          duracao_media_ms: recentStats.duracao_media_ms,
          duracao_maxima_ms: recentStats.duracao_maxima_ms,
          total_execucoes_medidas: recentStats.total_execucoes,
        },
        acao: 'considerar switch para modelo mais rápido',
      });
    }

    // ===== ALERT 6: SDR Rating Low =====
    const { data: feedbackStats } = await supabase
      .from('vw_efetividade_ia')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (feedbackStats && feedbackStats.nota_media_sdr < 3.5) {
      alerts.push({
        tipo: 'sdr_rating_low',
        severidade: 'warning',
        mensagem: `Nota média SDR: ${feedbackStats.nota_media_sdr}/5.0 (abaixo do esperado)`,
        dados: {
          nota_media_sdr: feedbackStats.nota_media_sdr,
          total_feedbacks: feedbackStats.total_feedbacks,
          empatia_percent: feedbackStats.empatia_percent,
          prompts_uteis_percent: feedbackStats.prompts_uteis_percent,
        },
        acao: 'revisar feedback, aplicar otimização de prompt para empatia',
      });
    }

    // ===== ALERT 7: High Error Rate by Agent =====
    const { data: agentStats } = await supabase
      .from('vw_taxa_erro_por_agente')
      .select('*')
      .eq('user_id', user_id);

    if (agentStats) {
      for (const agent of agentStats) {
        if ((agent.taxa_erro_percent || 0) > 10) {
          alerts.push({
            tipo: 'agent_error_rate_high',
            severidade: agent.taxa_erro_percent > 15 ? 'critical' : 'warning',
            mensagem: `Agente ${agent.agent_type}: Taxa de erro ${agent.taxa_erro_percent}%`,
            dados: {
              agent_type: agent.agent_type,
              taxa_erro_percent: agent.taxa_erro_percent,
              total_execucoes: agent.total_execucoes,
              total_erros: agent.total_erros,
            },
            acao: `revisar configuração do agente ${agent.agent_type}`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        alerts,
        total_alertas: alerts.length,
        alertas_criticos: alerts.filter(a => a.severidade === 'critical').length,
        alertas_warning: alerts.filter(a => a.severidade === 'warning').length,
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
