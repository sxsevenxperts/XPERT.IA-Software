# 📊 XPERT.IA Phase 2 & 3 — Analytics + AI-Powered Features

**Status:** 🔄 Em Implementação
**Versão:** 1.0
**Data:** 2026-03-19

---

## Fase 2: Analytics de Taxa de Vitória

### 2.1 Dashboard de Performance SDR

**Página Nova:** `page-analytics` em `software/index.html`

**Seções:**

#### A. Win Rate Dashboard (últimas 24h)
- **KPIs:**
  - Taxa de conversão (%) — leads vendidos / total
  - Receita total — soma valor_venda
  - Nota média SDR — avg(nota_sdr)
  - Efetividade por agente (tabela)

#### B. Performance por Agente
- **Tabela:**
  - Agent Type | Total Execuções | Taxa Sucesso | Taxa Erro | Avg Duração | Tokens | Custo | Win Rate | Receita

- **Gráficos:**
  - Win Rate por agente (bar chart)
  - Receita por agente (pie chart)
  - Conversão timeline (line chart)

#### C. Filtros Avançados
- Data range (calendar picker)
- Por agente (checkbox multi-select)
- Por status (sucesso/erro/timeout)
- Valor venda mínimo/máximo
- Taxa sucesso mínima

#### D. Análise de Motivos
- Motivos de desistência (pie chart)
  - Orçamento
  - Timing
  - Concorrência
  - Outro

#### E. Satisfação SDR
- Distribuição de notas (1-5 stars histogram)
- Comentários mais comuns
- Prompts úteis (%)
- Engajamento criado (%)

#### F. Exportação
- Botão "Exportar CSV" → lê `lead_feedback` com filtros
- Inclui: agent_type, lead_id, vendido, motivo, valor, nota, timestamp

---

### 2.2 Novas Views SQL

```sql
-- Feedback por Agente (Phase 2)
CREATE OR REPLACE VIEW vw_feedback_por_agente AS
SELECT
  lf.user_id,
  COALESCE(we.agent_type, 'principal') as agent_type,
  COUNT(DISTINCT lf.lead_id) as total_leads,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos,
  SUM(CASE WHEN lf.vendido = FALSE THEN 1 ELSE 0 END) as leads_desistencia,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_conversao_percent,
  SUM(CASE WHEN lf.valor_venda > 0 THEN lf.valor_venda ELSE 0 END) as receita_total,
  ROUND(AVG(lf.nota_sdr)::NUMERIC, 2) as nota_media_sdr,
  SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END) as sdr_empatico_count,
  SUM(CASE WHEN lf.sdr_criou_engajamento = TRUE THEN 1 ELSE 0 END) as engajamento_count
FROM lead_feedback lf
LEFT JOIN workflow_executions we ON lf.lead_id = we.lead_id AND lf.user_id = we.user_id
GROUP BY lf.user_id, we.agent_type;

-- Receita e Taxa de Conversão por Período
CREATE OR REPLACE VIEW vw_receita_timeline AS
SELECT
  lf.user_id,
  DATE_TRUNC('day', lf.criado_em) as data,
  COUNT(DISTINCT lf.lead_id) as total_leads,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_venda_dia,
  COALESCE(SUM(lf.valor_venda), 0) as receita_dia
FROM lead_feedback lf
GROUP BY lf.user_id, DATE_TRUNC('day', lf.criado_em)
ORDER BY data DESC;

-- Análise de Motivos de Desistência
CREATE OR REPLACE VIEW vw_motivos_desistencia AS
SELECT
  lf.user_id,
  lf.motivo_desistencia,
  COUNT(*) as total,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM lead_feedback WHERE vendido = FALSE AND user_id = lf.user_id)) * 100, 2) as percentual
FROM lead_feedback lf
WHERE lf.vendido = FALSE
GROUP BY lf.user_id, lf.motivo_desistencia;

-- Efetividade da IA (Prompt útil, empatia, engajamento)
CREATE OR REPLACE VIEW vw_efetividade_ia AS
SELECT
  lf.user_id,
  COUNT(*) as total_feedbacks,
  SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END) as prompts_uteis,
  SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END) as empatia_count,
  SUM(CASE WHEN lf.sdr_foi_objetivo = TRUE THEN 1 ELSE 0 END) as objetivo_count,
  SUM(CASE WHEN lf.sdr_criou_engajamento = TRUE THEN 1 ELSE 0 END) as engajamento_count,
  ROUND((SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as prompts_uteis_percent,
  ROUND((SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as empatia_percent
FROM lead_feedback lf
GROUP BY lf.user_id;
```

