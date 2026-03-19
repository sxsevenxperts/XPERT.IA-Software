# Nós de Pagamento para N8N Workflow

## 🎯 Objetivo
Integrar múltiplos gateways de pagamento no workflow N8N do agente SDR, permitindo que o agente processe pagamentos direto na conversa do WhatsApp.

## 📊 Gateways Suportados

| Gateway | Status | Documentação |
|---------|--------|-------------|
| **Stripe** | ✅ Implementado | https://docs.stripe.com |
| **Mercado Pago** | ✅ Implementado | https://www.mercadopago.com.br/developers |
| **ASAAS** | ✅ Implementado | https://asaas.com/api |
| **InfinitePay** | ✅ Implementado | https://infinitepay.com |

---

## 🔧 Configuração de Credenciais no N8N

Cada nó requer credenciais específicas. Configure em **Credentials** → **Create New**:

### Stripe
```
STRIPE_SECRET_KEY: sk_live_xxxxx
APP_URL: https://seu-dominio.com
```

### Mercado Pago
```
MERCADO_PAGO_TOKEN: APP_USR-xxxxx
APP_URL: https://seu-dominio.com
```

### ASAAS
```
ASAAS_API_KEY: sua_api_key
APP_URL: https://seu-dominio.com
```

### InfinitePay
```
INFINITEPAY_API_KEY: sua_api_key
APP_URL: https://seu-dominio.com
```

---

## 📝 Uso nos Workflows N8N

### Estrutura do Nó de Pagamento

```json
{
  "type": "HTTP Request",
  "method": "POST",
  "url": "https://vyvdrbkcrvklcaombjqu.supabase.co/functions/v1/payment-[GATEWAY]",
  "headers": {
    "Authorization": "Bearer JWT_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {
    "lead_email": "{{ lead.email }}",
    "lead_nome": "{{ lead.nome }}",
    "amount_cents": 5000,
    "description": "Produto/Serviço",
    "lead_id": "{{ lead.id }}",
    "user_id": "{{ user_id }}"
  }
}
```

### Exemplo 1: Processamento Sequencial (Stripe → Fallback Mercado Pago)

```
[Início do Fluxo]
    ↓
[Detectar Tipo de Pagamento]
    ↓
[Se Stripe disponível?] 
    ├─ SIM → [Nó HTTP: payment-stripe]
    │          ↓
    │       [Sucesso?]
    │          ├─ SIM → [Enviar Link de Checkout]
    │          └─ NÃO → [Tentar Mercado Pago]
    │
    └─ NÃO → [Nó HTTP: payment-mercado-pago]
                ↓
             [Enviar Link de Checkout]
```

### Exemplo 2: Seleção Dinâmica pelo Lead

```
[Lead informa preferência de pagamento]
    ↓
[If "cartão"?] → [Usar Stripe ou Mercado Pago]
[If "pix"?]    → [Usar ASAAS]
[If "boleto"?] → [Usar ASAAS ou InfinitePay]
```

### Exemplo 3: Múltiplos Gateways em Paralelo (Velocidade)

```
[Chamar 3 gateways simultaneamente]
├─ payment-stripe
├─ payment-mercado-pago
└─ payment-asaas

[Retornar primeiro que responder com sucesso]
```

---

## 💰 Formato de Requisição

Todos os nós aceitam o mesmo formato:

```typescript
interface PaymentRequest {
  lead_email: string;        // Email do lead (obrigatório)
  lead_nome: string;         // Nome do lead (obrigatório para MP, ASAAS, IP)
  amount_cents: number;      // Valor em centavos (5000 = R$50)
  currency?: string;         // Moeda (default: "brl")
  description?: string;      // Descrição do produto
  lead_id?: string;         // ID do lead no banco
  user_id: string;          // ID do usuário (obrigatório)
}
```

### Exemplo de Requisição

```bash
curl -X POST https://vyvdrbkcrvklcaombjqu.supabase.co/functions/v1/payment-stripe \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "lead_email": "cliente@example.com",
    "lead_nome": "João Silva",
    "amount_cents": 19999,
    "currency": "brl",
    "description": "Consultoria 3 meses",
    "lead_id": "uuid-123",
    "user_id": "uuid-456"
  }'
```

---

## ✅ Resposta de Sucesso

```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_xxx",
  "session_id": "cs_live_xxx"
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": "Stripe not configured"
}
```

---

## 🔄 Fluxo Completo no N8N

### Node-by-Node Breakdown

