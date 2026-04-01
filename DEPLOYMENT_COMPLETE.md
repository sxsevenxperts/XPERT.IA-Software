# 🚀 PrevOS Deployment Status - Phase 2-5

**Date**: 2026-04-01  
**Status**: ✅ EDGE FUNCTIONS DEPLOYED | ⏳ MIGRATIONS READY FOR APPLICATION

---

## ✅ COMPLETED: Edge Functions Deployment

All 4 critical Edge Functions have been successfully deployed to Supabase:

### Deployed Functions:
| Function | ID | Status | Created |
|----------|----|----|---------|
| **send-notifications** | `948300e8-25d3-4d21...` | ✅ ACTIVE | 2026-04-01 |
| **sync-portal-status** | `404477ae-8bd2-4ac0...` | ✅ ACTIVE | 2026-04-01 |
| **generate-revenue-forecast** | `36dbbdf0-c1e5-47f9...` | ✅ ACTIVE | 2026-04-01 |
| **generate-workload-forecast** | `f8d25039-0ddd-4eb3...` | ✅ ACTIVE | 2026-04-01 |

**What's Running:**
- 📧 Notification queue processor (send-notifications)
- 🏛️ Judicial portal sync (TRF, INSS, CNJ) with status tracking
- 📊 Revenue forecasting with linear regression & confidence intervals
- 👥 Workload prediction with staffing recommendations

---

## ⏳ NEXT STEP: Apply Database Migrations

5 migrations need to be applied to your Supabase database:

1. **003_notification_system.sql** - Notification queues, settings, and history
2. **004_calendar_integrations.sql** - Google Calendar & Outlook sync tables
3. **005_case_predictions.sql** - AI case viability analysis tables
4. **006_portal_integrations.sql** - Judicial portal tracking tables
5. **007_analytics_predictions.sql** - Revenue & workload prediction tables

### 🎯 Two Options to Apply Migrations:

#### **Option A: Fastest (Recommended) - Dashboard SQL Editor**

1. Go to: **https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new**
2. Copy the SQL from section below (each migration separately)
3. Paste and click **Run** for each migration in order (003 → 004 → 005 → 006 → 007)
4. ✅ Migrations complete!

#### **Option B: Interactive Script**

```bash
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin
chmod +x deploy-migrations.sh
./deploy-migrations.sh
```

---

## 📋 SQL Migrations Ready to Apply

### Migration 003: Notification System
**Tables**: notification_settings, notification_log, notification_queue, contact_info

```sql
-- MIGRATION 003: Sistema de Notificações (Fase 2 - Feature 4)
-- Descrição: Notificações por email, SMS e in-app com configurações por usuário

-- 1. TABELA: NOTIFICATION_SETTINGS (Preferências do usuário)
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'sms', 'push', 'in_app')),
  ativo BOOLEAN DEFAULT true,
  frequencia TEXT DEFAULT 'immediate' CHECK (frequencia IN ('immediate', 'daily', 'weekly', '6hours')),
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('prazo', 'tarefa', 'audiencia', 'documento', 'todos')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, canal, tipo_alerta)
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_settings_user_isolation ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_ativo ON notification_settings(ativo);

-- 2. TABELA: NOTIFICATION_LOG (Histórico de notificações enviadas)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'sms', 'push', 'in_app')),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_ref TEXT,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'falha', 'pendente')),
  erro_msg TEXT,
  lido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_log_user_isolation ON notification_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_canal ON notification_log(canal);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_lido ON notification_log(lido_em);
CREATE INDEX idx_notification_log_criado ON notification_log(created_at);

-- 3. TABELA: NOTIFICATION_QUEUE (Fila de notificações a enviar)
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_ref TEXT,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica')),
  agendado_para TIMESTAMPTZ DEFAULT now(),
  tentativas INT DEFAULT 0,
  max_tentativas INT DEFAULT 3,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'enviado', 'falha')),
  erro_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_agendado ON notification_queue(agendado_para);
CREATE INDEX idx_notification_queue_prioridade ON notification_queue(prioridade);

-- 4. TABELA: CONTACT_INFO (Email e telefone do usuário para notificações)
CREATE TABLE contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT,
  email_verificado BOOLEAN DEFAULT false,
  telefone_verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_info_user_isolation ON contact_info
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_contact_info_user_id ON contact_info(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER notification_settings_update_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_log_update_updated_at BEFORE UPDATE ON notification_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_queue_update_updated_at BEFORE UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contact_info_update_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Migration 004: Calendar Integrations
**Tables**: calendar_integrations, calendar_events, calendar_sync_log

```sql
-- MIGRATION 004: Integrações de Calendário (Fase 2 - Feature 5)
-- Descrição: Sincronização com Google Calendar e Outlook

