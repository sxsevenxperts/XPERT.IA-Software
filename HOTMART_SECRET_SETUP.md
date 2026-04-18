# Configuração do HOTMART_WEBHOOK_SECRET

## ⚠️ Problema com interface do Supabase

A interface web do Supabase está tendo dificuldades de carregamento. Aqui estão os passos para configurar manualmente:

## Método 1: Via Dashboard Supabase (Interface Web)

1. Acesse: https://supabase.com/dashboard/project/untmxmbqgdagfqhmqyvm/settings/functions
2. No menu lateral esquerdo, procure por **"Secrets"** ou **"Environment Variables"**
3. Clique em **"New Secret"** ou **"New Variable"**
4. Preencha:
   - **Name:** `HOTMART_WEBHOOK_SECRET`
   - **Value:** `ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346`
5. Clique em **"Add Secret"**

## Método 2: Via Supabase CLI (Terminal)

```bash
# Primeira, faça login (se necessário)
supabase login

# Depois, adicione o secret ao projeto
supabase secrets set HOTMART_WEBHOOK_SECRET=ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346 --project-ref untmxmbqgdagfqhmqyvm
```

## Método 3: Via Supabase API

```bash
TOKEN="seu-token-de-acesso-aqui"

curl -X POST https://api.supabase.com/v1/projects/untmxmbqgdagfqhmqyvm/secrets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"HOTMART_WEBHOOK_SECRET",
    "value":"ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346"
  }'
```

## ✅ Após Configurar

Quando a variável estiver configurada:
1. As edge functions `hotmart-webhook-subscription` e `hotmart-webhook-cancellation` terão acesso automático a ela
2. Elas usarão para validar assinaturas HMAC SHA256
3. O sistema estará **100% seguro para vender**

## Verificação

Para verificar que foi adicionado corretamente:
- Vá para **Functions** → clique em `hotmart-webhook-subscription` → abra os logs
- Quando um webhook chegar, você verá:
  - ✅ `Hotmart signature valid` (sucesso)
  - ❌ `401 Invalid Hotmart signature` (falha - webhook bloqueado)