```
1. [Webhook] Recebe mensagem do lead
   ↓
2. [Parse] Extrai valor e gateway preferido
   ↓
3. [Validação] Verifica se lead tem crédito suficiente
   ↓
4. [Condição] Seleciona gateway baseado em preferência/disponibilidade
   ↓
5. [HTTP Request] Chama edge function apropriada
   ├─ Stripe: /payment-stripe
   ├─ Mercado Pago: /payment-mercado-pago
   ├─ ASAAS: /payment-asaas
   └─ InfinitePay: /payment-infinitepay
   ↓
6. [Resposta] Recebe checkout_url e session_id
   ↓
7. [Save] Salva em tabela 'pagamentos' com status 'pendente'
   ↓
8. [WhatsApp] Envia link de checkout para o lead
   ↓
9. [Webhook de Confirmação] (Async)
   - Stripe: /webhooks/stripe
   - MP: /webhooks/mercado-pago
   - ASAAS: /webhooks/asaas
   - IP: /webhooks/infinitepay
   ↓
10. [Update] Atualiza status em 'pagamentos' para 'aprovado'/'recusado'
```

---

## 🚀 Configuração do Webhook (Confirmação de Pagamento)

Cada gateway enviará webhooks para confirmar o pagamento. Configure URLs de retorno:

### Stripe Webhook
```
POST https://seu-dominio.com/webhooks/stripe
```

### Mercado Pago Webhook
```
POST https://seu-dominio.com/webhooks/mercado-pago
```

### ASAAS Webhook
```
POST https://seu-dominio.com/webhooks/asaas
```

### InfinitePay Webhook
```
POST https://seu-dominio.com/webhooks/infinitepay
```

---

## 📊 Banco de Dados - Tabela `pagamentos`

Cada pagamento processado salva:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `user_id` | UUID | Agente SDR que processou |
| `lead_id` | UUID | Lead que efetuou pagamento |
| `gateway` | TEXT | Qual gateway usou |
| `status` | TEXT | pendente/aprovado/recusado |
| `valor_cents` | INT | Valor em centavos |
| `session_id` | TEXT | ID da sessão no gateway |
| `transaction_id` | TEXT | ID da transação após confirmação |
| `criado_em` | TIMESTAMPTZ | Quando foi criado |
| `confirmado_em` | TIMESTAMPTZ | Quando foi confirmado |

---

## 🔐 Segurança

✅ **JWT Validation**: Todas as requisições requerem Bearer token JWT
✅ **RLS Policies**: Usuários só veem seus próprios pagamentos  
✅ **Rate Limiting**: Recomendado limitar a 10 requests/minuto por IP
✅ **HTTPS Only**: Todas as URLs devem ser HTTPS

---

## 💡 Casos de Uso

### 1️⃣ Venda com Pagamento Imediato
```
Agente: "Vamos processar seu pagamento?"
Lead: "Sim, cartão"
Agente: [Chama payment-stripe]
Agente: "Aqui está o link: [checkout_url]"
Lead: [Paga] → Webhook confirma → Lead marcado como "pago"
```

### 2️⃣ Múltiplas Tentativas
```
Lead: "Quero pagar mas Stripe não funciona"
Agente: [Tenta Stripe] → Falha
Agente: [Tenta Mercado Pago] → Sucesso!
Agente: "Aqui está o link do Mercado Pago"
```

### 3️⃣ Reembolso
```
Lead: "Preciso de reembolso"
Agente: [Valida request]
Agente: [Chama função de refund no gateway]
Tabela `pagamentos` atualizada: status = 'reembolsado'
```

---

## 📈 Monitoramento

Ver pagamentos em tempo real:

```sql
SELECT 
  gateway, 
  status, 
  COUNT(*) as total,
  SUM(valor_cents)/100 as valor_total
FROM pagamentos
WHERE criado_em > NOW() - INTERVAL '24 hours'
GROUP BY gateway, status;
```

---

## 🆘 Troubleshooting

| Erro | Solução |
|------|---------|
| "Missing auth" | Verificar token JWT nos headers |
| "Gateway not configured" | Adicionar credenciais em Supabase env |
| "Invalid request" | Verificar formato JSON e campos obrigatórios |
| "Webhook not received" | Verificar URL de retorno no dashboard do gateway |

---

## 📚 Referências

- [Stripe API](https://stripe.com/docs/api)
- [Mercado Pago API](https://www.mercadopago.com.br/developers/pt/reference)
- [ASAAS API](https://docs.asaas.com/reference/overview)
- [InfinitePay API](https://infinitepay.com/developers)
