// Prompts otimizados para cada tipo de análise com Claude AI
// Uso: import { buildPrompt } from './prompts.js'

export function buildPromptEstoqueDiario(dados) {
  return `Você é especialista em varejo e gestão de estoques.

DADOS DE ENTRADA:
Data: ${dados.data}
Produtos Críticos: ${JSON.stringify(dados.estoque_critico)}
Perdas 24h: ${JSON.stringify(dados.perdas_24h)}
Validades Críticas: ${JSON.stringify(dados.validades_criticas)}
Receita Ontem: R$ ${dados.receita_ontem}
Receita Média (7d): R$ ${dados.receita_media_7d}
Variação: ${dados.variacao_pct}%

TAREFA: Analise e responda EXATAMENTE em JSON (sem textos extras):

{
  "titulo": "string (resumo problema)",
  "por_que_aconteceu": "string (correlações e causas raiz)",
  "numeros_chave": {
    "produtos_criticos": number,
    "perda_24h": number,
    "perda_pct_receita": number,
    "dias_pior_produto": number
  },
  "risco_imediato": "string (o que pode acontecer em 24h)",
  "recomendacoes": ["string", "string", "string"],
  "acoes_por_setor": {
    "gerencia": "string",
    "estoque": "string",
    "vendas": "string",
    "operacoes": "string"
  },
  "impacto_estimado": number (em R$),
  "impacto_pct": number,
  "confianca": number (0-1)
}

IMPORTANTE: Responda APENAS o JSON, nenhum texto adicional.`
}

export function buildPromptComportamentoCliente(dados) {
  return `Você é especialista em segmentação de clientes e análise de retenção.

DADOS DO CLIENTE:
Nome: ${dados.dados_cliente.nome}
LTV: R$ ${dados.dados_cliente.ltv}
Compras (90d): ${dados.dados_cliente.numero_compras}
Dias desde última: ${dados.dados_cliente.dias_ultimo_acesso}
Ticket médio: R$ ${dados.dados_cliente.ticket_medio}
Categoria favorita: ${dados.dados_cliente.categoria_favorita}
RFM: ${dados.segmentacao_rfm.rfm_class}

ANÁLISE em JSON:

{
  "titulo": "string",
  "segmentacao": "string (VIP, Regular, At-Risk)",
  "por_que_aconteceu": "string",
  "ltv_atual": number,
  "ltv_12meses_projetado": number,
  "propensao_churn": {
    "30_dias": number,
    "60_dias": number,
    "90_dias": number,
    "motivo_provavel": "string"
  },
  "propensao_upsell": number,
  "propensao_cross_sell": number,
  "recomendacao_produto": "string",
  "acoes_sugeridas": [{"tipo": "email|sms|notificacao|cupom", "conteudo": "string", "prazo": "string"}],
  "confianca": number
}

Apenas JSON.`
}

export function buildPromptPrevisaoDemanda(dados) {
  return `Especialista em demand forecasting para varejo.

HISTÓRICO (últimos 90 dias): ${dados.dados_historicos_90d.length} registros
VARIÁVEIS: ${JSON.stringify(dados.variaveis_externas)}
ESTOQUE: ${dados.estoque_atual} unidades
VELOCIDADE: ${dados.velocidade_venda_media} un/dia

PREVISÃO para próximos 30 dias:

{
  "titulo": "string",
  "semana_1": {"quantidade_prevista": number, "confianca": number, "fator_principal": "string"},
  "semana_2": {"quantidade_prevista": number, "confianca": number, "fator_principal": "string"},
  "semana_3": {"quantidade_prevista": number, "confianca": number, "fator_principal": "string"},
  "semana_4": {"quantidade_prevista": number, "confianca": number, "fator_principal": "string"},
  "total_previsto": number,
  "acurácia_historica": number,
  "recomendacao_estoque_minimo": number,
  "risco": "string",
  "confianca_geral": number
}

Apenas JSON.`
}

export function buildPromptOportunidadeUpsell(dados) {
  return `Especialista em vendas e oportunidades de crescimento.

COMPRA AGORA: ${JSON.stringify(dados.compra_realizada.produtos)}
LTV CLIENTE: R$ ${dados.historico_cliente.ltv}
PRODUTOS COMPATÍVEIS: ${dados.historico_cliente.produtos_nunca_comprados.length}

TOP 3 OPORTUNIDADES:

{
  "cliente_id": "string",
  "compra_base": number,
  "oportunidades": [
    {
      "posicao": 1,
      "produto": "string",
      "categoria": "string",
      "por_que": "string",
      "probabilidade": number,
      "preco": number,
      "aumento_ticket": number,
      "quando": "imediatamente|proxima_visita|sms_amanha",
      "como": "string"
    }
  ],
  "potencial_total": number,
  "aumento_ticket_pct": number,
  "confianca": number
}

Apenas JSON.`
}

export function buildPromptDeteccaoChurn(dados) {
  return `Especialista em retenção de clientes e churn.

CLIENTES EM RISCO: ${dados.clientes_risco.length}

{
  "titulo": "string",
  "clientes": [
    {
      "cliente_id": "string",
      "nome": "string",
      "propensao_churn": number,
      "dias_ate_perda": number,
      "por_que": "string",
      "ltv_perdido": number,
      "ltv_recuperado_potencial": number,
      "acao_resgate_1": {"acao": "string", "probabilidade_sucesso": number, "tempo_envio": "string"},
      "acao_resgate_2": {"acao": "string", "probabilidade_sucesso": number, "tempo_envio": "string"},
      "confianca": number
    }
  ],
  "oportunidade_total": number,
  "custo_retencao": number,
  "roi": number
}

Apenas JSON.`
}

export const TEMPLATES = {
  estoque_diario: {
    tipo: 'estoque_diario',
    frequencia: 'diariamente 6AM',
    trigger: 'Automático',
    builder: buildPromptEstoqueDiario,
    expected_tokens: { input: 2500, output: 800 }
  },
  comportamento_cliente: {
    tipo: 'comportamento_cliente',
    frequencia: 'semanalmente',
    trigger: 'Automático',
    builder: buildPromptComportamentoCliente,
    expected_tokens: { input: 3200, output: 1100 }
  },
  previsao_demanda: {
    tipo: 'previsao_demanda',
    frequencia: 'diariamente 5AM',
    trigger: 'Automático',
    builder: buildPromptPrevisaoDemanda,
    expected_tokens: { input: 4800, output: 1500 }
  },
  oportunidade_upsell: {
    tipo: 'oportunidade_upsell',
    frequencia: 'real-time',
    trigger: 'Transação nova',
    builder: buildPromptOportunidadeUpsell,
    expected_tokens: { input: 1800, output: 600 }
  },
  deteccao_churn: {
    tipo: 'deteccao_churn',
    frequencia: 'diariamente 11AM',
    trigger: 'Automático',
    builder: buildPromptDeteccaoChurn,
    expected_tokens: { input: 2100, output: 900 }
  }
}
