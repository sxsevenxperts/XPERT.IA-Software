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
    const { user_id, agent_type = 'principal', periodo = '7d' } = await req.json();

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

    // Calculate period
    let daysBack = 7;
    if (periodo === '30d') daysBack = 30;
    if (periodo === '24h') daysBack = 1;

    // Fetch recent executions
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', user_id)
      .eq('agent_type', agent_type)
      .gte('timestamp_inicio', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp_inicio', { ascending: false })
      .limit(100);

    // Fetch feedback data
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('lead_feedback')
      .select('*')
      .eq('user_id', user_id)
      .gte('criado_em', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

    // Fetch current config
    const { data: configData } = await supabase
      .from('agente_config')
      .select('valor')
      .eq('user_id', user_id)
      .eq('chave', 'sistema_prompt')
      .single();

    const currentPrompt = configData?.valor || 'Você é um assistente de vendas padrão.';

    // Analyze patterns
    const analysis = analyzePerformancePatterns(executions || [], feedbacks || []);

    // Generate suggestions
    const sugestoes = generatePromptSuggestions(analysis, currentPrompt, agent_type);

    // Get current stats for comparison
    const { data: stats } = await supabase
      .from('vw_feedback_por_agente')
      .select('*')
      .eq('user_id', user_id)
      .eq('agent_type', agent_type)
      .single();

    return new Response(
      JSON.stringify({
        agent_type,
        periodo,
        prompt_atual: currentPrompt,
        stats_atual: stats || {},
        analise: analysis,
        sugestoes,
        melhor_sugestao: sugestoes[0]?.id || 'v1',
        acoes_recomendadas: [
          'aplicar sugestão e medir por 24h',
          'monitorar taxa_conversao a cada 6h',
          'considerar teste A/B',
          'revisar feedback de leads desistentes',
        ],
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

// Helper: Analyze performance patterns
function analyzePerformancePatterns(executions: any[], feedbacks: any[]) {
  const analysis = {
    total_execucoes: executions.length,
    taxa_sucesso: 0,
    taxa_erro: 0,
    taxa_timeout: 0,
    error_reasons: [] as string[],
    motivos_desistencia: [] as any[],
    prompts_uteis_percent: 0,
    empatia_percent: 0,
    nota_media_sdr: 0,
    issue_patterns: [] as string[],
  };

  // Execution patterns
  const successCount = executions.filter(e => e.status === 'sucesso').length;
  const errorCount = executions.filter(e => e.status === 'erro').length;
  const timeoutCount = executions.filter(e => e.status === 'timeout').length;

  analysis.taxa_sucesso = (successCount / executions.length) * 100 || 0;
  analysis.taxa_erro = (errorCount / executions.length) * 100 || 0;
  analysis.taxa_timeout = (timeoutCount / executions.length) * 100 || 0;

  // Error patterns
  const errorMsgs = executions
    .filter(e => e.erro_mensagem)
    .map(e => e.erro_mensagem);
  analysis.error_reasons = [...new Set(errorMsgs)];

  // Feedback patterns
  const motivos = feedbacks.filter(f => f.motivo_desistencia);
  const motivoGroups = groupBy(motivos, 'motivo_desistencia');
  analysis.motivos_desistencia = Object.entries(motivoGroups).map(([motivo, items]) => ({
    motivo,
    count: (items as any[]).length,
    percent: ((items as any[]).length / feedbacks.length) * 100,
  }));

  // AI Effectiveness
  const promptUteis = feedbacks.filter(f => f.prompt_foi_util === true).length;
  const empatico = feedbacks.filter(f => f.sdr_foi_empatico === true).length;
  const mediaNota = feedbacks.reduce((sum, f) => sum + (f.nota_sdr || 0), 0) / feedbacks.length;

  analysis.prompts_uteis_percent = (promptUteis / feedbacks.length) * 100 || 0;
  analysis.empatia_percent = (empatico / feedbacks.length) * 100 || 0;
  analysis.nota_media_sdr = Math.round(mediaNota * 10) / 10;

  // Identify issues
  if (analysis.taxa_erro > 5) analysis.issue_patterns.push('high_error_rate');
  if (analysis.taxa_timeout > 3) analysis.issue_patterns.push('timeout_issues');
  if (analysis.prompts_uteis_percent < 60) analysis.issue_patterns.push('prompt_effectiveness_low');
  if (analysis.nota_media_sdr < 3.5) analysis.issue_patterns.push('low_sdr_rating');

  return analysis;
}

// Helper: Generate prompt suggestions
function generatePromptSuggestions(analysis: any, currentPrompt: string, agentType: string) {
  const sugestoes = [];

  // Suggestion 1: Qualification Focus (if many "orçamento" reasons)
  if (analysis.motivos_desistencia.some((m: any) => m.motivo === 'orçamento' && m.percent > 20)) {
    sugestoes.push({
      id: 'v1',
      descricao: 'Melhorar qualificação de orçamento no início da conversa',
      prompt_novo: currentPrompt +
        '\n\n[IMPORTANTE] Sempre qualifique o orçamento disponível nos primeiros 2 turnos. ' +
        'Pergunte: "Qual é seu range orçamentário para esta solução?" ' +
        'Se sem orçamento definido, redirecione para stakeholder adequado.',
      impacto_esperado: '+8-12% taxa_conversao',
      confianca: 0.78,
      baseado_em: ['motivo_desistencia: orçamento (>20%)'],
      teste_ab: true,
    });
  }

  // Suggestion 2: Empathy/Tone (if low nota_sdr)
  if (analysis.nota_media_sdr < 3.5) {
    sugestoes.push({
      id: 'v2',
      descricao: 'Aumentar tom empático e validação de objeções',
      prompt_novo: currentPrompt +
        '\n\n[TOME] Sempre valide as preocupações do prospect ANTES de responder. ' +
        'Exemplo: "Entendo sua preocupação com o custo, é uma pergunta muito válida." ' +
        'Isso constrói rapport e aumenta engajamento.',
      impacto_esperado: '+5-8% nota_sdr',
      confianca: 0.71,
      baseado_em: ['nota_media_sdr: ' + analysis.nota_media_sdr],
      teste_ab: true,
    });
  }

  // Suggestion 3: Prompt Effectiveness (if low prompts_uteis_percent)
  if (analysis.prompts_uteis_percent < 60) {
    sugestoes.push({
      id: 'v3',
      descricao: 'Simplificar e focar em valor (não features)',
      prompt_novo: currentPrompt +
        '\n\n[FOCO] Cada resposta deve focar no valor/problema resolvido, não em features técnicas. ' +
        'Use exemplos de clientes similares. Frame: "Problema do cliente → Nossa solução → Resultado"',
      impacto_esperado: '+6-10% prompts_uteis',
      confianca: 0.68,
      baseado_em: ['prompts_uteis_percent: ' + analysis.prompts_uteis_percent],
      teste_ab: false,
    });
  }

  // Suggestion 4: Error Recovery (if high error rate)
  if (analysis.taxa_erro > 5) {
    sugestoes.push({
      id: 'v4',
      descricao: 'Adicionar fallback para casos de erro',
      prompt_novo: currentPrompt +
        '\n\n[ERRO_HANDLING] Se não conseguir responder diretamente, sempre ofereça: ' +
        '"Vou verificar esse detalhe com nosso time e retorno em 1h. Posso detalhar outro ponto enquanto isso?"',
      impacto_esperado: '-3-5% taxa_erro (melhora UX)',
      confianca: 0.65,
      baseado_em: ['taxa_erro: ' + analysis.taxa_erro + '%'],
      teste_ab: false,
    });
  }

  // Default suggestion if no specific issues
  if (sugestoes.length === 0) {
    sugestoes.push({
      id: 'v1',
      descricao: 'Performance atual está boa! Considere focar em objections handling',
      prompt_novo: currentPrompt +
        '\n\n[ENHANCEMENT] Adicione tratamento proativo para objeções comuns: ' +
        '"Uma coisa que ouço é X. Na verdade, Y porque Z. Quer que eu detalhe?"',
      impacto_esperado: '+2-4% taxa_conversao',
      confianca: 0.60,
      baseado_em: ['performance_good', 'opportunistic_improvement'],
      teste_ab: false,
    });
  }

  return sugestoes;
}

// Helper: Group array by key
function groupBy(arr: any[], key: string) {
  return arr.reduce((acc, item) => {
    const group = item[key] || 'unknown';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}
