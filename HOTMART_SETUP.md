# Hotmart Integration Setup

## 🔧 O Que Precisa Ser Configurado

### 1. RESEND_API_KEY (Para enviar emails)

A função `send-expiration-warnings` precisa de API key para enviar emails.

**Passos:**
1. Vá para [resend.com](https://resend.com) e crie conta
2. Gere API key em Settings
3. No Supabase Dashboard:
   - Edge Functions → Settings
   - Adicione secret: `RESEND_API_KEY = sua-chave`

---

### 2. Configurar Cron Job (send-expiration-warnings)

**send-expiration-warnings** deve rodar TODOS OS DIAS.

**Opção recomendada: GitHub Actions**

Adicione ao `.github/workflows/daily-warnings.yml`:

```yaml
name: Daily Expiration Warnings

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC todo dia
  workflow_dispatch:

jobs:
  warnings:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger send-expiration-warnings
        run: |
          curl -X POST https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/send-expiration-warnings \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

---

### 3. Configurar Webhook do Hotmart

**hotmart-webhook-cancellation** recebe cancelamentos.

**No Painel do Hotmart:**
1. Integrações → Webhooks
2. Novo webhook:
   - **URL:** `https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-cancellation`
   - **Evento:** `subscription.cancelled`
   - **Método:** POST

---

## 📧 Fluxo de Avisos

```
Dia 27 (3 dias antes): Email "Subscrição expira em 3 dias"
Dia 30 (expiração): Email "Conta suspensa" + Account bloqueada
Dia 55 (25 dias): Email "ÚLTIMO AVISO - 5 dias para deletar"
Dia 60: Todos os dados deletados
```

---

## ✅ Checklist

- [ ] RESEND_API_KEY no Supabase
- [ ] GitHub Actions workflow criado
- [ ] Hotmart webhook configurado
- [ ] Testou emails (Supabase → Functions → send-expiration-warnings → Logs)
- [ ] Testou webhook (Supabase → Functions → hotmart-webhook-cancellation → Logs)

---

## 🚀 Próximos Passos

1. Configure RESEND_API_KEY
2. Crie `.github/workflows/daily-warnings.yml`
3. Configure webhook no Hotmart
4. Teste com um cancelamento real

Pronto! Sistema de avisos 100% funcional.
