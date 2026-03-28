# 🤖 Smart Market - Integração Claude AI para Análises Preditivas

## Visão Geral
Smart Market usa **Claude 3.5 Sonnet** como **única** fonte de análise preditiva:
- ✅ Previsão de vendas (7, 14, 30 dias)
- ✅ RFM Scoring (segmentação de clientes)
- ✅ Detecção de anomalias
- ✅ Otimização de estoque

**Modelo:** Paga-se por tokens gastos. Cada loja gasta tokens ao solicitar análise.

---

## Arquitetura

### 1. Edge Function: `analisar-vendas`
```
POST /functions/v1/analisar-vendas
├─ Recebe: loja_id, mes, histórico_vendas, estoque, clientes
├─ Chama: Claude API (Sonnet)
├─ Registra: tokens_uso, resultado em lojas_analises
└─ Retorna: análise JSON + custo de tokens
```

**Fluxo:**
```
Frontend (Análises)
       ↓
   Edge Function
       ↓
   Claude API ← Gasta tokens
       ↓
Supabase (salva resultado + custo)
       ↓
Frontend (exibe análise)
```

### 2. Tabelas do Supabase

#### `lojas_analises`
```sql
id                UUID
loja_id           UUID (qual loja)
mes               DATE (2025-03-01)
tipo_analise      TEXT (previsao_vendas_rfm | estoque_otimizacao | anomalia)
resultado         JSONB (a análise completa da Claude)
tokens_usados     INTEGER (1245 tokens)
custo_tokens      NUMERIC (0.0050 USD) ← rastreamento de custo
status            TEXT (completa | erro)
created_at        TIMESTAMPTZ
```

#### `tokens_uso` (rastreamento detalhadode custos)
```sql
id                UUID
loja_id           UUID
data_uso          DATE
tipo_uso          TEXT
tokens_input      INTEGER (prompt)
tokens_output     INTEGER (resposta)
tokens_total      INTEGER
custo_usd         NUMERIC ($0.0050)
requisicao_id     TEXT (para rastreabilidade)
created_at        TIMESTAMPTZ
```

#### `previsoes_vendas` (cache inteligente)
```sql
loja_id           UUID
mes               DATE
proximos_7_dias   NUMERIC (R$ 15.230,00)
proximos_7_dias_confianca NUMERIC (0.92) ← 92% confiança
proximos_14_dias  NUMERIC
proximos_30_dias  NUMERIC
realizado_valor   NUMERIC (preenchido depois que passa período)
analise_id        UUID (referência à análise)
```

#### `rfm_scores` (segmentação de clientes)
```sql
loja_id           UUID
cliente_id        TEXT
recencia_dias     INTEGER (dias desde última compra)
frequencia        INTEGER (número de compras)
monetario         NUMERIC (gasto total)
segmento          TEXT (VIP | Regular | Em Risco | Dorminhoco)
score_r           INTEGER (1-5)
score_f           INTEGER (1-5)
score_m           INTEGER (1-5)
```

#### `alertas_sistema` (automáticos)
```sql
loja_id           UUID
tipo_alerta       TEXT (estoque_baixo | cliente_em_risco | anomalia)
severidade        TEXT (baixa | media | alta | critica)
titulo            TEXT
descricao         TEXT
acao_recomendada  TEXT
dados             JSONB
lido              BOOLEAN
resolvido         BOOLEAN
```

---

## Modelo de Preços com Tokens

### Custo Claude 3.5 Sonnet (atual)
```
Input:  $0.003 por 1K tokens
Output: $0.015 por 1K tokens
```

### Exemplo de Análise
```
Loja: Supermercado Centro
Análise: Previsão + RFM

Entrada:
- Histórico vendas (últimos 3 meses): 2.500 tokens
- Estoque atual: 800 tokens
- Clientes (RFM): 1.200 tokens
Total Input: 4.500 tokens → $0.0135

Saída:
- Previsões + recomendações: 1.800 tokens
Total Output: 1.800 tokens → $0.027

TOTAL: 6.300 tokens = $0.0405 por análise
```