-- 1. TABELA: CALENDAR_INTEGRATIONS (Configurações de integração)
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  token_criptografado TEXT,
  refresh_token_criptografado TEXT,
  calendar_id TEXT,
  calendar_nome TEXT,
  email TEXT,
  sincronizado_em TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  ultim_sync TIMESTAMPTZ,
  sync_direcao TEXT DEFAULT 'bidirecional' CHECK (sync_direcao IN ('prevos_para_externo', 'externo_para_prevos', 'bidirecional')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_integrations_user_isolation ON calendar_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX idx_calendar_integrations_ativo ON calendar_integrations(ativo);

-- 2. TABELA: CALENDAR_EVENTS (Eventos sincronizados)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE SET NULL,
  alerta_id UUID REFERENCES alertas(id) ON DELETE SET NULL,
  external_event_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  localizacao TEXT,
  attendees TEXT[],
  sincronizado_em TIMESTAMPTZ,
  ultima_atualizacao TIMESTAMPTZ,
  em_prevos BOOLEAN DEFAULT true,
  em_externo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_events_user_isolation ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_integration_id ON calendar_events(integration_id);
CREATE INDEX idx_calendar_events_caso_id ON calendar_events(caso_id);
CREATE INDEX idx_calendar_events_data_inicio ON calendar_events(data_inicio);
CREATE INDEX idx_calendar_events_provider ON calendar_events(provider);

-- 3. TABELA: CALENDAR_SYNC_LOG (Histórico de sincronizações)
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  tipo_sync TEXT NOT NULL CHECK (tipo_sync IN ('full', 'incremental', 'manual')),
  status TEXT DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'processando', 'sucesso', 'falha')),
  eventos_sincronizados INT DEFAULT 0,
  eventos_criados INT DEFAULT 0,
  eventos_atualizados INT DEFAULT 0,
  eventos_deletados INT DEFAULT 0,
  erro_msg TEXT,
  duracao_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_sync_log_integration_id ON calendar_sync_log(integration_id);
CREATE INDEX idx_calendar_sync_log_status ON calendar_sync_log(status);
CREATE INDEX idx_calendar_sync_log_criado ON calendar_sync_log(created_at);

-- Triggers
CREATE TRIGGER calendar_integrations_update_updated_at BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calendar_events_update_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Migration 005: Case Predictions
**Tables**: case_predictions, prediction_history

```sql
-- MIGRATION 005: Análise Preditiva de Casos (Fase 3 - Feature 7)
-- Descrição: Previsões de viabilidade usando IA

-- 1. TABELA: CASE_PREDICTIONS (Análise preditiva)
CREATE TABLE case_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viabilidade_percentual INT CHECK (viabilidade_percentual >= 0 AND viabilidade_percentual <= 100),
  confianca_percentual INT CHECK (confianca_percentual >= 0 AND confianca_percentual <= 100),
  risco_nivel TEXT CHECK (risco_nivel IN ('baixo', 'medio', 'alto', 'critico')),
  fatores_positivos TEXT[],
  fatores_negativos TEXT[],
  recomendacoes TEXT[],
  analise_completa TEXT,
  gerado_por_ia BOOLEAN DEFAULT true,
  modelo_ia TEXT DEFAULT 'claude-3-opus',
  tokens_usados INT,
  tempo_analise_ms INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE case_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY case_predictions_user_isolation ON case_predictions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_case_predictions_user_id ON case_predictions(user_id);
CREATE INDEX idx_case_predictions_caso_id ON case_predictions(caso_id);
CREATE INDEX idx_case_predictions_risco ON case_predictions(risco_nivel);
CREATE INDEX idx_case_predictions_viabilidade ON case_predictions(viabilidade_percentual);

-- 2. TABELA: PREDICTION_HISTORY (Histórico de previsões)
CREATE TABLE prediction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES case_predictions(id) ON DELETE CASCADE,
  versao INT DEFAULT 1,
  viabilidade_anterior INT,
  motivo_mudanca TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prediction_history_prediction_id ON prediction_history(prediction_id);
CREATE INDEX idx_prediction_history_created ON prediction_history(created_at);

-- Triggers
CREATE TRIGGER case_predictions_update_updated_at BEFORE UPDATE ON case_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Migration 006: Portal Integrations
**Tables**: portal_integrations, processo_status, portal_sync_log

```sql
-- MIGRATION 006: Portais Judiciais (Fase 4 - Feature 12)
-- Descrição: Integração com TRF, INSS, CNJ

