# 💰 Precificação - Tokens Claude AI para Smart Market

## 1. Custos Oficiais Claude 3.5 Sonnet (Atual)

### Tabela de Preços Anthropic
```
Model: claude-3-5-sonnet-20241022

Input Tokens:   $0.003 por 1.000 tokens
Output Tokens:  $0.015 por 1.000 tokens

Em reais (cotação 1 USD = R$ 5.00):

Input:  R$ 0.015 por 1.000 tokens
        R$ 0.000015 por token

Output: R$ 0.075 por 1.000 tokens
        R$ 0.000075 por token
```

---

## 2. Custos por Tipo de Análise

### Análise: Previsão de Vendas + RFM Scoring

#### Input (Dados da Loja)
```
Histórico de vendas (90 dias):
- 100 transações × 30 chars cada: ~3.000 tokens

Estoque atual:
- 500 produtos × 20 chars cada: ~2.000 tokens

Clientes:
- 1.000 clientes × 40 chars cada (RFM): ~5.000 tokens

Contexto/instruções do sistema: ~1.000 tokens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL INPUT: ~11.000 tokens
Custo: 11.000 × R$ 0.000015 = R$ 0.165
```

#### Output (Resposta Claude)
```
Previsões de vendas (7/14/30 dias):      ~500 tokens
RFM scores detalhado:                     ~800 tokens
Alertas e anomalias:                      ~400 tokens
Recomendações acionáveis:                 ~200 tokens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL OUTPUT: ~1.900 tokens
Custo: 1.900 × R$ 0.000075 = R$ 0.1425
```

#### **CUSTO TOTAL POR ANÁLISE**
```
Input:  R$ 0.165
Output: R$ 0.1425
━━━━━━━━━━━━━━━━━━━
TOTAL: R$ 0.3075 por análise

Arredondado: R$ 0.31 por análise
```

---

## 3. Análises Simplificadas (Custo Reduzido)

### Análise: Apenas Previsão (Rápida)
```
Dados mínimos:
- Últimas 30 transações: ~1.000 tokens
- Top 100 clientes: ~2.000 tokens
- Instruções: ~500 tokens

Input: ~3.500 tokens = R$ 0.0525

Output: ~800 tokens = R$ 0.06

TOTAL: R$ 0.1125 ≈ R$ 0.11 por análise
```

### Análise: Apenas RFM (Segmentação)
```
Input: ~5.000 tokens = R$ 0.075
Output: ~1.000 tokens = R$ 0.075

TOTAL: R$ 0.15 por análise
```

### Análise: Alertas & Anomalias
```
Input: ~4.000 tokens = R$ 0.06
Output: ~600 tokens = R$ 0.045

TOTAL: R$ 0.105 ≈ R$ 0.11 por análise
```

---

## 4. Plano Único: PREMIUM

### Modelo de Faturamento Consolidado

```
┌─────────────────────────────────────────────┐
│ PLANO PREMIUM - ÚNICA OFERTA                │
├─────────────────────────────────────────────┤
│                                             │
│ Modalidade 1: Mensal                       │
│   Preço: R$ 799,90/mês                    │
│   Faturamento: mensal                      │
│                                             │
│ Modalidade 2: Anual em 12x                │
│   Preço: 12 × R$ 699,00 = R$ 8.388/ano   │
│   Economia: R$ 1.210,80/ano (12.6% off)  │
│   Faturamento: 12 parcelas de R$ 699      │
│                                             │
├─────────────────────────────────────────────┤
│ TOKENS INCLUSOS: 500.000/mês                │
│ CUSTO REAL: ~R$ 50,00/mês                 │
│ MARGEM: R$ 749,90/mês (94%)               │
│                                             │
├─────────────────────────────────────────────┤
│ INCLUÍDO NO PLANO:                         │
│                                             │
│ ✓ Análises IA ilimitadas                  │
│   - Estoque real-time                     │
│   - Comportamento cliente (RFM)           │
│   - Previsão demanda (90-95% acurácia)   │
│   - Oportunidades upsell/cross-sell       │
│   - Detecção churn com plano de resgate   │
│                                             │
│ ✓ Dashboard premium                       │
│   - 4 abas (Overview, Estoques,           │
│     Clientes, Insights)                   │
│   - Widgets real-time                     │
│   - Export PDF/CSV ilimitado              │
│   - Múltiplos dashboards personalizados   │
│                                             │
│ ✓ Integração PDV avançada                 │
│   - REST API ilimitado                    │
│   - Escalas (TCP/IP + MQTT + Serial)      │
│   - Webhooks customizados (5+)            │
│   - Múltiplas PDVs simultâneas            │
│                                             │
│ ✓ Notificações premium                    │
│   - Email, SMS, Push, In-app              │
│   - Templates customizados                │
│   - Agendamento inteligente               │
│                                             │
│ ✓ Relatórios & Analytics                 │
│   - Diários, semanais, mensais            │
│   - Comparativos históricos               │
│   - Seasonalidade e forecasting           │
│   - Heatmaps de vendas                    │
│                                             │
│ ✓ Suporte & Consultoria 24/7             │
│   - Chat em tempo real (<5 min)           │
│   - Email (<1 hora)                       │
│   - Telefone + WhatsApp                   │
│   - Consultor BI dedicado                 │
│   - Treinamento até 5 pessoas             │
│                                             │
│ ✓ Segurança Enterprise                    │
│   - SSL/TLS + RLS por loja_id             │
│   - Auditoria completa                    │
│   - Backup diário automático              │
│   - GDPR compliant                        │
│   - 2FA e criptografia E2E                │
│                                             │
│ ✓ API avançada                            │
│   - OAuth 2.0 nativo                      │
│   - Rate limit 10k req/min                │
│   - GraphQL + REST                        │
│   - Webhooks em produção                  │
│   - Versionamento API                     │
│                                             │
│ ✓ White-label completo                   │
│   - Cores e logo personalizados           │
│   - Domínio customizado                   │
│   - Prompts ajustáveis por loja           │
│   - Campos extras na database             │
│                                             │
│ ✓ Performance premium                     │
│   - CDN Cloudflare global                 │
│   - Latência <100ms                       │
│   - SLA 99.9% uptime                      │
│   - DDoS protection                       │
│                                             │
└─────────────────────────────────────────────┘
```

