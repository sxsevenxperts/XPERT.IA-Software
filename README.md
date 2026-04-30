# XPERT.IA Software — PrevOS

Plataforma SaaS para advogados previdenciaristas. Gestão de casos, cálculos de benefícios INSS, petições assistidas por IA, assinatura digital, portais e muito mais.

## Stack

- **Frontend**: React 19 + Vite 7
- **Backend**: Supabase (Auth, Database, Edge Functions / Deno)
- **IA**: Claude API (Anthropic)
- **Pagamentos**: Asaas + Stripe (via Edge Functions)
- **Automação de leads**: n8n (workflow SDR multi-agente)
- **Serve (prod)**: Nginx (Docker multi-stage build)

## Módulos

| Módulo | Descrição |
|---|---|
| Dashboard | Visão geral de métricas, alertas e tarefas |
| Clientes | Cadastro e gestão de clientes |
| Casos | Processos com predição de resultado via IA |
| Tarefas | Gerenciamento de tarefas com prazos |
| Calculadora | Cálculo de benefícios INSS (aposentadoria, BPC, auxílio) |
| Petições | Geração de petições assistida por IA |
| Laudos IA | Análise de laudos médicos com IA |
| Jurisprudência | Pesquisa jurisprudencial com IA |
| Juiz Virtual | Simulação de decisão judicial |
| Portais | Integração com portais (e-CAC, Meu INSS, etc.) |
| Agenda | Calendário de compromissos e audiências |
| Intimações | Acompanhamento de intimações processuais |
| Comunicações | Canal de comunicação com clientes |
| Financeiro | Controle financeiro e honorários |
| Planejamento | Planejamento previdenciário |
| Relatórios | Relatórios gerenciais em PDF |
| Analytics | Dashboard de métricas avançadas |
| Configurações | Configurações de conta, notificações e integrações |

## Edge Functions (Supabase)

- `payment-asaas` / `payment-stripe` — checkout e webhooks
- `validate-lead-auth` — autenticação de leads do funil
- `auto-onboard-user` — onboarding automático pós-pagamento
- `predict-conversion-probability` — scoring de conversão via IA
- `notify-new-lead`, `notify-followup` — notificações de leads
- `send-email`, `send-whatsapp` — comunicação com clientes
- E mais (ver `supabase/functions/`)

## Agente SDR (n8n)

Workflow de atendimento automático de leads com IA multi-agente:
- `workflow-agente-sdr-n8n-v2.3.json` — versão atual com logging
- `workflow-agente-sdr-v2.json` — versão estável

Importar no n8n via **File → Import Workflow**.

## Setup local

```bash
cp .env.example .env.local
# preencher VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Deploy (Docker)

```bash
docker build -t prevos .
docker run -p 80:80 --env-file .env prevos
```

Ver `DEPLOY.md` para detalhes de produção.