-- Table: portal_integrations
CREATE TABLE portal_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  portal_tipo TEXT NOT NULL,
  numero_processo TEXT NOT NULL,
  credenciais_criptografadas TEXT,
  ultimo_sync TIMESTAMPTZ,
  proxima_sync_agendada TIMESTAMPTZ,
  frequencia_sync TEXT DEFAULT 'daily',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, numero_processo, portal_tipo)
);

ALTER TABLE portal_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY portal_integrations_user_isolation ON portal_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_portal_integrations_user_id ON portal_integrations(user_id);
CREATE INDEX idx_portal_integrations_caso_id ON portal_integrations(caso_id);
CREATE INDEX idx_portal_integrations_numero_processo ON portal_integrations(numero_processo);

-- Table: processo_status
CREATE TABLE processo_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES portal_integrations(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id),
  portal_tipo TEXT NOT NULL,
  numero_processo TEXT NOT NULL,
  
  status_atual TEXT NOT NULL,
  ultima_movimentacao TEXT,
  data_ultima_movimentacao TIMESTAMPTZ,
  fase_processual TEXT,
  juizo_atual TEXT,
  
  partes TEXT[],
  advogados TEXT[],
  eventos_ultimos_30_dias INT DEFAULT 0,
  
  sincronizado_em TIMESTAMPTZ DEFAULT now(),
  proxima_verificacao TIMESTAMPTZ,
  notificacao_enviada BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE processo_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY processo_status_user_isolation ON processo_status
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_processo_status_user_id ON processo_status(user_id);
CREATE INDEX idx_processo_status_integration_id ON processo_status(integration_id);
CREATE INDEX idx_processo_status_numero_processo ON processo_status(numero_processo);
CREATE INDEX idx_processo_status_caso_id ON processo_status(caso_id);
CREATE INDEX idx_processo_status_status_atual ON processo_status(status_atual);

-- Table: portal_sync_log
CREATE TABLE portal_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES portal_integrations(id) ON DELETE CASCADE,
  portal_tipo TEXT NOT NULL,
  numero_processo TEXT,
  
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  status TEXT NOT NULL,
  mensagem_erro TEXT,
  movimentacoes_encontradas INT DEFAULT 0,
  notificacoes_geradas INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portal_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY portal_sync_log_user_isolation ON portal_sync_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_portal_sync_log_user_id ON portal_sync_log(user_id);
CREATE INDEX idx_portal_sync_log_integration_id ON portal_sync_log(integration_id);
CREATE INDEX idx_portal_sync_log_status ON portal_sync_log(status);
CREATE INDEX idx_portal_sync_log_data_inicio ON portal_sync_log(data_inicio DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_portal_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_integrations_updated_at_trigger
BEFORE UPDATE ON portal_integrations
FOR EACH ROW
EXECUTE FUNCTION update_portal_integrations_updated_at();

CREATE OR REPLACE FUNCTION update_processo_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processo_status_updated_at_trigger
BEFORE UPDATE ON processo_status
FOR EACH ROW
EXECUTE FUNCTION update_processo_status_updated_at();
```

---

### Migration 007: Analytics & Predictions
**Tables**: revenue_actuals, revenue_predictions, workload_actuals, workload_predictions, analytics_dashboard

```sql
-- MIGRATION 007: Analytics & Previsões ML (Fase 5 - Feature 14)
-- Descrição: Previsões de receita e carga de trabalho

CREATE TABLE revenue_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano DATE NOT NULL,
  receita_realizada DECIMAL(12, 2) NOT NULL,
  cases_fechados INT DEFAULT 0,
  cases_em_andamento INT DEFAULT 0,
  area_pratica TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano)
);

ALTER TABLE revenue_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_actuals_user_isolation ON revenue_actuals
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_revenue_actuals_user_id ON revenue_actuals(user_id);
CREATE INDEX idx_revenue_actuals_mes_ano ON revenue_actuals(mes_ano DESC);

CREATE TABLE revenue_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  mes_ano_previsto DATE NOT NULL,
  receita_prevista DECIMAL(12, 2) NOT NULL,
  intervalo_confianca_inferior DECIMAL(12, 2),
  intervalo_confianca_superior DECIMAL(12, 2),
  confianca_percentual INT,
  
  modelo_versao TEXT,
  fatores_principais TEXT[],
  accuracy_metricas JSONB,
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano_previsto)
);

ALTER TABLE revenue_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_predictions_user_isolation ON revenue_predictions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_revenue_predictions_user_id ON revenue_predictions(user_id);
CREATE INDEX idx_revenue_predictions_mes_ano_previsto ON revenue_predictions(mes_ano_previsto);