---

## Fase 3: AI-Powered Features

### 3.1 Probabilidade de Conversão Previsível

**Edge Function:** `predict-conversion-probability`

```typescript
POST /functions/v1/predict-conversion-probability
Body: { lead_id, user_id, features? }

Returns:
{
  lead_id: "uuid",
  conversion_probability: 0.87, // 0-1
  confidence: 0.92,
  factors: {
    positive: ["nota_sdr_alta", "prompt_util", "engajamento"],
    negative: ["timeout_detecção", "multiple_objections"],
    riscos: ["budget_concern", "timing"]
  },
  recomendacao: "follow_up_urgente" // ou "wait", "close_now"
}
```

**Algoritmo (v1 - Scoring):**
```
score = 0

// Histórico da IA
+ prompt_foi_util: +20%
+ sdr_foi_empatico: +15%
+ sdr_criou_engajamento: +25%

// Histórico do Lead
+ lead_qualificado: +30%
+ múltiplas_interações: +15% (por interação)
- multiple_objections: -10% (por objeção)
- timeout_detecção: -25%

// Dinâmica do Agente
+ agent_taxa_conversao > 60%: +20%
+ agent_tempo_resposta < 2s: +10%

// Temporal
+ última_interação < 24h: +5%
- inactive_7dias: -15%

conversion_probability = sigmoid(score)
```

**Histórico de Dados:**
- Usar `lead_feedback.vendido` para training
- Usar `workflow_executions` para feature extraction
- Usar `agente_config` para agent config matching

---

### 3.2 Otimização Automática de Prompts

**Edge Function:** `optimize-prompt-auto`

```typescript
POST /functions/v1/optimize-prompt-auto
Body: { user_id, agent_type, periodo: "24h|7d|30d" }

Returns:
{
  agent_type: "principal",
  prompt_atual: "...",
  sugestoes: [
    {
      id: "v1",
      descricao: "Adicionar foco em qualificação orçamentária",
      prompt_novo: "...",
      impacto_esperado: "+8% taxa_conversao",
      confianca: 0.75,
      baseado_em: ["motivo_desistencia: orçamento", "feedback: 'budget_concern'"],
      teste_ab: false
    },
    {
      id: "v2",
      descricao: "Aumentar tom empático",
      prompt_novo: "...",
      impacto_esperado: "+5% nota_sdr",
      confianca: 0.68
    }
  ],
  melhor_sugestao: "v1",
  acoes_recomendadas: [
    "aplicar prompt v1 e medir por 24h",
    "ativar teste A/B entre prompt v1 e atual",
    "monitorar taxa_conversao a cada 6h"
  ]
}
```

**Lógica:**
1. Analisa últimos 100 execuções
2. Identifica padrões de falha (high error, low conversion)
3. Mapeia para motivos de desistência
4. Gera variações de prompt (via Claude API)
5. Estima impacto usando histórico
6. Retorna top 3 sugestões

**Exemplo de Análise:**
```
Input: lead_feedback.motivo_desistencia = "orçamento" (35% das desistências)
       agent_taxa_conversao = 42%
       nota_media_sdr = 3.2/5.0

Output: "Seu agente precisa qualificar melhor orçamento.
         Sugestão: adicionar pergunta de range orçamentário no início.
         Impacto esperado: +8-12% conversão"
```

---

### 3.3 Alertas em Tempo Real

**Edge Function:** `check-performance-alerts`

