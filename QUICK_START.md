# ⚡ QUICK START - PrevOS Deploy Final

## 🎯 Status Atual

✅ **Code Deployed**  
✅ **Docker Built & Pushed**  
✅ **EasyPanel Live**  
⏳ **Migrations Pendentes**  
⏳ **Edge Functions Pendentes**  

---

## 🚀 PASSO 1: Aplicar Migrations (10 min)

### Opção A: Automático (Recomendado)

```bash
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin
chmod +x deploy-migrations.sh
./deploy-migrations.sh
# Escolha opção 1 para aplicar todas
```

### Opção B: Manual (Supabase Dashboard)

1. Abra: https://app.supabase.com/project/kyefzktzhviahsodyayd/sql/new

2. Cole e execute cada SQL na ordem:

**SQL 1: Notifications**
```sql
-- Copiar todo o conteúdo de:
-- supabase/migrations/003_notification_system.sql
```

**SQL 2: Calendar**
```sql
-- Copiar todo o conteúdo de:
-- supabase/migrations/004_calendar_integrations.sql
```

**SQL 3: Case Predictions**
```sql
-- Copiar todo o conteúdo de:
-- supabase/migrations/005_case_predictions.sql
```

**SQL 4: Portal Integrations**
```sql
-- Copiar todo o conteúdo de:
-- supabase/migrations/006_portal_integrations.sql
```

**SQL 5: Analytics**
```sql
-- Copiar todo o conteúdo de:
-- supabase/migrations/007_analytics_predictions.sql
```

✅ **Verificar**: Supabase → Database → Tables (deve ter 20+ tabelas novas)

---

## 🚀 PASSO 2: Deploy Edge Functions (5 min)

### Opção A: Automático via CLI

```bash
cd /Users/sergioponte/APPS/.claude/worktrees/gifted-darwin

# Fazer login
supabase login

# Link com projeto
supabase link --project-ref kyefzktzhviahsodyayd

# Deploy todas as functions
supabase functions deploy
```

### Opção B: Manual (Supabase Dashboard)

1. Vá para: https://app.supabase.com/project/kyefzktzhviahsodyayd/functions

2. Para cada function abaixo:
   - Clique "Create a new function"
   - Nome: (conforme abaixo)
   - Runtime: Deno
   - Cole o código do arquivo
   - Deploy

**Functions:**

| Nome | Arquivo |
|------|---------|
| send-notifications | supabase/functions/send-notifications/index.ts |
| sync-calendar | supabase/functions/sync-calendar/index.ts |
| generate-report | supabase/functions/generate-report/index.ts |
| analyze-case-ai | supabase/functions/analyze-case-ai/index.ts |
| generate-document-ai | supabase/functions/generate-document-ai/index.ts |
| sync-portal-status | supabase/functions/sync-portal-status/index.ts |
| generate-revenue-forecast | supabase/functions/generate-revenue-forecast/index.ts |
| generate-workload-forecast | supabase/functions/generate-workload-forecast/index.ts |

✅ **Verificar**: Supabase → Functions (todas devem estar com status DEPLOYED)

---

## ✅ PASSO 3: Testar (5 min)

1. Abra: https://prevos.easypanel.io

2. Login com:
   - Email: `teste@prevos.com`
   - Senha: `123456`

3. Verifique menu items:
   - ✅ Tarefas & Alertas
   - ✅ Portais Judiciais ← NOVO
   - ✅ Analytics & ML ← NOVO
   - ✅ Agenda & Prazos
   - ✅ Relatórios

4. Teste pelo menos uma feature:
   - Ir para Portais Judiciais → Adicionar portal
   - Ir para Analytics & ML → Ver previsões

5. Verifique console (F12) → Nenhum erro em vermelho

---

## 🎯 Checklist Rápido

```
MIGRATIONS
  [ ] 003_notification_system ✓
  [ ] 004_calendar_integrations ✓
  [ ] 005_case_predictions ✓
  [ ] 006_portal_integrations ✓
  [ ] 007_analytics_predictions ✓

EDGE FUNCTIONS
  [ ] send-notifications ✓
  [ ] sync-calendar ✓
  [ ] generate-report ✓
  [ ] analyze-case-ai ✓
  [ ] generate-document-ai ✓
  [ ] sync-portal-status ✓
  [ ] generate-revenue-forecast ✓
  [ ] generate-workload-forecast ✓

TESTING
  [ ] App loads sem erros
  [ ] Menu items visíveis
  [ ] Features acessíveis
  [ ] Console sem erros
  
STATUS FINAL
  [ ] Tudo funcionando ✨
```

---

## 🔧 Troubleshooting Rápido

### ❌ "Table does not exist"
→ Aplicou todas as 5 migrations? Refresh a página (Cmd+Shift+R)

### ❌ "Function not found"
→ Deployou todas as 8 functions? Verificar status em Functions

### ❌ "Permission denied"
→ Verificar RLS policies nas tabelas

### ❌ "Login não funciona"
→ Usar credenciais corretas: `teste@prevos.com` / `123456`

---

## 📞 Precisa de Ajuda?

1. **Abra Supabase Dashboard**
   - https://app.supabase.com/project/kyefzktzhviahsodyayd

2. **Verifique Logs**
   - Logs → Functions (erros nas Edge Functions)

3. **Verifique GitHub Actions**
   - https://github.com/sxsevenxperts/prevos/actions

4. **Verifique Browser Console**
   - F12 → Console (erros JavaScript)

---

## ⏱️ Tempo Total

| Atividade | Tempo |
|-----------|-------|
| Migrations | 10 min |
| Edge Functions | 5 min |
| Testar | 5 min |
| **TOTAL** | **~20 min** |

---

## 🎉 Parabéns!

Após completar estes passos, você terá:

✅ 11 Features implementadas  
✅ Machine Learning funcionando  
✅ Portais judiciais sincronizados  
✅ Analytics com previsões  
✅ Notificações configuradas  
✅ 100% em produção  

---

**Próximo comando**: `./deploy-migrations.sh` ou abra Supabase Dashboard

Tempo estimado até sucesso: **20-30 minutos** ⏱️
