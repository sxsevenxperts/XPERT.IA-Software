# Roadmap - Smart Market com Inteligência de Negócio

## 🎯 Visão Geral

Transformar o Smart Market em plataforma de **BI em Tempo Real com Claude AI** para:
- ✅ Análise de estoques, validades e perdas
- ✅ Comportamento de clientes (90-95% acurácia)
- ✅ Previsões de demanda inteligentes
- ✅ Identificação de oportunidades upsell/cross-sell
- ✅ Detecção de clientes em risco (churn)
- ✅ Notificações automáticas por setor

---

## 📋 ARQUIVOS CRIADOS

### 1. **Migração SQL** (`004_real_time_analytics.sql`)
- 12 novas tabelas para dados em tempo real
- RLS policies para segurança
- Funções auxiliares (RFM, detecção anomalias)
- **Status:** ✅ Pronto para deploy

### 2. **Documentação Arquitetura** (`SMART_MARKET_INTELIGENCIA_NEGOCIO.md`)
- Explicação completa do sistema
- 5 tipos de análises com Claude
- Token usage e custos
- Dashboard mockup
- **Status:** ✅ Completo

### 3. **Prompts Otimizados** (`prompts.js`)
- 5 builders de prompts reutilizáveis
- JSON responses estruturadas
- Expected tokens por tipo
- **Status:** ✅ Pronto para integração

---

## 🔄 FASES DE IMPLEMENTAÇÃO

### FASE 1: Infra de Dados (1 semana)

```
[ ] 1.1 - Deploy migração 004_real_time_analytics.sql
    └─ Criar todas as 12 tabelas
    └─ Ativar RLS policies
    └─ Validar indexes

[ ] 1.2 - Integração PDV → transacoes_clientes
    └─ API endpoint /api/vendas (receber transações)
    └─ Mapping de campos
    └─ Queue para PDVs offline

[ ] 1.3 - Sincronizar dados históricos
    └─ Importar clientes existentes
    └─ Histórico de compras (últimos 180 dias)
    └─ Calcular LTV inicial
```

**Saída:** Banco de dados pronto com dados reais

---

### FASE 2: Análises Claude (2-3 semanas)

```
[ ] 2.1 - Expandir edge function
    └─ POST /analisar-inteligencia
    └─ Recebe: tipo_analise, loja_id, dados
    └─ Chama Claude 3.5 Sonnet
    └─ Armazena em insights_ia
    └─ Registra tokens_uso

[ ] 2.2 - Implementar 5 tipos de análise
    ✅ A) Estoque Diário (6AM)
    ✅ B) Comportamento Cliente (semanal)
    ✅ C) Previsão Demanda (5AM)
    ✅ D) Oportunidade Upsell (real-time)
    ✅ E) Detecção Churn (11AM)

[ ] 2.3 - Testing & Validação
    └─ Testar cada análise com dados reais
    └─ Validar JSON outputs
    └─ Medir acurácia
    └─ Otimizar prompts se necessário

[ ] 2.4 - Caching de Previsões
    └─ Tabela previsoes_demanda com cache
    └─ Evitar chamadas redundantes
    └─ TTL de 6 horas por padrão
```

**Saída:** Edge function funcional com 5 análises

---

### FASE 3: Sistema de Alertas (1 semana)

```
[ ] 3.1 - Criar alertas automáticos
    └─ Função trigger ao criar insights_ia
    └─ Gera alertas_notificacoes baseado em severidade
    └─ Define destinatários por tipo

[ ] 3.2 - Integrar canais de notificação
    └─ Email (SendGrid ou similar)
    └─ SMS (Twilio ou similar)
    └─ Push notification (navegador)
    └─ In-app notification

[ ] 3.3 - Dashboard de alertas
    └─ Tab "Alertas" mostra lista
    └─ Filtrar por severidade
    └─ Marcar como lido/acionado
    └─ Real-time updates via WebSocket
```

**Saída:** Alertas funcionando em tempo real

---

### FASE 4: Dashboard Frontend (2 semanas)

```
[ ] 4.1 - Tab Estoques
    └─ Cards críticos (vermelho)
    └─ Em queda (laranja)
    └─ Validades vencendo
    └─ Gráfico perda vs receita

[ ] 4.2 - Tab Clientes
    └─ Matriz RFM (5x5)
    └─ Score churn em barra
    └─ Lista últimas compras
    └─ LTV vs ticket médio

[ ] 4.3 - Tab Insights IA
    └─ Card por análise (tipo, data, insight)
    └─ Ações sugeridas checklist
    └─ Impacto estimado
    └─ Histórico de resultados

[ ] 4.4 - Overview/Dashboard
    └─ Métricas principais (receita, estoque, clientes)
    └─ Alertas críticos destacados
    └─ Trending por categoria
    └─ Oportunidades prontas
```

**Saída:** Dashboard completo e funcional

---

### FASE 5: Integração PDV (2+ semanas)

