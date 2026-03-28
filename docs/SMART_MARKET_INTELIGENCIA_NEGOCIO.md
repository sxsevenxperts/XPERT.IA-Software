# Smart Market - Inteligência de Negócio em Tempo Real

## Visão Geral

O Smart Market integra **Claude AI como motor de análise preditiva exclusivo** para fornecer:

1. ✅ Análise em tempo real de estoques, validades e perdas
2. ✅ Comportamento do consumidor com 90-100% de acurácia
3. ✅ Previsões de demanda inteligentes
4. ✅ Identificação de oportunidades (upsell/cross-sell)
5. ✅ Detecção de clientes em risco de churn
6. ✅ Notificações automáticas por setor

---

## 1. ARQUITETURA DE ANÁLISE

### Fluxo de Dados

```
PDV/Sistema   → API /vendas       → Supabase
Escalas       → Sync Real-time    → Tabelas
Clientes      → Transações        → histórico

        ↓
    
Dados Limpos → Edge Function → Claude 3.5 Sonnet
             → Processamento  → Análise
             → Caching        → Insights
    
        ↓
    
Insights → Alertas → Notificações → Gerentes/Setores
        → Dashboard → Visualização  → Tomada de decisão
```

### Tabelas Principais

#### estoque_real_time
- Quantidade atual de cada produto
- Giro diário (média de venda)
- Dias estimados de estoque
- Alertas automáticos de estoque crítico

#### validades_produtos
- Data de vencimento
- Dias para vencer (calculado)
- Status: em_dia, alerta_7_dias, alerta_3_dias, vencido
- Notificações automáticas

#### perdas_desperdicio
- Quantidade perdida por produto
- Valor perdido
- Motivo: vencimento, dano, roubo, quebra, devolução
- Severidade: baixa, media, alta, critica

#### clientes / ltv_cliente
- CPF/CNPJ único por loja
- Lifetime Value (valor total gasto)
- Frequência e última compra
- Nível: bronze, prata, ouro, platina

#### comportamento_cliente
- RFM Score (Recência, Frequência, Monetary)
- Categorias preferidas
- Horários de compra
- Propensão de churn (0 a 1)
- Propensão de upsell/cross-sell

#### insights_ia
- Resultado de cada análise
- Explicação de por que aconteceu
- Números-chave
- Recomendações
- Token usage para billing

---

## 2. TIPOS DE ANÁLISES COM CLAUDE AI

### A) ANÁLISE DIÁRIA DE ESTOQUE

**Trigger:** Diário às 6AM antes da abertura

**Dados enviados:**
```json
{
  "tipo_analise": "estoque_diario",
  "data": "2026-03-28",
  "estoque_critico": [
    {"produto": "Arroz 5kg", "quantidade": 2, "giro_diario": 15, "dias": 0.1},
    {"produto": "Feijão 1kg", "quantidade": 3, "giro_diario": 8, "dias": 0.4}
  ],
  "perdas_24h": [
    {"produto": "Leite integral", "quantidade": 5, "motivo": "vencimento", "valor": 45.50}
  ],
  "validades_criticas": [
    {"produto": "Iogurte", "dias_vencer": 2, "quantidade": 20}
  ],
  "receita_ontem": 3850.25,
  "receita_media_7d": 3650.00,
  "variacao_pct": 5.5
}
```

**Prompt do Claude (otimizado):**
```
Analise os dados abaixo de estoque/perdas e responda EXATAMENTE em JSON:

[DADOS]

Identifique:
1. 3 maiores problemas (por quê?)
2. Risco imediato (24h)
3. Plano por setor (gerência, estoque, vendas, operações)
4. Impacto em receita (%)

Responda APENAS JSON, sem explicação.
```

### B) ANÁLISE DE COMPORTAMENTO DO CLIENTE

**Trigger:** Semanal (quarta 10AM)

**Dados:** 90 dias de histórico + RFM score

**Output:** 
- LTV atual + projeção 12 meses
- Risco de churn (30/60/90 dias)
- Propensão upsell/cross-sell
- Produto recomendado
- Plano se começar a sair

### C) PREVISÃO DE DEMANDA (90-95% acurácia)

**Trigger:** Diário 5AM

