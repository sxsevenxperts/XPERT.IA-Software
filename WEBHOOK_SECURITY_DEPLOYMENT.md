# 🔒 Webhook Security - HMAC SHA256 Validation

## ✅ Implementação Completa

Adicionado **HMAC SHA256 signature validation** a ambos os webhooks Hotmart:
- `hotmart-webhook-subscription` - valida assinaturas ao processar novas subscrições
- `hotmart-webhook-cancellation` - valida assinaturas ao processar cancelamentos

### Por que isso é importante?

Sem validação, qualquer pessoa poderia fazer POST para os webhooks e:
- Criar subscrições falsas
- Cancelar subscrições válidas
- Acessar a conta de outros usuários

## 📋 Passo 1: Deploy das Edge Functions Atualizadas

### Via Supabase Web Console (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/untmxmbqgdagfqhmqyvm/functions
2. Clique em `hotmart-webhook-subscription`
3. Copie o conteúdo completo de `/supabase/functions/hotmart-webhook-subscription/index.ts`
4. Cole na editor web do Supabase
5. Clique em "Deploy"
6. Repita para `hotmart-webhook-cancellation`

### Via CLI (Requer Token)

```bash
supabase functions deploy hotmart-webhook-subscription --project-ref untmxmbqgdagfqhmqyvm
supabase functions deploy hotmart-webhook-cancellation --project-ref untmxmbqgdagfqhmqyvm
```

## 🧪 Passo 2: Testar a Validação

### Teste 1: Webhook COM assinatura válida (✅ deve passar)

```bash
curl -X POST https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-subscription \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Signature: 00aed49f654dd07a4ca5eef60c339fb91525ddcbfa99a550c68f192c60b500df" \
  -d '{"subscriber":{"email":"test@example.com"},"transaction":{"id":"test-tx-123"}}'
```

**Resposta esperada:** 
```json
{
  "ok": true,
  "webhook_received": true,
  "message": "Usuário ainda não cadastrado. Será criado ao fazer login."
}
```

### Teste 2: Webhook SEM assinatura (❌ deve ser rejeitado)

```bash
curl -X POST https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-subscription \
  -H "Content-Type: application/json" \
  -d '{"subscriber":{"email":"test@example.com"},"transaction":{"id":"test-tx-123"}}'
```

**Resposta esperada:**
```json
{
  "error": "401 Invalid Hotmart signature"
}
```

**Status HTTP:** `401 Unauthorized`

### Teste 3: Webhook COM assinatura INVÁLIDA (❌ deve ser rejeitado)

```bash
curl -X POST https://untmxmbqgdagfqhmqyvm.supabase.co/functions/v1/hotmart-webhook-subscription \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Signature: aabbccddee00112233445566778899aabbccdd" \
  -d '{"subscriber":{"email":"test@example.com"},"transaction":{"id":"test-tx-123"}}'
```

**Resposta esperada:** `401 Unauthorized`

## 📊 Logs para Validação

No Supabase Dashboard → Edge Functions → hotmart-webhook-subscription → Logs

Você deve ver:

**✅ Sucesso:**
```
✅ Hotmart signature valid
📩 Webhook Hotmart: Nova subscrição para test@example.com
```

**❌ Falha:**
```
❌ 401 Invalid Hotmart signature (missing header or secret)
❌ 401 Invalid Hotmart signature (mismatch)
Received: aabbccddee...
Computed: 00aed49f65...
```

## 🔐 Como Hotmart Envia a Assinatura

Hotmart calcula a assinatura assim:

```javascript
const crypto = require('crypto');
const secret = "ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346"; // HOTMART_WEBHOOK_SECRET
const bodyText = JSON.stringify(webhookPayload);

const signature = crypto
  .createHmac('sha256', secret)
  .update(bodyText)
  .digest('hex');

// Envia no header:
// X-Hotmart-Signature: 00aed49f654dd07a4ca5eef60c339fb91525ddcbfa99a550c68f192c60b500df
```

## ✨ Fluxo de Segurança Completo

1. **Hotmart faz a compra processada**
   - Gera webhook com dados da subscrição
   - Calcula HMAC SHA256 do body com secret
   - Envia header `X-Hotmart-Signature: <hash>`

2. **EasyDrive recebe o webhook**
   - Extrai assinatura do header
   - Faz hash SHA256 do body com SECRET armazenado
   - Compara assinaturas
   - ✅ Se combinar → processa webhook
   - ❌ Se não combinar → rejeita com 401

3. **Segurança garantida**
   - Ninguém pode falsificar webhooks
   - Transações são autenticadas
   - Subscrições são confiáveis

## 📝 Checklist de Deployment

- [ ] Arquivo `/supabase/functions/hotmart-webhook-subscription/index.ts` atualizado
- [ ] Arquivo `/supabase/functions/hotmart-webhook-cancellation/index.ts` atualizado  
- [ ] Edge Functions deployadas via Supabase Console
- [ ] HOTMART_WEBHOOK_SECRET configurado em Supabase Secrets
- [ ] Teste 1 (webhook válido) passou ✅
- [ ] Teste 2 (webhook sem assinatura) rejeitado ✅
- [ ] Teste 3 (assinatura inválida) rejeitado ✅
- [ ] Logs mostram "✅ Hotmart signature valid"

## 🚨 Problema Corrigido

**Antes:** Qualquer pessoa podia fazer POST e criar subscrições
**Depois:** Apenas Hotmart (com secret) pode criar subscrições válidas

## 📞 Suporte

Se o webhook estiver retornando 401:

1. Verifique se `HOTMART_WEBHOOK_SECRET` está configurado
   - Supabase → Edge Functions → "View All Secrets"
   - Deve ter `HOTMART_WEBHOOK_SECRET = ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346`

2. Verifique os logs
   - Procure por "401 Invalid Hotmart signature"
   - Compare a assinatura enviada vs. computada

3. Valide localmente
   ```node
   const secret = "ryLQ9hVi2lomJNWbJg6S2L2UY3vNxl34399346";
   const payload = '{"subscriber":{"email":"test@example.com"}}';
   const sig = require('crypto')
     .createHmac('sha256', secret)
     .update(payload)
     .digest('hex');
   console.log(sig);
   ```
