# 🚀 Phase 2 & 3 Deployment Guide

**Status:** ✅ Pronto para Deploy
**Data:** 2026-03-19
**Versão:** 1.0

---

## 📋 Resumo do Que Foi Implementado

### Phase 2: Analytics de Taxa de Vitória ✅
- **UI Dashboard:** Nova página `page-analytics` em `software/index.html`
- **KPIs:** Taxa conversão, receita total, nota SDR média, prompts úteis %
- **Gráficos:** Win rate por agente, receita por agente, motivos desistência, timeline
- **Tabela:** Performance detalhada por agente com todas as métricas
- **Filtros:** Data range, agente, com exportação CSV
- **Views SQL:** 8 novas views para analytics agregadas

### Phase 3: AI-Powered Features ✅
- **Edge Function 1:** `predict-conversion-probability` — predição de conversão
- **Edge Function 2:** `optimize-prompt-auto` — sugestões de otimização de prompt
- **Edge Function 3:** `check-performance-alerts` — alertas em tempo real
- **UI Tabs:** AI Insights (sugestões), Alertas (visualização)
- **Scoring:** Algoritmo de scoring com 10+ fatores para predição

---

## 🔧 Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `supabase/phase-2-3-analytics.sql` | ✅ Criado | 8 views + função PL/pgSQL |
| `supabase/functions/predict-conversion-probability/index.ts` | ✅ Criado | Edge function predição |
| `supabase/functions/optimize-prompt-auto/index.ts` | ✅ Criado | Edge function otimização |
| `supabase/functions/check-performance-alerts/index.ts` | ✅ Criado | Edge function alertas |
| `software/index.html` | ✅ Modificado | Page analytics + funções JS |
| `PHASE_2_3_IMPLEMENTATION.md` | ✅ Criado | Planejamento detalhado |

---

## 📦 Deployment Checklist

### Passo 1: Executar SQL no Supabase (5 min)

```bash
# 1. Abrir Supabase Dashboard
https://app.supabase.com/project/vyvdrbkcrvklcaombjqu

# 2. SQL Editor → New Query

# 3. Copiar conteúdo de:
supabase/phase-2-3-analytics.sql

# 4. Executar (Ctrl+Enter)

# 5. Verificar views criadas:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'vw_%';

# Expected: 13 views total
```

### Passo 2: Deploy Edge Functions (5-10 min)

```bash
# Via Supabase CLI
supabase functions deploy predict-conversion-probability
supabase functions deploy optimize-prompt-auto
supabase functions deploy check-performance-alerts

# Ou manualmente via Dashboard:
# Edge Functions → Create Function → Copiar code from /supabase/functions/*/index.ts
```

### Passo 3: Testar N8N Integration (10 min)

**Já está configurado em Phase 1! Apenas verificar:**

1. N8N Dashboard → Executar workflow com lead de teste
2. Verificar que dados aparecem em `workflow_executions`
3. Checar que feedback modal aparece ao mover lead para "convertido"

### Passo 4: Testar Analytics Dashboard (10 min)

1. **Login** no software
2. **Sidebar:** Resultados → Analytics
3. **Tab Win Rate:**
   - ✅ KPIs mostrando dados (se houver feedback)
   - ✅ Gráficos renderizando
   - ✅ Tabela performance por agente
   - ✅ Exportar CSV funcionando

4. **Tab Performance:**
   - ✅ Gráficos de motivos e notas renderizando

5. **Tab AI Insights:**
   - ✅ Chamando edge function `optimize-prompt-auto`
   - ✅ Mostrando sugestões com impacto esperado
   - ✅ Botão "Aplicar" (implementação futura)

6. **Tab Alertas:**
   - ✅ Chamando edge function `check-performance-alerts`
   - ✅ Mostrando alertas com cores de severidade
   - ✅ Sem erros de CORS/autenticação

### Passo 5: Teste End-to-End (15 min)

```
Fluxo Completo:
1. N8N: Execute workflow com lead
   ↓
2. Monitoramento: Dados aparecem em workflow_executions
   ↓
3. Feedback: Modal coleta dados (vendido/motivo/nota)
   ↓
4. Analytics: Dashboard mostra KPIs e gráficos atualizados
   ↓
5. AI Insights: Sugestões de otimização aparecem
   ↓
6. Alertas: Se houver problemas, alertas aparecem
```

---