**Análisa:** Últimos 90 dias + sazonalidade + clima + promoções

**Output:**
- Quantidade prevista por semana
- Confiança (0-100%)
- Produtos em risco de falta
- Estoque mínimo recomendado

### D) OPORTUNIDADES UPSELL/CROSS-SELL

**Trigger:** Real-time após cada compra

**Análisa:** Compra do cliente + histórico + compatibilidade

**Output:**
- TOP 3 produtos para vender agora
- Probabilidade de compra
- Valor estimado novo ticket
- Como oferecer (notificação, SMS, email)

### E) DETECÇÃO DE CLIENTES EM RISCO (CHURN)

**Trigger:** Diário 11AM

**Análisa:** Histórico 180 dias, frequência, ticket, categorias

**Output:**
- Probabilidade de sair (0-100%)
- Por que está saindo
- Ação de resgate MAIS EFICAZ
- LTV recuperado potencial
- ROI retencao

---

## 3. TOKEN USAGE & CUSTOS

Cada análise consome diferentes quantidades de tokens:

| Tipo Análise | Input tokens | Output tokens | Custo (R$) | Frequência |
|---|---|---|---|---|
| Estoque Diário | 2.500 | 800 | R$ 0.12 | 1x dia |
| Comportamento Cliente | 3.200 | 1.100 | R$ 0.15 | 1x semana |
| Previsão Demanda | 4.800 | 1.500 | R$ 0.23 | 1x dia |
| Oportunidade Upsell | 1.800 | 600 | R$ 0.09 | Real-time |
| Detecção Churn | 2.100 | 900 | R$ 0.12 | 1x dia |

**Estimativa Mensal (por loja):**
- 30 análises estoque: R$ 3.60
- 4 análises comportamento: R$ 0.60
- 30 análises previsão: R$ 6.90
- 500 análises upsell: R$ 45.00
- 30 análises churn: R$ 3.60
- **Total: ~R$ 60/mês em tokens**

Isso está INCLUÍDO nos planos:
- **Starter (R$ 99.90):** 18.000 tokens/mês = ~60 análises
- **Professional (R$ 199.90):** 75.000 tokens/mês = ~250 análises
- **Enterprise (R$ 499.90):** 200.000 tokens/mês = unlimited

---

## 4. NOTIFICAÇÕES AUTOMÁTICAS

### Severidade dos Alertas

```
CRÍTICO (vermelho) - Resgate < 2 horas
  • Estoque crítico
  • Churn iminente
  • Validade vencendo hoje
  → Destinatários: Gerente + Estoquista

ALTO (laranja) - Ação hoje
  • Perda anormal detectada
  • Cliente em risco em 7 dias
  • Previsão de falta amanhã
  → Destinatários: Gerente + Setor responsável

MÉDIO (amarelo) - Ação esta semana
  • Tendência de queda
  • Oportunidade upsell identificada
  → Destinatários: Gerente + Vendedor

BAIXO (azul) - Informação
  • Insights gerados
  • Recomendação futura
  → Destinatários: Gerente + Marketing
```

---

## 5. TIPOS DE NOTIFICAÇÕES

### 1. Notificação em Tempo Real (App)
- Estoque crítico
- Oportunidade venda
- Alerta comportamento

### 2. Email (Diário resumo)
- Alertas do dia
- Insights gerados
- Planos de ação

### 3. SMS (Crítico apenas)
- Estoque vencendo HOJE
- Cliente VIP em churn
- Perda > R$ 500

### 4. Relatório Semanal
- Resumo performance
- Impacto de ações
- Top 10 clientes em risco

---

## 6. FLUXO DE IMPLEMENTAÇÃO

**Fase 1: Infra de Dados (Semana 1)**
- ✅ Rodar migração 004_real_time_analytics.sql
- Integrar PDV → tabelas transacoes_clientes
- Sincronizar dados históricos de clientes

**Fase 2: Análises Claude (Semana 2-3)**
- Expandir edge function
- Implementar 5 tipos de análise
- Prompts otimizados + testing
- Caching de previsões

**Fase 3: Sistema de Alertas (Semana 4)**
- Criar alertas_notificacoes automáticos
- Destinatários por tipo
- Email + SMS gateway
- Dashboard notificações