### Comparativo: Modalidades de Pagamento

```
MENSAL                          ANUAL (12x)
┌─────────────────────┐        ┌─────────────────────┐
│ R$ 799,90           │        │ 12 × R$ 699,00     │
│ Sem compromisso     │        │ = R$ 8.388,00      │
│                     │        │                     │
│ Ideal para testes   │        │ Economiza:          │
│ e avaliação         │        │ R$ 1.210,80/ano    │
│                     │        │ (12,6% discount)   │
│                     │        │                     │
│ Cancelamento livre  │        │ Ideal para lojas    │
│                     │        │ que já usam         │
└─────────────────────┘        └─────────────────────┘
```

---

## 5. Tokens Adicionais (Overflow)

### Preço por Token Extra

```
Quando cliente exceder inclusos:

STARTER:
  Inclusos: 18.000 tokens/mês
  Extra: R$ 0,30 por 1.000 tokens
  
  Exemplo: 25.000 tokens (7.000 extra)
  Custo extra: 7 × R$ 0,30 = R$ 2,10

PROFESSIONAL:
  Inclusos: 75.000 tokens/mês
  Extra: R$ 0,25 por 1.000 tokens
  
  Exemplo: 100.000 tokens (25.000 extra)
  Custo extra: 25 × R$ 0,25 = R$ 6,25

ENTERPRISE:
  Inclusos: 200.000 tokens/mês
  Extra: R$ 0,20 por 1.000 tokens
  
  (Muito dificilmente vai exceder)
```

---

## 6. Cálculos de Economia

### Cliente Starter (5 análises/mês)
```
Sem Smart Market:
- 5 análises × R$ 0.31 = R$ 1.55/mês
- Sem insights = perda de vendas

Com Smart Market Starter:
- Paga R$ 99,90
- Incluso: 18.000 tokens (suficiente)
- Ganha: previsões + RFM + alertas

ROI em previsões:
- +15% em vendas = +R$ 3.000/mês (loja média)
- Custo: R$ 99,90
- Payback: 3 dias
```

### Cliente Professional (20 análises/mês)
```
Análises mensais:
- 20 análises × R$ 0.31 = R$ 6.20/mês (custo puro)

Com Professional:
- Paga R$ 199,90
- Incluso: 75.000 tokens (mais que suficiente)
- Ganha: RFM detalhado, alertas automáticos, API

ROI em RFM:
- +22% em vendas = +R$ 6.600/mês
- Custo: R$ 199,90
- Payback: 3 dias
```

---

## 7. Modelo de Faturamento (Única Oferta)

### PREMIUM - Único Plano

```
OPÇÃO 1: Mensal
  Preço: R$ 799,90/mês
  Tokens: 500.000/mês
  Custo real: ~R$ 50,00/mês
  Margem: R$ 749,90/mês (94%)
  Cancelamento: Livre a qualquer momento

OPÇÃO 2: Anual em 12 Parcelas
  Preço: 12 × R$ 699,00 = R$ 8.388/ano
  Tokens: 500.000/mês × 12 = 6.000.000/ano
  Custo real: ~R$ 600,00/ano
  Margem total: R$ 7.788,00/ano
  Economiza: R$ 1.210,80/ano (12,6% desconto)
  Recomendado para: Lojas com commitmentato anual
```

### Justificativa Econômica

```
Para a Loja:
  Investimento (mensal): R$ 799,90
  Retorno estimado: R$ 14.000/mês
  - Redução de perdas: R$ 5.000
  - Upsell/Cross-sell: R$ 4.000
  - Retenção de clientes: R$ 3.000
  - Eficiência operacional: R$ 2.000

  ROI: 1.750%
  Payback: 26 dias

Investimento (anual): R$ 8.388
  Retorno estimado: R$ 168.000/ano
  Economiza: R$ 1.210,80
  ROI Total: 1.883%
```

