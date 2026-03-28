# Hotmart Webhook Setup - Smart Market

## Overview

Hotmart webhooks automatically create loja credentials and manage subscriptions when customers purchase PREMIUM plans.

## Webhook Configuration

### 1. Get Your Webhook URL

After deploying to EasyPanel, your webhook URL will be:

```
https://[seu-domain].easypanel.app/functions/v1/payment-hotmart
```

Or via Supabase directly:

```
https://[project-ref].supabase.co/functions/v1/payment-hotmart
```

### 2. Configure Hotmart Webhook

1. Log in to your Hotmart account
2. Go to **Configurações** → **Webhooks**
3. Click **Novo Webhook**
4. Set the URL to your webhook endpoint (see above)
5. Select these events:
   - ✅ PURCHASE_APPROVED
   - ✅ PURCHASE_CANCELED
   - ✅ PURCHASE_REFUNDED
6. Click **Salvar**

### 3. Test the Webhook

Hotmart provides a test button in the webhook settings. You'll see:
- Status: 200 (success)
- Response: `{"success": true, "message": "..."}`

## What Happens on Purchase

### When a customer completes a purchase:

1. **Webhook Event Received** (PURCHASE_APPROVED)
   ```json
   {
     "status": "approved",
     "data": {
       "buyer": {
         "email": "cliente@example.com",
         "cpf": "12345678901"
       },
       "subscription": {
         "recurrence": "monthly" // or "yearly"
       }
     }
   }
   ```

2. **Automatic Actions:**
   - ✅ **Supabase Auth User Created:**
     - Email: buyer's email
     - Password: buyer's CPF/CNPJ (cleaned)
     - Email auto-confirmed
     - CPF stored in user_metadata
   - ✅ **Loja record created in database:**
     - `login_usuario`: buyer's email
     - `senha_usuario`: buyer's CPF/CNPJ (backup)
     - `user_id`: linked to Supabase Auth user
     - `plano`: "premium"
     - `data_expiracao`: 30 days (monthly) or 365 days (annual)
     - `ativo`: true
   - ✅ Payment recorded in `pagamentos` table
   - ✅ Customer can now login immediately

3. **Customer's First Login:**
   - Email: Same as used in Hotmart checkout
   - Password: Their CPF/CNPJ (e.g., "12345678901")
   - Hint shown in login form: "💡 Use seu CPF/CNPJ como senha"
   - LoginLoja tries Supabase Auth first, fallback to database if needed

4. **Password Change:**
   - In Settings → Alterar Senha, customer changes password via Supabase Auth
   - Password updated in Supabase Auth, not in database
   - Email remains the same

## Database Schema

### lojas table additions:
```sql
-- Supabase Auth linkage
user_id UUID REFERENCES auth.users(id) -- Links to Supabase Auth user

-- Authentication fields
login_usuario VARCHAR(255) UNIQUE      -- email
senha_usuario VARCHAR(255)             -- CPF/CNPJ (cleaned, backup only)

-- Subscription management
plano VARCHAR(50)                      -- 'premium'
data_expiracao TIMESTAMPTZ             -- When subscription expires
ativo BOOLEAN DEFAULT true             -- Active/Suspended status
hotmart_product_id VARCHAR(255)        -- Product ID from Hotmart

-- User info
nome_usuario VARCHAR(255)              -- Display name
```

### Supabase Auth user metadata:
```json
{
  "nome": "Customer name",
  "cpf": "12345678901"
}
```

### pagamentos table:
```sql
id UUID PRIMARY KEY
loja_id UUID REFERENCES lojas(id)
valor TEXT                             -- R$ amount
status VARCHAR(50)                     -- approved, cancelled, refunded
metodo VARCHAR(50)                     -- hotmart, credit_card, etc
referencia_hotmart VARCHAR(255)        -- Hotmart transaction ID
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

## Subscription Lifecycle

```
PURCHASE (Hotmart)
    ↓
WEBHOOK TRIGGER (payment-hotmart function)
    ↓
CREATE/UPDATE LOJA (active=true, expires_at=+30d or +365d)
    ↓
CUSTOMER LOGS IN
    ↓
CHECK EXPIRATION
    ├─ Active: Normal access
    ├─ 1-14 days overdue: Warning displayed ⏰
    ├─ 15-29 days: Access suspended 🔒 (can still see warning)
    └─ 30+ days: DELETE from database 🗑️ (can't login, need to repurchase)
```

## Manual Loja Creation (Testing)

If you need to create a test loja manually:

```sql
INSERT INTO lojas (
  login_usuario,
  senha_usuario,
  nome_usuario,
  plano,
  data_expiracao,
  ativo
) VALUES (
  'teste@example.com',
  '12345678901',
  'Loja Teste',
  'premium',
  NOW() + INTERVAL '30 days',
  true
);
```

## Troubleshooting

### Webhook Not Triggering
- Check Hotmart webhook settings → Último evento (last event status)
- Verify URL is correct and publicly accessible
- Check Supabase function logs

### CPF/CNPJ Not Storing Correctly
- Webhook automatically removes formatting: "123.456.789-01" → "12345678901"
- Customer uses cleaned version to login

### Subscription Not Expiring
- Webhook sets `data_expiracao` automatically
- App checks expiration on login and dashboard
- If date not set, user has infinite access (fallback)

### Email Exists, Need to Update
- If email already exists in database:
  - Webhook updates existing loja with new `data_expiracao`
  - Existing password can still be used OR use new CPF/CNPJ
  - Old subscriptions are overwritten (handles renewals)

## Hotmart Product Setup

### Monthly Product (PREMIUM MENSAL)
- Name: Smart Market - Premium Mensal
- Price: R$ 799,90
- Recurrence: Monthly
- Webhook off-code: `rol1yfc0` (in HOTMART_CHECKOUT_MONTHLY URL)

### Annual Product (PREMIUM ANUAL)
- Name: Smart Market - Premium Anual (12x)
- Price: 12× R$ 699,00 = R$ 8.388,00 total
- Recurrence: Yearly
- Webhook off-code: `848zlnlo` (in HOTMART_CHECKOUT_ANNUAL URL)

## Security Notes

✅ **Implemented:**
- Passwords stored securely in Supabase Auth (bcrypt hashing)
- Supabase Auth handles password security
- CPF/CNPJ used as initial password (customers should change it)
- User data linked via Supabase Auth user_id

⚠️ **Recommended for Production:**
- Implement webhook signature validation from Hotmart
- Implement RLS policies for loja_id isolation
- Add HTTPS enforcement
- Monitor webhook logs for failed operations
- Backup payment records regularly

## Next Steps

1. Deploy the edge function to Supabase
2. Configure the webhook URL in Hotmart settings
3. Test with a small purchase
4. Monitor webhook logs for errors
5. All subsequent purchases will auto-create lojas