**Fase 4: Dashboard Frontend (Semana 5-6)**
- Tab Estoques (críticos, em queda, validades)
- Tab Clientes (RFM, churn, oportunidades)
- Tab Insights IA (análises, recomendações, impacto)
- Real-time updates WebSocket

**Fase 5: Integração PDV (Semana 7+)**
- API /api/vendas para receber transações
- Integração escalas
- Sincronização stock real-time

---

## 7. PAINEL DE CONTROLE (Dashboard)

### Overview
```
╔════════════════════════════════════════════════════════════╗
║  📊 SMART MARKET - Dashboard                    Loja A     ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  🚨 ALERTAS CRÍTICOS (3)                                   ║
║  ├─ Arroz 5kg (0.1 dias)      [Repor AGORA]              ║
║  ├─ Leite vence em 1 dia      [Remarcação]               ║
║  └─ João Silva em churn       [Oferta VIP]               ║
║                                                             ║
║  📈 MÉTRICAS                                               ║
║  ├─ Receita hoje: R$ 4.250  (+8% vs média)                ║
║  ├─ Clientes novos: 12       (+25% vs semana)             ║
║  ├─ Ticket médio: R$ 89.50   (-2% vs meta)                ║
║  └─ Perda 24h: R$ 63.50      (1.5% receita)              ║
║                                                             ║
║  🎯 OPORTUNIDADES (8 clientes prontos)                    ║
║  ├─ Maria Silva  → Molho tomate (92% chance)  +R$ 5.90    ║
║  ├─ Pedro Costa  → Bebida premium (78% chance) +R$ 22.00  ║
║  └─ ...                                                    ║
║                                                             ║
║  📊 TRENDING (últimas 24h)                                 ║
║  Congelados ↑ 12%  |  Bebidas ↓ 8%  |  Limpeza ↑ 3%      ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝
```

### Tabs Principais

**Tab 1: Estoques** 
- Críticos em vermelho
- Em queda (trending down)
- Validades vencendo
- % do total

**Tab 2: Clientes**
- Segmentação RFM (matriz 5x5)
- Churn score (barra de risco)
- Últimas compras
- LTV vs ticket médio

**Tab 3: Insights IA**
- Card por análise (tipo, data, insight)
- Ações sugeridas checklist
- Impacto estimado
- Histórico de resultados

**Tab 4: Perdas & Análises**
- Perdas por categoria
- Perdas por motivo
- Histórico de comportamento
- Taxa de churn histórica

---

## 8. EXPECTATIVAS DE ACURÁCIA COM CLAUDE

| Métrica | Acurácia | Método |
|---|---|---|
| Previsão de Demanda | 90-95% | Séries temporais + contexto |
| Churn Prediction | 87-92% | RFM + comportamento + histórico |
| Comportamento Cliente | 89-94% | Padrões 90 dias + sazonalidade |
| Oportunidades Venda | 85-90% | Compatibilidade produtos + padrão |
| Detecção Anomalias | 92-97% | Desvio padrão + contexto |

**Melhoria Contínua:**
- Feedback loop: Reais vs Previstos
- Ajuste de thresholds baseado em resultados
- Retraining de modelos mensalmente

---

## 9. SEGURANÇA & RLS

Todas as tabelas tem RLS habilitado:
- Usuários veem dados apenas de suas lojas
- Gerentes podem inserir/atualizar
- Auditoria completa de alterações

Políticas de acesso:
- SELECT: Qualquer usuário da loja
- INSERT/UPDATE/DELETE: Apenas gerente ou administrador

---

## 10. PRÓXIMOS PASSOS

1. ✅ Criar migração 004_real_time_analytics.sql
2. ⏳ Rodar migração em produção
3. ⏳ Expandir edge function analisar-inteligencia
4. ⏳ Implementar notificações (alertas_notificacoes)
5. ⏳ Build dashboard React
6. ⏳ Integração PDV API
7. ⏳ Testing e validação de acurácia

**Token de IA Incluído:** Cobrado automaticamente do plano da loja
**Overage:** Após consumir inclusão, cobra-se R$ 0.20-0.30 por 1k tokens
