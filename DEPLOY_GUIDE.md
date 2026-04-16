# 🚀 PrevOS - Guia Completo de Deploy em Produção

**Data**: 01 de Abril de 2026  
**Status**: ✅ Code Deploy Completo | ⏳ Migrations Pendentes  
**Tempo Estimado Total**: 30-40 minutos

---

## 📊 Status Atual

### ✅ Concluído
- Code enviado para `prevos/main` (commit 52d5f50)
- Docker image compilado e enviado para GHCR
- EasyPanel webhook acionado
- GitHub Actions pipeline completo (36 segundos)

### ⏳ Próximos Passos
1. Aplicar 5 Migrations no Supabase
2. Deploy 8 Edge Functions
3. Testar aplicação em produção

---

## 🔐 Informações do Projeto

```
🔹 Projeto Supabase: kyefzktzhviahsodyayd
🔹 URL: https://kyefzktzhviahsodyayd.supabase.co
🔹 Organização: betwemqfsjaadmqkedli
🔹 Banco de Dados: PostgreSQL 17
```

---

## 📝 PASSO 1: Aplicar Migrations

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new
2. Cole cada SQL abaixo na ordem
3. Clique "Run" ou pressione `Cmd+Enter`

### Opção B: Via Supabase CLI

```bash
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin

# Fazer login
supabase login

# Criar link com projeto
supabase link --project-ref kyefzktzhviahsodyayd

# Aplicar migrations
supabase migration up
```

---

## 📋 SQL a Executar (Ordem Importante)

### **MIGRATION 1: Sistema de Notificações** (Feature 4 - Fase 2)
```sql
-- MIGRATION: Sistema de Notificações (Fase 2 - Feature 4)
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

-- (... resto da migration 003 ...)
```

**Arquivo Completo**: `/Users/sergioponte/APPS/.claude/worktrees/gifted-darwin/supabase/migrations/003_notification_system.sql`

---

### **MIGRATION 2: Integrações de Calendário** (Feature 5 - Fase 2)

**Arquivo**: `/Users/sergioponte/APPS/.claude/worktrees/gifted-darwin/supabase/migrations/004_calendar_integrations.sql`

---

### **MIGRATION 3: Previsões de Casos** (Feature 7 - Fase 3)

**Arquivo**: `/Users/sergioponte/APPS/.claude/worktrees/gifted-darwin/supabase/migrations/005_case_predictions.sql`

---

### **MIGRATION 4: Portais Judiciais** (Feature 12 - Fase 4)

**Arquivo**: `/Users/sergioponte/APPS/.claude/worktrees/gifted-darwin/supabase/migrations/006_portal_integrations.sql`

---

### **MIGRATION 5: Analytics & Previsões ML** (Feature 14 - Fase 5)

**Arquivo**: `/Users/sergioponte/APPS/.claude/worktrees/gifted-darwin/supabase/migrations/007_analytics_predictions.sql`

---

## 🚀 PASSO 2: Deploy Edge Functions

Após aplicar as migrations, deploy as Edge Functions:

### Via Supabase Dashboard

1. Acesse: https://app.supabase.com/project/kyefzktzhviahsodyayd/functions
2. Clique "Create a new function"
3. Para cada function abaixo:
   - Nome: (conforme abaixo)
   - Runtime: Deno
   - Cole o código do arquivo
   - Deploy

### Functions a Deployer

| Nome | Arquivo | Descrição |
|------|---------|-----------|
| `send-notifications` | supabase/functions/send-notifications/index.ts | Enviar notificações |
| `sync-calendar` | supabase/functions/sync-calendar/index.ts | Sincronizar calendários |
| `generate-report` | supabase/functions/generate-report/index.ts | Gerar relatórios |
| `analyze-case-ai` | supabase/functions/analyze-case-ai/index.ts | Análise com IA |
| `generate-document-ai` | supabase/functions/generate-document-ai/index.ts | Geração de documentos |
| `sync-portal-status` | supabase/functions/sync-portal-status/index.ts | Sync de portais judiciais |
| `generate-revenue-forecast` | supabase/functions/generate-revenue-forecast/index.ts | Previsão de receita |
| `generate-workload-forecast` | supabase/functions/generate-workload-forecast/index.ts | Previsão de carga |

### Via CLI