### Estrutura de Preços (passar para cliente)
```
┌─────────────────────────────────────┐
│ PLANO STARTER (R$ 99,90/mês)        │
├─────────────────────────────────────┤
│ ✓ Previsão de vendas: 5 análises    │
│ ✓ RFM Scoring: 2 análises           │
│ ✓ 1 usuário                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Custo de tokens: ~R$ 2,00/mês       │
│ Margem Smart Market: R$ 97,90       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PLANO PROFESSIONAL (R$ 199,90/mês)  │
├─────────────────────────────────────┤
│ ✓ Previsão: 20 análises/mês         │
│ ✓ RFM: 10 análises/mês              │
│ ✓ Anomalias: 5 análises/mês         │
│ ✓ 3 usuários                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Custo de tokens: ~R$ 8,00/mês       │
│ Margem Smart Market: R$ 191,90      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PLANO ENTERPRISE (R$ 499,90/mês)    │
├─────────────────────────────────────┤
│ ✓ Análises ilimitadas               │
│ ✓ API acesso                        │
│ ✓ 10 usuários                       │
│ ✓ Suporte prioritário               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Custo de tokens: ~R$ 25,00/mês      │
│ Margem Smart Market: R$ 474,90      │
└─────────────────────────────────────┘
```

---

## Fluxo de Análise Completo

### 1. Usuário solicita análise
```
Frontend: [📊 Analisar Vendas do Mês]
       ↓
Carrega dados:
  ├─ trips (últimos 90 dias)
  ├─ estoque (atual)
  ├─ clientes (últimas 12 meses)
       ↓
Chama: POST /functions/v1/analisar-vendas
```

### 2. Edge Function prepara dados
```typescript
const prompt = `
Você é analista de varejo...

DADOS:
- Vendas últimos 7 dias: R$ 12.350
- Ticket médio: R$ 245
- Histórico (últimas 10 transações):
  [lista de vendas]
  
- Clientes top 5 (RFM):
  [dados de clientes]
  
POR FAVOR, FORNEÇA:
1. Previsão 7/14/30 dias
2. Segmentação RFM
3. Alertas
4. Recomendações
`

const response = await fetch("https://api.anthropic.com/v1/messages", {
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 2000,
  messages: [{ role: "user", content: prompt }]
})
```

### 3. Claude AI analisa e retorna
```json
{
  "previsoes": {
    "proximos_7_dias": 14250,
    "confianca_7d": 0.94,
    "proximos_14_dias": 28500,
    "confianca_14d": 0.85,
    "proximos_30_dias": 60000,
    "confianca_30d": 0.75
  },
  "rfm_scores": {
    "VIP": [
      { cliente_id: "C001", monetario: 5230, frequencia: 23, recencia: 2 }
    ],
    "Em_Risco": [
      { cliente_id: "C023", monetario: 1500, frequencia: 5, recencia: 45 }
    ]
  },
  "alertas": [
    {
      "tipo": "estoque_baixo",
      "produto": "Óleo de Soja",
      "quantidade": 5,
      "acao": "Reabastecer em 48 horas"
    }
  ],
  "recomendacoes": [
    "Contatar clientes em risco com promoção de fidelidade",
    "Reabastecer produtos com sazonalidade"
  ]
}
```

### 4. Registrar tokens e custo
```sql
INSERT INTO tokens_uso (
  loja_id, tipo_uso, tokens_input, tokens_output, custo_usd
) VALUES (
  'uuid-loja', 'analise_vendas', 4500, 1800, 0.0405
);

INSERT INTO lojas_analises (
  loja_id, mes, tipo_analise, resultado, tokens_usados, custo_tokens
) VALUES (
  'uuid-loja', '2025-03-01', 'previsao_vendas_rfm', 
  '{...análise completa...}', 6300, 0.0405
);
```

