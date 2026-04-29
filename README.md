# EasyDrive — Painel do Motorista

Aplicativo PWA para motoristas de aplicativo (Uber, 99, inDrive, iFood, etc).

## Funcionalidades

- **Dashboard** — Ganhos do dia, corridas, km rodados, avaliação média
- **Corrida ativa** — Registro de corrida com GPS e rota inteligente
- **Histórico** — Histórico completo de corridas com filtros
- **Estatísticas** — Relatório de ganhos, despesas e lucro por período
- **Analytics** — Gráficos de receita e carga de trabalho
- **Chat** — Chat em tempo real entre motoristas
- **Configurações** — Perfil, veículo, combustível, manutenções, notificações
- **Assinatura** — Integração com Hotmart para gestão de planos

## Stack

- **Frontend**: React 19 + Vite
- **Backend**: Supabase (auth + database + edge functions)
- **Estado**: Zustand
- **Mapas**: Leaflet + React Leaflet
- **Gráficos**: Recharts
- **Deploy**: Docker + Nginx

## Configuração

1. Copie `.env.example` para `.env.local`
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Execute `npm install && npm run dev`

Ver [DEPLOY.md](DEPLOY.md) para deploy em produção.
