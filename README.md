# PrevOS

Plataforma SaaS para advogados previdenciaristas. Gestão de casos, cálculos de benefícios INSS, petições assistidas por IA, assinatura digital, integração com portais e muito mais.

> ℹ️ **Nota:** Este repositório (historicamente nomeado `XPERT.IA-Software`) contém apenas o **PrevOS**. O Agente SDR XPERT.IA foi separado para o repositório [`XPERT.IA-SDR`](https://github.com/sxsevenxperts/XPERT.IA-SDR). Há também um espelho do PrevOS em [`prevos`](https://github.com/sxsevenxperts/prevos).

## Stack

- **Frontend**: React 19 + Vite 7
- **Backend**: Supabase (Auth, Database, Edge Functions / Deno)
- **IA**: Claude API (Anthropic)
- **Pagamentos**: Asaas + Stripe (via Edge Functions)
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
| Relatórios | Relatórios gerenciais em CSV compatível com Excel |
| Analytics | Dashboard de métricas avançadas |
| Configurações | Configurações de conta, notificações e integrações |

## Edge Functions (Supabase)

- `fetch-cases-by-oab` — busca processos via número OAB
- `sync-portal-status` — sincroniza status de processos nos portais
- `generate-revenue-forecast` / `generate-workload-forecast` — projeções
- `generate-report` — relatórios CSV por período
- `generate-analytics-insights` — métricas operacionais reais
- `sync-calendar` — sincronização com provedor externo configurado
- (ver `supabase/functions/`)

## Setup local

```bash
cp .env.example .env.local
# preencher VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

## Keep-alive do Supabase

O repositório inclui o workflow `.github/workflows/supabase-keep-alive.yml`,
executado a cada quatro dias e também manualmente pelo GitHub Actions. Cadastre
os secrets `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no repositório. O job faz
uma leitura mínima em `app_health` e usa o endpoint público de configurações do
Auth apenas como fallback durante a implantação inicial do schema.

Esse mecanismo reduz o risco de pausa por inatividade no plano Free, mas não é
garantia de disponibilidade. A garantia oficial contra pausa exige um plano
Supabase pago.

## Deploy (Docker)

```bash
docker build -t prevos .
docker run -p 80:80 prevos
```

Push em `main` aciona o GitHub Actions que builda e publica
`ghcr.io/sxsevenxperts/prevos:latest`.

Ver `DEPLOY.md` para detalhes de produção.