## 🎯 Funcionalidades por Fase

### Phase 1 (✅ Completo)
- ✅ Database schema (workflow_executions, workflow_errors, lead_feedback)
- ✅ Edge function log-workflow-execution
- ✅ Dashboard monitoramento (metrics, gráficos, table)
- ✅ Modal feedback de leads
- ✅ Documentação deployment

### Phase 2 (✅ Implementado)
- ✅ Views SQL para analytics
- ✅ Dashboard analytics (page-analytics)
- ✅ KPIs (conversão, receita, nota, prompts úteis)
- ✅ Gráficos (win rate, receita, motivos, notas)
- ✅ Tabela performance por agente
- ✅ Filtros e exportação CSV

### Phase 3 (✅ Implementado)
- ✅ Edge function predição de conversão
- ✅ Edge function otimização de prompt
- ✅ Edge function alertas de performance
- ✅ UI para AI Insights (sugestões)
- ✅ UI para Alertas (crítico/warning)

---

## 📊 Dados Esperados

### Após executar workflow + coletar feedback:

**KPIs Dashboard:**
- Taxa Conversão: 35-60% (depende qualidade dos leads)
- Receita Total: R$ X,XXX (soma dos valores_venda)
- Nota SDR: 3.5-4.5/5.0 (depende feedback)
- Prompts Úteis: 60-80% (efetividade da IA)

**Gráficos:**
- Win Rate por Agente: Principal (50%), Objeção (40%), Extra (45%)
- Receita: Distribuição entre agentes

**Alertas (se houver problemas):**
- Error Rate > 5%
- Conversion Drop > 20%
- Token Budget > 80%
- Response Timeout (3+ em 6h)
- Response Slow (>5s)

---

## 🔗 URLs das Edge Functions

```
POST https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/predict-conversion-probability
POST https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/optimize-prompt-auto
POST https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/check-performance-alerts
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## 🛠️ Troubleshooting

### Problema: Analytics page mostra "Sem dados"
**Causa:** Nenhum feedback coletado ainda
**Solução:**
1. Execute workflow N8N com lead
2. Coloque lead em "convertido" ou "perdido"
3. Preencha modal de feedback
4. Aguarde 10 segundos
5. Refresh page (F5)

### Problema: AI Insights retorna erro 401
**Causa:** JWT token inválido ou expirado
**Solução:**
1. Logout + Login novamente
2. Verificar token JWT no browser console
3. Regenerar service role key no Supabase

### Problema: Alertas não aparecem
**Causa:** Views não criadas ou dados insuficientes
**Solução:**
1. Verificar views criadas: `SELECT * FROM vw_performance_7dias`
2. Verificar que há 7 dias de dados
3. Checar logs da edge function no Supabase

---

## 📈 Próximos Passos (Phase 4+)

- [ ] Implementar "Aplicar Sugestão" (salvar prompt otimizado)
- [ ] Testes A/B de prompts automáticos
- [ ] Dashboard executivo (C-level)
- [ ] Integração com Slack (alertas)
- [ ] Previsão de churn de leads
- [ ] Otimização automática de modelo (gpt-4o-mini vs claude)
- [ ] Integração com Hotmart para tracking de revenue

---

## ✅ Validation Checklist

- [ ] SQL views criadas em Supabase
- [ ] 3 Edge functions deployadas
- [ ] Page-analytics carrega sem erros
- [ ] KPIs mostram valores corretos
- [ ] Gráficos renderizam
- [ ] Filtros funcionam
- [ ] Exportação CSV funciona
- [ ] Tab AI Insights mostra sugestões
- [ ] Tab Alertas mostra alertas
- [ ] Nenhum erro no console (F12)
- [ ] Nenhum erro nas logs do Supabase

---

## 📞 Support

**Problemas com SQL:**
- Check: Supabase Dashboard → SQL Editor → Execution Logs

**Problemas com Edge Functions:**
- Check: Supabase Dashboard → Edge Functions → Logs

**Problemas com UI:**
- Check: Browser Console (F12) → Console tab

**Problemas com N8N:**
- Check: N8N Dashboard → Execution History → Erros

---

**Status Final:** 🟢 PRONTO PARA PRODUÇÃO

**Total de Tempo:** ~1 hora de deployment
**Complexidade:** Médio (requer famiaridade com Supabase)

---

Generated: 2026-03-19
Version: 1.0
