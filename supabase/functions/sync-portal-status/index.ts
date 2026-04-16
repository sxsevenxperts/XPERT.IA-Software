import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

interface SyncRequest {
  integrationId: string
  portalTipo: 'trf' | 'inss' | 'cnj' | 'outro'
  numeroProcesso: string
}

interface PortalStatus {
  status_atual: string
  ultima_movimentacao: string
  data_ultima_movimentacao: string
  fase_processual: string
  juizo_atual: string
  partes: string[]
  advogados: string[]
  eventos_ultimos_30_dias: number
}

/**
 * Simula scraping de dados do portal judicial
 * Em produção, usaria bibliotecas como cheerio/puppeteer para web scraping real
 */
async function fetchPortalData(
  portalTipo: string,
  numeroProcesso: string
): Promise<PortalStatus> {
  // Simulação realista de dados de diferentes portais
  const mockData: Record<string, PortalStatus> = {
    trf: {
      status_atual: 'em andamento',
      ultima_movimentacao: 'Sentença proferida - aguardando cumprimento',
      data_ultima_movimentacao: new Date().toISOString(),
      fase_processual: '1ª Instância - Execução',
      juizo_atual: 'Tribunal Regional Federal - 1ª Região',
      partes: ['Autor/Empresa X', 'Réu/Empresa Y'],
      advogados: ['OAB/SP 123456', 'OAB/RJ 789012'],
      eventos_ultimos_30_dias: 3,
    },
    inss: {
      status_atual: 'em andamento',
      ultima_movimentacao: 'Recurso administrativo registrado',
      data_ultima_movimentacao: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      fase_processual: 'Recurso Administrativo',
      juizo_atual: 'INSS - Gerência de Benefícios',
      partes: ['Segurado/CPF XXX', 'INSS'],
      advogados: ['OAB/SP 123456'],
      eventos_ultimos_30_dias: 1,
    },
    cnj: {
      status_atual: 'concluso',
      ultima_movimentacao: 'Processo arquivado - Decisão transitada em julgado',
      data_ultima_movimentacao: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      fase_processual: 'Arquivado',
      juizo_atual: 'Superior Tribunal de Justiça',
      partes: ['Autor', 'Réu'],
      advogados: ['OAB/SP 123456'],
      eventos_ultimos_30_dias: 0,
    },
  }

  return (
    mockData[portalTipo] || {
      status_atual: 'em andamento',
      ultima_movimentacao: 'Aguardando nova movimentação',
      data_ultima_movimentacao: new Date().toISOString(),
      fase_processual: 'Pendente',
      juizo_atual: 'Tribunal competente',
      partes: [],
      advogados: [],
      eventos_ultimos_30_dias: 0,
    }
  )
}

/**
 * Main handler para sincronizar status de processo
 */
Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { integrationId, portalTipo, numeroProcesso }: SyncRequest = await req.json()

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Registrar início da sincronização
    const syncLogId = crypto.randomUUID()
    const syncStartTime = new Date().toISOString()

    // 2. Buscar dados do portal (simulated)
    console.log(`Sincronizando ${portalTipo}:${numeroProcesso}...`)
    const portalData = await fetchPortalData(portalTipo, numeroProcesso)

    // 3. Buscar integração para obter user_id
    const { data: integration, error: integrationError } = await supabase
      .from('portal_integrations')
      .select('user_id, caso_id')
      .eq('id', integrationId)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integração não encontrada')
    }

    // 4. Buscar status anterior para detectar mudanças
    const { data: previousStatus } = await supabase
      .from('processo_status')
      .select('status_atual, ultima_movimentacao')
      .eq('integration_id', integrationId)
      .order('sincronizado_em', { ascending: false })
      .limit(1)
      .single()

    // 5. Atualizar ou criar processo_status
    const { error: updateError } = await supabase
      .from('processo_status')
      .upsert([
        {
          integration_id: integrationId,
          user_id: integration.user_id,
          caso_id: integration.caso_id,
          portal_tipo: portalTipo,
          numero_processo: numeroProcesso,
          status_atual: portalData.status_atual,
          ultima_movimentacao: portalData.ultima_movimentacao,
          data_ultima_movimentacao: portalData.data_ultima_movimentacao,
          fase_processual: portalData.fase_processual,
          juizo_atual: portalData.juizo_atual,
          partes: portalData.partes,
          advogados: portalData.advogados,
          eventos_ultimos_30_dias: portalData.eventos_ultimos_30_dias,
          sincronizado_em: syncStartTime,
          notificacao_enviada: false,
        },
      ])

    if (updateError) throw updateError

    // 6. Detectar mudanças e criar alerta se necessário
    let movimentacoesEncontradas = 0
    let notificacoesGeradas = 0

    if (
      previousStatus &&
      previousStatus.status_atual !== portalData.status_atual
    ) {
      movimentacoesEncontradas = 1

      // Criar alerta de mudança de status
      const { error: alertError } = await supabase
        .from('alertas')
        .insert([
          {
            user_id: integration.user_id,
            caso_id: integration.caso_id,
            titulo: `Mudança de Status: ${portalTipo.toUpperCase()}`,
            tipo: 'prazo',
            data_alerta: new Date().toISOString().split('T')[0],
            notificacao_lida: false,
          },
        ])

      if (!alertError) {
        notificacoesGeradas = 1
      }
    }

    // 7. Registrar resultado da sincronização
    const { error: logError } = await supabase
      .from('portal_sync_log')
      .insert([
        {
          user_id: integration.user_id,
          integration_id: integrationId,
          portal_tipo: portalTipo,
          numero_processo: numeroProcesso,
          data_inicio: syncStartTime,
          data_fim: new Date().toISOString(),
          status: 'sucesso',
          movimentacoes_encontradas: movimentacoesEncontradas,
          notificacoes_geradas: notificacoesGeradas,
        },
      ])

    if (logError) console.error('Erro ao registrar log:', logError)

    // 8. Responder com sucesso
    return new Response(
      JSON.stringify({
        success: true,
        processoSync: {
          portal: portalTipo,
          numero: numeroProcesso,
          status: portalData.status_atual,
          movimentacoes: movimentacoesEncontradas,
          notificacoes: notificacoesGeradas,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na sincronização:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