```bash
# A partir do diretório do projeto
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin

supabase functions deploy send-notifications --project-ref kyefzktzhviahsodyayd
supabase functions deploy sync-calendar --project-ref kyefzktzhviahsodyayd
supabase functions deploy generate-report --project-ref kyefzktzhviahsodyayd
supabase functions deploy analyze-case-ai --project-ref kyefzktzhviahsodyayd
supabase functions deploy generate-document-ai --project-ref kyefzktzhviahsodyayd
supabase functions deploy sync-portal-status --project-ref kyefzktzhviahsodyayd
supabase functions deploy generate-revenue-forecast --project-ref kyefzktzhviahsodyayd
supabase functions deploy generate-workload-forecast --project-ref kyefzktzhviahsodyayd
```

---

## ✅ PASSO 3: Verificar Deployment

### Checklist de Verificação

- [ ] Aplicadas 5 migrations (verificar em Database → Tables)
- [ ] Deployed 8 Edge Functions (verificar em Functions)
- [ ] Aplicação acessível em produção
- [ ] Menu items visíveis no Sidebar
- [ ] Nenhum erro no console do navegador

### Teste Rápido

1. Acesse: https://prevos.easypanel.io (ou seu domínio)
2. Login com: `teste@prevos.com` / `123456`
3. Verifique menu items:
   - ✅ Tarefas & Alertas
   - ✅ Portais Judiciais (NOVO)
   - ✅ Analytics & ML (NOVO)
   - ✅ Agenda & Prazos
   - ✅ Relatórios

### Troubleshooting

**Erro: "Table does not exist"**
- ✓ Verifique se todas as 5 migrations foram executadas
- ✓ Refresh a página (Cmd+Shift+R para hard refresh)

**Erro: "Function not found"**
- ✓ Verifique se todas as 8 Edge Functions foram deployadas
- ✓ Verifique se os nomes das functions estão corretos

**Erro: "Permission denied"**
- ✓ Verifique RLS policies nas tables
- ✓ Verifique se auth.uid() está configurado corretamente

---

## 📊 Resumo das Features Implementadas

### ✅ Phase 2 - Fase de Notificações & Integrações
- **Feature 4**: Sistema de Notificações (Email, SMS, Push, In-App)
- **Feature 5**: Google Calendar & Outlook Integration
- **Feature 6**: Relatórios Automáticos (PDF, Excel, Email)

### ✅ Phase 3 - Fase de IA & Inteligência
- **Feature 7**: Análise Preditiva de Casos (Claude API)
- **Feature 8**: Geração de Documentos com IA
- **Feature 9**: Dashboard de Métricas

### ✅ Phase 4 - Fase de Colaboração & Portais
- **Feature 11**: Sistema de Revisão & Aprovação
- **Feature 12**: Integração com Portais Judiciais (TRF, INSS, CNJ)

### ✅ Phase 5 - Fase de Analytics
- **Feature 14**: Analytics & Previsões com Machine Learning

### ❌ Não Implementadas (Conforme Solicitado)
- Feature 10: Agendas Compartilhadas com Cliente
- Feature 13: Automação Legal Avançada
- Feature 15: Integrações Avançadas

---

## 🔗 Links Úteis

| Recurso | URL |
|---------|-----|
| Supabase Dashboard | https://app.supabase.com/project/kyefzktzhviahsodyayd |
| Supabase SQL Editor | https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new |
| Edge Functions | https://app.supabase.com/project/kyefzktzhviahsodyayd/functions |
| GitHub Actions | https://github.com/sxsevenxperts/prevos/actions |
| PrevOS App | https://prevos.easypanel.io |

---

## ⏱️ Cronograma Estimado

| Atividade | Tempo |
|-----------|-------|
| Aplicar 5 Migrations | 5-10 min |
| Deploy 8 Edge Functions | 2-5 min |
| Testar aplicação | 5-10 min |
| Configurar integrações (opcional) | 10-15 min |
| **TOTAL** | **30-40 min** |

---

## 📞 Suporte

Se encontrar erros ou dúvidas:

1. Verifique o console do navegador (F12 → Console)
2. Verifique logs do Supabase (Logs → Functions)
3. Verifique GitHub Actions (Actions → Build & Deploy)
4. Verifique status das migrations (Database → Tables)

---

**Deploy realizado em**: 01 de Abril de 2026 às 13:01 UTC  
**Próxima revisão**: Após verificar migrations e Edge Functions