CREATE TABLE workload_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano DATE NOT NULL,
  
  casos_abertos INT DEFAULT 0,
  casos_fechados INT DEFAULT 0,
  casos_total INT DEFAULT 0,
  horas_trabalhadas INT DEFAULT 0,
  media_horas_por_caso DECIMAL(8, 2),
  
  carga_alta_prioridade INT DEFAULT 0,
  carga_media_prioridade INT DEFAULT 0,
  carga_baixa_prioridade INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano)
);

ALTER TABLE workload_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY workload_actuals_user_isolation ON workload_actuals
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_workload_actuals_user_id ON workload_actuals(user_id);
CREATE INDEX idx_workload_actuals_mes_ano ON workload_actuals(mes_ano DESC);

CREATE TABLE workload_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano_previsto DATE NOT NULL,
  
  casos_esperados INT,
  horas_estimadas INT,
  carga_estimada TEXT,
  probabilidade_overload DECIMAL(3, 2),
  recomendacoes TEXT[],
  
  confianca_percentual INT,
  modelo_versao TEXT,
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano_previsto)
);

ALTER TABLE workload_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY workload_predictions_user_isolation ON workload_predictions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_workload_predictions_user_id ON workload_predictions(user_id);
CREATE INDEX idx_workload_predictions_mes_ano_previsto ON workload_predictions(mes_ano_previsto);

CREATE TABLE analytics_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  receita_mes_atual DECIMAL(12, 2) DEFAULT 0,
  receita_mes_anterior DECIMAL(12, 2) DEFAULT 0,
  receita_yoy_percentual DECIMAL(5, 2),
  meta_anual DECIMAL(12, 2),
  progresso_meta_percentual DECIMAL(5, 2),
  
  taxa_sucesso DECIMAL(5, 2),
  tempo_medio_resolucao INT,
  casos_ganhos_mes INT,
  casos_perdidos_mes INT,
  
  tendencia_receita TEXT,
  tendencia_caseload TEXT,
  
  insights_IA TEXT[],
  alertas JSONB,
  
  actualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE analytics_dashboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_dashboard_user_isolation ON analytics_dashboard
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_analytics_dashboard_user_id ON analytics_dashboard(user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_revenue_actuals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revenue_actuals_updated_at_trigger
BEFORE UPDATE ON revenue_actuals
FOR EACH ROW
EXECUTE FUNCTION update_revenue_actuals_updated_at();

CREATE OR REPLACE FUNCTION update_revenue_predictions_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revenue_predictions_atualizado_em_trigger
BEFORE UPDATE ON revenue_predictions
FOR EACH ROW
EXECUTE FUNCTION update_revenue_predictions_atualizado_em();

CREATE OR REPLACE FUNCTION update_workload_actuals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workload_actuals_updated_at_trigger
BEFORE UPDATE ON workload_actuals
FOR EACH ROW
EXECUTE FUNCTION update_workload_actuals_updated_at();

CREATE OR REPLACE FUNCTION update_workload_predictions_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workload_predictions_atualizado_em_trigger
BEFORE UPDATE ON workload_predictions
FOR EACH ROW
EXECUTE FUNCTION update_workload_predictions_atualizado_em();
```

---

## ✅ Features Implemented

### Phase 2 (Features 4-6)
- ✅ Notificações (email, SMS, in-app, push) - Edge Function deployed
- ✅ Google Calendar & Outlook sync - Tables ready
- ✅ Relatórios automáticos - Dashboard ready

### Phase 3 (Features 7-9)
- ✅ Análise Preditiva de Casos - Tables ready
- ✅ Documentos IA - Edge Function support ready
- ✅ Dashboard Métricas - Portals ready

### Phase 4 (Features 11-12)
- ✅ Sistema de Revisão & Aprovação - UI components integrated
- ✅ Portais Judiciais - Edge Function deployed

### Phase 5 (Feature 14 only)
- ✅ Analytics & Previsões ML - Edge Functions deployed

---

## 🎯 What's Next

1. **Apply 5 Migrations** (Using Dashboard or Script)
2. **Test Login**: https://prevos.easypanel.io
   - Email: `teste@prevos.com`
   - Password: `123456`
3. **Verify Features**: Navigate to each new menu item
4. **(Optional) Connect APIs**:
   - Google Calendar OAuth
   - Outlook OAuth
   - Mailgun/Twilio for SMS
   - Claude API for AI analysis

---

## 📞 Support

If migrations fail:
1. Check for table existence errors (tables may already exist)
2. Verify RLS policies were created
3. Check Supabase logs: https://app.supabase.com/project/kyefzktzhviahsodyayd/logs

**Application is ready to use once migrations are applied!** ✨