### 5. Salvar em cache (não refazer análise)
```sql
INSERT INTO previsoes_vendas (
  loja_id, mes, proximos_7_dias, proximos_7_dias_confianca, ...
) VALUES (...)

INSERT INTO rfm_scores (loja_id, cliente_id, segmento, ...) 
VALUES (...)
```

### 6. Retornar ao frontend
```json
{
  "success": true,
  "analysis": { ... análise completa ... },
  "tokens_used": 6300,
  "custo": 0.0405,
  "analise_id": "uuid-xxx"
}
```

---

## Otimizações de Tokens

### 1. **Cache Inteligente**
Se análise do mês já existe:
- Não chamar Claude novamente
- Usar dados em cache
- Economizar 100% dos tokens

### 2. **Sumarização de Dados**
Em vez de enviar todos os 10.000 registros:
```
ANTES: 12.000 tokens
Transações: [lista de 10.000]
Clientes: [lista de 5.000]

DEPOIS: 3.000 tokens
Últimas 30 transações (amostra)
Top 100 clientes (resumo)
Agregações por dia
```

### 3. **Análises Incrementais**
```
1ª semana: Análise completa (4.500 tokens)
2ª semana: Apenas novos dados + ajuste (1.500 tokens)
3ª semana: Idem (1.500 tokens)
Final do mês: Resumo consolidado (2.000 tokens)

Total: 9.500 tokens em vez de 18.000
```

### 4. **Modelos Menores (offline)**
Para decisões simples (ex: estoque baixo?):
Usar regras locais antes de chamar Claude
```javascript
if (estoque < minimo) {
  // Alertar SEM chamar Claude
  return { alerta: "estoque_baixo", acao: "reabastecer" }
}
```

---

## Rastreamento de Custos

### Dashboard de Tokens por Loja
```
Loja: Supermercado Centro
Período: Março 2025

Tipo de Análise       | Requisições | Tokens | Custo USD
─────────────────────┼─────────────┼────────┼──────────
Previsão de Vendas   | 5           | 22.500 | $0.20
RFM Scoring          | 3           | 13.500 | $0.12
Detecção Anomalias   | 2           | 9.000  | $0.08
─────────────────────┼─────────────┼────────┼──────────
TOTAL                | 10          | 45.000 | $0.40

% Gasto do Mês: 0.4%
```

### Alertas de Sobre-uso
```
Se tokens do mês > 100.000:
  Notificar loja
  Sugerir upgrade ou otimização
```

---

## API Reference

### POST `/functions/v1/analisar-vendas`
```bash
curl -X POST https://project.supabase.co/functions/v1/analisar-vendas \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid-xxx",
    "mes": "2025-03",
    "historico_vendas": [
      { "data": "2025-03-01", "valor": 1250.50, "quantidade": 5 }
    ],
    "estoque_atual": [
      { "produto": "Óleo", "quantidade": 100, "valor_unitario": 8.50 }
    ],
    "clientes": [
      { "id": "C001", "total_gasto": 5230, "compras": 23, "ultima_compra": "2025-03-15" }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "analysis": { ... análise JSON ... },
  "tokens_used": 6300,
  "custo": 0.0405,
  "analise_id": "uuid-xxx"
}
```

---

## Configuração de Variáveis de Ambiente

```bash
# .env.local
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ANTHROPIC_API_KEY=sk-ant-... # apenas para client-side testing

# .env (Edge Function)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Monitoramento

### Métricas Importantes
- Tokens/mês por loja
- Custo/mês por loja
- Taxa de acerto de previsões (comparar realizado vs previsto)
- Tempo de resposta das análises

### Alertas
- ⚠️ Loja gastou 80% do limite de tokens
- 🔴 Erro na análise (chamar Claude falhou)
- ✅ Previsão confirmada (período passado, validar acurácia)