```typescript
POST /functions/v1/check-performance-alerts
Body: { user_id }

Returns:
{
  alerts: [
    {
      tipo: "error_rate_spike",
      severidade: "critical", // warning, critical
      mensagem: "Taxa de erro do Agente Principal: 8.5% (limite: 5%)",
      dados: {
        taxa_atual: 0.085,
        taxa_limite: 0.05,
        ultimas_execucoes: 120,
        ultimas_2h: true
      },
      acao: "revisar logs, verificar API keys"
    },
    {
      tipo: "conversion_drop",
      severidade: "warning",
      mensagem: "Taxa de conversão baixou para 38% (era 52% semana passada)",
      dados: {
        taxa_atual: 0.38,
        taxa_anterior: 0.52,
        mudanca_percent: -26.9
      },
      acao: "aplicar otimização de prompt"
    },
    {
      tipo: "token_budget",
      severidade: "warning",
      mensagem: "Tokens consumidos: 8.2M / 10M (82%)",
      dados: {
        tokens_usados: 8200000,
        tokens_limite: 10000000,
        percentual: 0.82,
        dias_restantes: 8,
        tokens_por_dia: 1025000
      },
      acao: "considerar upgrade de plano"
    },
    {
      tipo: "response_timeout",
      severidade: "critical",
      mensagem: "Detectados 3 timeouts em 6 horas",
      dados: {
        ultimos_timeouts: 3,
        periodo_horas: 6,
        modelo_afetado: "gpt-4o"
      },
      acao: "switch para gpt-4o-mini, contatar OpenAI"
    }
  ],
  timestamp: "2026-03-19T14:30:00Z"
}
```

**Regras de Alerta:**

| Alerta | Condição | Severidade |
|--------|----------|-----------|
| error_rate_spike | taxa_erro > 5% nas últimas 2h | critical |
| conversion_drop | queda > 20% comparado com semana anterior | warning |
| token_budget | tokens usados > 80% | warning |
| response_timeout | 3+ timeouts em 6h | critical |
| response_slow | duracao_media > 5s | warning |
| agent_performance | nota_sdr < 3.0 | warning |

---

### 3.4 Implementação da UI — Página Analytics

**Nova página em `software/index.html`:**
```html
<!-- page-analytics -->
<div id="page-analytics" class="page" style="display:none;">
  <!-- Tabs -->
  <div class="analytics-tabs">
    <button onclick="showAnalyticsTab('win-rate', this)" class="tab-btn active">
      📈 Win Rate
    </button>
    <button onclick="showAnalyticsTab('performance', this)" class="tab-btn">
      ⚡ Performance
    </button>
    <button onclick="showAnalyticsTab('ai-insights', this)" class="tab-btn">
      🤖 AI Insights
    </button>
    <button onclick="showAnalyticsTab('alerts', this)" class="tab-btn">
      🚨 Alertas
    </button>
  </div>

  <!-- TAB 1: Win Rate -->
  <div id="tab-win-rate" class="analytics-content" style="display:block;">
    <!-- KPIs -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value" id="kpi-conversao">42%</div>
        <div class="metric-label">Taxa Conversão</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="kpi-receita">R$ 45.200</div>
        <div class="metric-label">Receita Total</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="kpi-nota-sdr">4.2/5.0</div>
        <div class="metric-label">Nota SDR</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="kpi-prompts-util">78%</div>
        <div class="metric-label">Prompts Úteis</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section">
      <label>Data Range:
        <input type="date" id="filter-date-from" onchange="refreshAnalytics()">
        até
        <input type="date" id="filter-date-to" onchange="refreshAnalytics()">
      </label>
      <label>Agente:
        <select id="filter-agent" onchange="refreshAnalytics()">
          <option value="">Todos</option>
          <option value="principal">Principal</option>
          <option value="objecao">Objeção</option>
          <option value="extra">Extra</option>
        </select>
      </label>
      <button onclick="exportAnalyticsCSV()">📥 Exportar CSV</button>
    </div>

    <!-- Gráficos -->
    <div class="charts-row">
      <div class="chart-container">
        <canvas id="chart-win-rate-agent"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="chart-receita-agent"></canvas>
      </div>
    </div>

    <!-- Tabela Performance por Agente -->
    <table id="table-performance-agents" class="data-table">
      <thead>
        <tr>
          <th>Agente</th>
          <th>Total Leads</th>
          <th>Vendidos</th>
          <th>Taxa %</th>
          <th>Receita</th>
          <th>Nota SDR</th>
          <th>Prompt Útil %</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <!-- TAB 2: Performance -->
  <div id="tab-performance" class="analytics-content" style="display:none;">
    <!-- Motivos de Desistência -->
    <div class="section">
      <h3>Motivos de Desistência</h3>
      <canvas id="chart-motivos"></canvas>
    </div>

    <!-- Satisfação SDR -->
    <div class="section">
      <h3>Distribuição de Notas SDR</h3>
      <canvas id="chart-notas-sdr"></canvas>
    </div>

    <!-- Timeline de Conversão -->
    <div class="section">
      <h3>Timeline de Conversão (7 últimos dias)</h3>
      <canvas id="chart-conversao-timeline"></canvas>
    </div>
  </div>

  <!-- TAB 3: AI Insights -->
  <div id="tab-ai-insights" class="analytics-content" style="display:none;">
    <div id="ai-insights-container">
      <!-- Preenchido por JavaScript -->
    </div>
  </div>

  <!-- TAB 4: Alertas -->
  <div id="tab-alerts" class="analytics-content" style="display:none;">
    <div id="alerts-container">
      <!-- Preenchido por JavaScript -->
    </div>
  </div>
</div>
```