```
[ ] 5.1 - REST API para PDV
    └─ POST /api/vendas/transacao
    └─ Body: {loja_id, cliente_cpf, itens, valor, timestamp}
    └─ Response: {sucesso, transacao_id, novo_ltv}
    └─ Validação de token/loja

[ ] 5.2 - Integração com Escalas
    └─ TCP/IP listener na loja
    └─ MQTT subscribe (se IoT)
    └─ Serial port (se legacy)
    └─ Sincronizar pesos em estoque_real_time

[ ] 5.3 - Queue para offline
    └─ LocalStorage na loja (PDV/escala)
    └─ Sincronizar quando voltar online
    └─ Retry automático com backoff

[ ] 5.4 - Agent Local (opcional)
    └─ Node.js rodando na loja
    └─ Recebe dados do PDV
    └─ Fila local se sem internet
    └─ Sync com cloud quando online
```

**Saída:** PDV e escalas integradas

---

## 💰 TOKEN USAGE & BILLING

### Custo por Loja por Mês

| Análise | Freq | Input tokens | Output tokens | Custo |
|---------|------|---|---|---|
| Estoque | 1x/dia (30) | 2.500 | 800 | R$ 3.60 |
| Comportamento | 1x/sem (4) | 3.200 | 1.100 | R$ 0.60 |
| Previsão | 1x/dia (30) | 4.800 | 1.500 | R$ 6.90 |
| Upsell | 500x/mês | 1.800 | 600 | R$ 45.00 |
| Churn | 1x/dia (30) | 2.100 | 900 | R$ 3.60 |
| **TOTAL** | | | | **R$ 59.70** |

### Inclusão por Plano

- **Starter (R$ 99.90):** 18.000 tokens/mês (60 análises)
- **Professional (R$ 199.90):** 75.000 tokens/mês (250 análises)
- **Enterprise (R$ 499.90):** 200.000 tokens/mês (unlimited)

### Overage
- **Starter:** R$ 0.30 / 1.000 tokens
- **Professional:** R$ 0.25 / 1.000 tokens
- **Enterprise:** R$ 0.20 / 1.000 tokens

---

## 🔑 CHECKLIST DE DEPLOYMENT

### Antes de Rodar Migração

```
[ ] Backup do banco (Supabase)
[ ] Testar migração em staging
[ ] Validar RLS policies com usuário teste
[ ] Preparar dados históricos para import
```

### Depois da Migração

```
[ ] Validar todas as 12 tabelas criadas
[ ] Testar RLS: usuários veem só suas lojas
[ ] Inserir dados teste
[ ] Validar indexes (performance)
```

### Antes de Primeira Análise

```
[ ] ANTHROPIC_API_KEY configurada em edge function
[ ] Teste de chamada ao Claude API
[ ] Mock de resposta JSON
[ ] Validar armazenamento em insights_ia
[ ] Testar contagem de tokens
```

### Antes de Ir para Produção

```
[ ] Testes de carga (edge function)
[ ] Validar acurácia com dados reais (semana 1)
[ ] Feedback loop: reais vs previstos
[ ] Documentação para cliente final
[ ] Suporte e troubleshooting prontos
```

---

## 📊 ESTIMATIVA DE TRABALHO

| Fase | Semanas | Responsável | Prioridade |
|------|---------|-------------|-----------|
| 1 - Infra Dados | 1 | Backend | 🔴 CRÍTICO |
| 2 - Análises Claude | 2-3 | Backend/ML | 🔴 CRÍTICO |
| 3 - Sistema Alertas | 1 | Backend | 🟠 ALTO |
| 4 - Dashboard | 2 | Frontend | 🟠 ALTO |
| 5 - Integração PDV | 2+ | Backend | 🟡 MÉDIO |

**Total:** ~8-9 semanas para completo (sem PDV)

---

## 🚀 PRÓXIMOS PASSOS (IMEDIATO)

### Dia 1-2
```
[ ] Deploy migração 004_real_time_analytics.sql em produção
[ ] Validar tabelas criadas com sucesso
[ ] Criar backup pós-deploy
```

### Dia 3-5
```
[ ] Expandir edge function
[ ] Implementar análise de estoque (a mais simples)
[ ] Testar chamada ao Claude
```

### Semana 1
```
[ ] 4 análises funcionando
[ ] Dashboard básico
[ ] Alertas para gerentes
```

---

## 📞 SUPORTE & TROUBLESHOOTING

### Common Issues

**"Token limit exceeded"**
- Cliente atingiu limite mensal
- Solução: Upgrade plano ou comprar crédito de tokens

**"Previsão com confiança baixa"**
- Dados insuficientes (< 30 dias)
- Solução: Aguardar 30 dias de histórico

**"Análise demorando"**
- Edge function timeout (>25s)
- Solução: Reduzir dados enviados ou aumentar timeout

**"RLS bloqueando dados"**
- Usuário tentando acessar loja errada
- Solução: Validar usuario_lojas

---

## 📈 MÉTRICAS DE SUCESSO

Após 1 mês:
- ✅ 100% de análises executando sem erro
- ✅ Acurácia de previsão > 85%
- ✅ Churn detection com 80%+ precisão
- ✅ Gerentes usando alertas diariamente
- ✅ Implementação de 50% de recomendações
- ✅ Aumento de ticket médio (upsell) > 5%

Após 3 meses:
- ✅ Acurácia previsão > 90%
- ✅ Redução de perdas > 15%
- ✅ Retenção de clientes > 10%
- ✅ ROI positivo da plataforma
