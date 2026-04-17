# Hotmart Integration Setup

## 🔧 O Que Precisa Ser Configurado

### 1. FIREBASE_CREDENTIALS (Para enviar push notifications)

A função `send-expiration-notifications` precisa de credenciais do Firebase.

**Passos:**
1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Crie projeto (ou use existente)
3. Vá em Project Settings → Service Accounts
4. Clique "Generate New Private Key" (baixa JSON)
5. No Supabase Dashboard:
   - Edge Functions → Settings
   - Adicione secret: `FIREBASE_CREDENTIALS = (cole o conteúdo do JSON)`

---

### 2. Configurar Cron Job (send-expiration-notifications)

**send-expiration-notifications** deve rodar TODOS OS DIAS.

**Opção recomendada: GitHub Actions**

Adicione ao `.github/workflows/daily-notifications.yml`:

```yaml
name: Daily Expiration Notifications

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC todo dia
  workflow_dispatch:

jobs:
  notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger send-expiration-notifications
        run: |
          curl -X POST https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/send-expiration-notifications \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

---

### 3. Configurar Webhooks do Hotmart

**Dois webhooks são necessários:**

#### 3.1 Webhook de Nova Subscrição (CRÍTICO)
**hotmart-webhook-subscription** registra novas compras/assinaturas.

**No Painel do Hotmart:**
1. Integrações → Webhooks
2. Novo webhook:
   - **URL:** `https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-subscription`
   - **Evento:** `subscription.created` (ou `payment.completed`, dependendo da versão do Hotmart)
   - **Método:** POST

**Por que é crítico:**
- Se o redirect (hotmart-success) falhar, este webhook garante que a subscrição é criada no Supabase
- É a fonte de verdade para novas assinaturas
- Sem este webhook, compras podem não ser registradas se houver problema na conexão

#### 3.2 Webhook de Cancelamento
**hotmart-webhook-cancellation** recebe cancelamentos.

**No Painel do Hotmart:**
1. Integrações → Webhooks
2. Novo webhook:
   - **URL:** `https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-cancellation`
   - **Evento:** `subscription.cancelled`
   - **Método:** POST

---

## 📱 Fluxo de Notificações Push

```
Dia 27 (3 dias antes): Push "⏰ Subscrição vencendo - 3 dias"
Dia 30 (expiração): Push "❌ Subscrição expirou" + Account bloqueada
Dia 55 (25 dias): Push "🚨 ÚLTIMO AVISO - 5 dias para deletar"
Dia 60: Todos os dados deletados
```

---

## ✅ Checklist

- [ ] FIREBASE_CREDENTIALS no Supabase (service account JSON)
- [ ] GitHub Actions workflow criado (.github/workflows/daily-notifications.yml)
- [ ] Hotmart webhook de nova subscrição configurado (hotmart-webhook-subscription)
- [ ] Hotmart webhook de cancelamento configurado (hotmart-webhook-cancellation)
- [ ] Testou push notifications (Supabase → Functions → send-expiration-notifications → Logs)
- [ ] Testou webhook de subscrição (Supabase → Functions → hotmart-webhook-subscription → Logs)
- [ ] Testou webhook de cancelamento (Supabase → Functions → hotmart-webhook-cancellation → Logs)

---

## 🚀 Próximos Passos

1. Configure RESEND_API_KEY
2. Crie `.github/workflows/daily-warnings.yml`
3. Configure webhook no Hotmart
4. Teste com um cancelamento real

Pronto! Sistema de avisos 100% funcional.