---

## Funcionalidades JavaScript Necessárias

### Phase 2 Functions

```javascript
// Carregar dados de feedback
async function loadAnalyticsData() {
  const { data } = await supabase
    .from('vw_feedback_por_agente')
    .select('*')
    .eq('user_id', currentUserId);

  return data;
}

// Renderizar gráfico Win Rate por Agente
function renderWinRateChart(data) {
  const ctx = document.getElementById('chart-win-rate-agent').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.agent_type),
      datasets: [{
        label: 'Taxa Conversão %',
        data: data.map(d => d.taxa_conversao_percent),
        backgroundColor: 'rgba(75, 192, 192, 0.7)'
      }]
    }
  });
}

// Exportar para CSV
async function exportAnalyticsCSV() {
  const { data } = await supabase
    .from('lead_feedback')
    .select('*')
    .eq('user_id', currentUserId)
    .order('criado_em', { ascending: false });

  const csv = convertToCSV(data);
  downloadCSV(csv, 'analytics.csv');
}
```

### Phase 3 Functions

```javascript
// Chamar API de predição
async function getPredictionProbability(leadId) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/predict-conversion-probability`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lead_id: leadId,
        user_id: currentUserId
      })
    }
  );
  return response.json();
}

// Chamar API de otimização de prompt
async function getPromptOptimization() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/optimize-prompt-auto`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: currentUserId,
        agent_type: 'principal',
        periodo: '7d'
      })
    }
  );
  return response.json();
}

// Verificar alertas
async function checkAlerts() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-performance-alerts`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: currentUserId })
    }
  );
  return response.json();
}

// Renderizar alertas com cores de severidade
function renderAlerts(alerts) {
  const container = document.getElementById('alerts-container');
  container.innerHTML = alerts.map(alert => `
    <div class="alert alert-${alert.severidade}">
      <div class="alert-header">
        <span class="alert-tipo">${alert.tipo}</span>
        <span class="alert-severidade">${alert.severidade}</span>
      </div>
      <div class="alert-mensagem">${alert.mensagem}</div>
      <div class="alert-acao">🔧 ${alert.acao}</div>
    </div>
  `).join('');
}
```

---

## Arquivo de Schema SQL Adicional

**Salvar em:** `supabase/phase-2-3-analytics.sql`

(Ver SQL views acima)

---

## Edge Functions a Criar

1. **`predict-conversion-probability`** — Predição de conversão
2. **`optimize-prompt-auto`** — Sugestões de otimização
3. **`check-performance-alerts`** — Verificação de alertas

---

## Timeline de Implementação

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 2.1 | SQL Views + Schema | 15 min |
| 2.2 | Página Analytics UI | 30 min |
| 2.3 | Gráficos + Filtros | 20 min |
| 2.4 | Exportação CSV | 10 min |
| 3.1 | Edge Function — Predição | 20 min |
| 3.2 | Edge Function — Otimização | 25 min |
| 3.3 | Edge Function — Alertas | 15 min |
| 3.4 | UI Alertas + Insights | 20 min |
| **Total** | | **~2.5 horas** |

---

## Checklist de Implementação

- [ ] SQL schema Phase 2-3 executado em Supabase
- [ ] Página `page-analytics` criada em software/index.html
- [ ] Gráficos de Win Rate renderizando
- [ ] Filtros funcionando
- [ ] Exportação CSV ativa
- [ ] Edge Function `predict-conversion-probability` deployada
- [ ] Edge Function `optimize-prompt-auto` deployada
- [ ] Edge Function `check-performance-alerts` deployada
- [ ] Alertas renderizando com cores de severidade
- [ ] Teste end-to-end completo

---

**Versão:** 1.0
**Status:** 🔄 Pronto para Implementação
**Próximo Passo:** Executar SQL + criar edge functions
