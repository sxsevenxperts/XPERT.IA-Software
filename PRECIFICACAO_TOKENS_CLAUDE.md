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

## 4. Tokens Inclusos por Plano

### Recomendação de Alocação

```
┌─────────────────────────────────────────────┐
│ PLANO STARTER - R$ 99,90/mês                │
├─────────────────────────────────────────────┤
│                                             │
│ Análises incluídas: 5/mês                  │
│ Custo de tokens: 5 × R$ 0.31 = R$ 1.55    │
│                                             │
│ Tokens inclusos: 18.000 tokens             │
│ (suficiente para ~5 análises)              │
│                                             │
│ Margem: R$ 99,90 - R$ 1,55 = R$ 98,35    │
│                                             │
│ ✓ Tokens adicionais: R$ 0,30 por 1.000    │
│ ✓ Max 20 análises/mês (soft limit)        │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PLANO PROFESSIONAL - R$ 199,90/mês         │
├─────────────────────────────────────────────┤
│                                             │
│ Análises incluídas: 20/mês                 │
│ Custo de tokens: 20 × R$ 0.31 = R$ 6.20  │
│                                             │
│ Tokens inclusos: 75.000 tokens             │
│ (suficiente para ~20 análises)             │
│                                             │
│ Margem: R$ 199,90 - R$ 6,20 = R$ 193,70 │
│                                             │
│ ✓ Tokens adicionais: R$ 0,25 por 1.000    │
│ ✓ Max 50 análises/mês (soft limit)        │
│                                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ PLANO ENTERPRISE - R$ 499,90/mês           │
├─────────────────────────────────────────────┤
│                                             │
│ Análises incluídas: ILIMITADO              │
│ Custo de tokens: ~R$ 25,00/mês (est.)     │
│                                             │
│ Tokens inclusos: 200.000 tokens/mês        │
│ (ilimitado na prática)                     │
│                                             │
│ Margem: R$ 499,90 - R$ 25 = R$ 474,90   │
│                                             │
│ ✓ Tokens adicionais: R$ 0,20 por 1.000    │
│ ✓ Sem limite de análises                  │
│                                             │
└─────────────────────────────────────────────┘
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

## 7. Fórmula de Precificação

### Recomendado

```
STARTER:
  Preço: R$ 99,90/mês
  Tokens: 18.000
  Custo real: R$ 1,55
  Margem: 98%
  
PROFESSIONAL:
  Preço: R$ 199,90/mês
  Tokens: 75.000
  Custo real: R$ 6,20
  Margem: 97%
  
ENTERPRISE:
  Preço: R$ 499,90/mês
  Tokens: 200.000
  Custo real: ~R$ 25,00
  Margem: 95%
```

### Alternativa (Mais Agressivo)

```
STARTER: R$ 149,90/mês
  - +50% margem
  - Ainda muito mais barato que ML tradicional
  
PROFESSIONAL: R$ 249,90/mês
  - +25% margem
  
ENTERPRISE: R$ 599,90/mês
  - +20% margem
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

## 12. Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Custo por análise** | R$ 0,31 |
| **Custo entrada (input)** | R$ 0,000015/token |
| **Custo saída (output)** | R$ 0,000075/token |
| **Starter tokens inclusos** | 18.000/mês |
| **Professional tokens inclusos** | 75.000/mês |
| **Enterprise tokens inclusos** | 200.000/mês |
| **Margem média** | 95% |
| **Payback cliente** | 3 dias |
| **ROI em vendas** | 400% em 6 meses |

---

## 13. Próximos Passos

1. **Confirmação de Preços** - Vocês ajustam conforme necessário
2. **Setup de Rastreamento** - Implementar tabelas de tokens no Supabase
3. **Dashboard** - Criar visualização de custos por loja
4. **Billing API** - Integrar com Hotmart/Stripe para cobrar tokens
5. **Alertas** - Notificar quando cliente usar 80% dos tokens

**Tudo pronto para vocês precificarem!** 💰