---

## 8. Rastreamento de Tokens (Supabase)

### Tabela: tokens_uso
```sql
INSERT INTO tokens_uso (
  loja_id,
  data_uso,
  tipo_uso,
  tokens_input,
  tokens_output,
  tokens_total,
  custo_usd,
  custo_brl
) VALUES (
  'uuid-xxx',
  '2025-03-28',
  'analise_vendas',
  11000,
  1900,
  12900,
  0.3075,
  1.5375
)
```

### View: Resumo Mensal
```sql
CREATE VIEW tokens_mes_resumo AS
SELECT
  loja_id,
  date_trunc('month', data_uso)::date as mes,
  SUM(tokens_total) as total_tokens,
  SUM(custo_brl) as custo_mes,
  CASE 
    WHEN loja_id IN (SELECT loja_id FROM subscriptions 
                     WHERE plano='starter') 
    THEN 18000
    WHEN loja_id IN (SELECT loja_id FROM subscriptions 
                     WHERE plano='professional') 
    THEN 75000
    ELSE 200000
  END as tokens_inclusos,
  CASE 
    WHEN SUM(tokens_total) > 18000 THEN (SUM(tokens_total) - 18000) * 0.00030
    ELSE 0
  END as custo_extra
FROM tokens_uso
GROUP BY loja_id, mes
```

---

## 9. Dashboard de Faturamento

### Visão por Loja
```
Loja: Supermercado Centro
Plano: Professional (R$ 199,90/mês)

Período: Março 2025

Tokens Usados:        68.500
Tokens Inclusos:      75.000
Tokens Restantes:     6.500

Custo Real:           R$ 21,24
Preço Plano:          R$ 199,90
Margem:               R$ 178,66 (89%)

Status: ✅ Dentro do limite
Próximo aumento de uso esperado: Abril (+5%)
```

---

## 10. Previsão de Custos Futuros

### Se Claude AI Ficar Mais Barato
```
Cenário 1: Preços caem 20% (provável em 6 meses)

Novo custo análise: R$ 0.31 × 0.80 = R$ 0.248

Smart Market pode:
✅ Aumentar tokens inclusos (manter margens)
✅ Reduzir preço dos planos (ganhar market share)
✅ Aumentar análises automáticas
```

### Se Claude AI Ficar Mais Caro
```
Cenário 2: Preços sobem 10% (pouco provável)

Novo custo análise: R$ 0.31 × 1.10 = R$ 0.341

Smart Market pode:
✅ Ajustar tokens inclusos (manter margens)
✅ Manter preços (maior lucro)
✅ Oferecer desconto por pré-pagamento
```

---

## 11. Estratégia Recomendada

### Phase 1: Lançamento (Atual)
```
STARTER:    R$ 99,90/mês  (18k tokens)
PROFESSIONAL: R$ 199,90/mês (75k tokens)
ENTERPRISE: R$ 499,90/mês (200k tokens)

Margem média: 95%
Modelo: Incluir tokens no plano
```

### Phase 2: Após 3 Meses (Validação)
```
Se adoção > 50 lojas:
  ✅ Manter preços
  ✅ Aumentar margem com volume

Se adoção < 20 lojas:
  🔴 Reduzir preço em 20%
  🔴 Aumentar tokens inclusos
  🔴 Adicionar análises automáticas
```

### Phase 3: Após 6 Meses (Scale)
```
Opção A: Add-ons de tokens
  - "Pacote 10k tokens extra" = R$ 2,99
  - "Pacote 50k tokens" = R$ 12,99

Opção B: Análises premium
  - "Análise semanal automática" = R$ 29,90
  - "Consultoria com IA" = R$ 99,90/hora

Opção C: API para terceiros
  - R$ 0,50 por 1.000 tokens (markup 3.3x)
```

---

## 12. Resumo Executivo - Modelo Consolidado

| Métrica | Valor |
|---------|-------|
| **Plano único** | PREMIUM |
| **Preço mensal** | R$ 799,90 |
| **Preço anual (12x)** | 12 × R$ 699,00 = R$ 8.388,00 |
| **Desconto anual** | R$ 1.210,80 (12,6% off) |
| **Tokens inclusos/mês** | 500.000 |
| **Custo real por análise** | R$ 0,31 |
| **Margem mensal** | R$ 749,90 (94%) |
| **Suporte** | 24/7 com consultor BI dedicado |
| **Payback do cliente** | 26 dias |
| **ROI estimado** | 1.750% (mensal) / 1.883% (anual) |

---

## 13. Próximos Passos

1. **Confirmação de Preços** - Vocês ajustam conforme necessário
2. **Setup de Rastreamento** - Implementar tabelas de tokens no Supabase
3. **Dashboard** - Criar visualização de custos por loja
4. **Billing API** - Integrar com Hotmart/Stripe para cobrar tokens
5. **Alertas** - Notificar quando cliente usar 80% dos tokens

**Tudo pronto para vocês precificarem!** 💰
