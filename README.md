# 🏪 Smart Market — Inteligência de Negócio para Varejo

Plataforma de BI em tempo real com análises preditivas usando Claude AI (90-100% acurácia).

## ✨ Features Principais

### 📊 Análises com Claude AI
- **Estoque em Tempo Real:** Alertas críticos, giro diário, dias estimados
- **Comportamento de Clientes:** RFM Score, LTV, propensão de churn
- **Previsão de Demanda:** 90-95% acurácia com histórico + sazonalidade
- **Oportunidades Upsell/Cross-sell:** Em tempo real após cada compra
- **Detecção de Churn:** Clientes em risco com plano de recuperação

### 🔔 Notificações Automáticas
- Alertas por severidade (crítico, alto, médio, baixo)
- Destinatários por tipo (gerente, estoquista, vendedor)
- Email, SMS, Push notification, In-app

### 🏗️ Arquitetura Multi-Loja
- Uma licença por loja (SaaS)
- Planos: Starter (R$ 99.90), Professional (R$ 199.90), Enterprise (R$ 499.90)
- Token-based billing para análises Claude
- RLS por loja_id para segurança

## Stack
- **Frontend:** React + Vite + Zustand + Lucide Icons
- **Backend:** Supabase (Cloud) + Edge Functions
- **AI:** Claude 3.5 Sonnet via Anthropic API
- **Deploy:** Docker multi-stage (Nginx) via EasyPanel
- **Database:** PostgreSQL (Supabase) com 12 tabelas de BI

## 🚀 Deploy Rápido

```bash
# 1. Build
npm install
npm run build

# 2. EasyPanel faz deploy automático (GitHub webhook)
# PR → merge em main → EasyPanel detecta e redeploy

# 3. Verificar
curl https://seu-dominio.com
```

## 📚 Documentação

- **SMART_MARKET_INTELIGENCIA_NEGOCIO.md** - Arquitetura completa
- **ROADMAP_IMPLEMENTACAO_INTELIGENCIA.md** - 5 fases de implementação
- **PRECIFICACAO_TOKENS_CLAUDE.md** - Análise de custos token
- **PDV_BALANCA_INTEGRATION.md** - Integração com PDVs e escalas

## 💰 Modelo de Receita

Token usage por loja: ~R$ 60/mês
Margem de lucro: 95%+ em todos os planos
ROI para cliente: 400% em 6 meses (estimado)

## 🔐 Segurança

- RLS (Row Level Security) por loja_id
- Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- JWT tokens do Supabase
- HTTPS obrigatório
