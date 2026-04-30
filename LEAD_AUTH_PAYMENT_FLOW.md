# Fluxo Completo: Cadastro → Login → Pagamento

## 🎯 Objetivo
Garantir que leads façam **cadastro** e **login** ANTES de processar pagamentos.

---

## 📋 Fluxo N8N Detalhado

```
┌─────────────────────────────────────────────────────────────────┐
│                    ETAPA 1: CADASTRO DO LEAD                    │
└─────────────────────────────────────────────────────────────────┘

[Lead entra em contato via WhatsApp]
    ↓
[Agente: "Olá! Para processar seu pedido, preciso de seus dados"]
    ↓
[Lead informa: Nome, Email, Telefone]
    ↓
[Nó: Supabase INSERT → Tabela 'leads']
    ├─ nome: string
    ├─ email: string
    ├─ numero_whatsapp: string
    ├─ ativo: true
    ├─ criado_em: now()
    └─ user_id: agent_id
    ↓
[Resposta: lead_id = uuid-123]
    ↓
[Agente envia confirmação: "Cadastro realizado!"]

┌─────────────────────────────────────────────────────────────────┐
│                     ETAPA 2: LOGIN DO LEAD                      │
└─────────────────────────────────────────────────────────────────┘

[Agente: "Agora vamos criar sua senha"]
    ↓
[Lead informa senha desejada]
    ↓
[Nó: Supabase Update → Tabela 'leads']
    ├─ password_hash: bcrypt(senha)
    ├─ status: 'ativo'
    └─ primeiro_acesso: false
    ↓
[Sistema gera JWT token com lead_id]
    ↓
[Armazena token no contexto do N8N]
    ↓
[Agente: "Ótimo! Você está logado"]

┌─────────────────────────────────────────────────────────────────┐
│                    ETAPA 3: VALIDAÇÃO PRÉ-PAGAMENTO            │
└─────────────────────────────────────────────────────────────────┘

[Lead: "Vou pagar agora"]
    ↓
[Nó: HTTP POST → /functions/v1/validate-lead-auth]
├─ Headers:
│  ├─ Authorization: Bearer JWT_TOKEN
│  └─ Content-Type: application/json
├─ Body:
│  └─ lead_id: uuid-123
    ↓
[Validações executadas:]
├─ ✓ Token JWT válido?
├─ ✓ Token pertence ao lead?
├─ ✓ Lead existe no banco?
└─ ✓ Lead está ativo?
    ↓
[Resposta: authenticated = true]

┌─────────────────────────────────────────────────────────────────┐
│                    ETAPA 4: PROCESSAR PAGAMENTO                 │
└─────────────────────────────────────────────────────────────────┘

[If authenticated = true]
    ↓
[Agente: "Qual forma de pagamento você prefere?"]
    ├─ "Cartão" → payment-stripe
    ├─ "PIX/Boleto" → payment-asaas
    ├─ "Mercado Pago" → payment-mercado-pago
    └─ "InfinitePay" → payment-infinitepay
    ↓
[Nó: HTTP POST → /functions/v1/payment-{GATEWAY}]
├─ Headers:
│  ├─ Authorization: Bearer JWT_TOKEN
│  └─ Content-Type: application/json
├─ Body:
│  ├─ lead_email: lead.email
│  ├─ lead_nome: lead.nome
│  ├─ amount_cents: 5000
│  ├─ description: "Produto XYZ"
│  ├─ lead_id: uuid-123
│  └─ user_id: agent_id
    ↓
[Recebe resposta: checkout_url]
    ↓
[Agente envia link: "Clique aqui para pagar: {checkout_url}"]
    ↓
[Lead clica → Gateway processa pagamento]

┌─────────────────────────────────────────────────────────────────┐
│                  ETAPA 5: CONFIRMAÇÃO (WEBHOOK)                 │
└─────────────────────────────────────────────────────────────────┘

[Gateway (Stripe/MP/ASAAS) envia webhook]
    ↓
[POST /webhooks/{GATEWAY}]
    ├─ Status: payment.confirmed
    └─ Transaction ID: tx-123
    ↓
[Nó: Supabase UPDATE → Tabela 'pagamentos']
├─ status: 'aprovado'
├─ transaction_id: tx-123
└─ confirmado_em: now()
    ↓
[Lead marcado como "PAGO"]
    ↓
[Agente: "Pagamento confirmado! Acesso liberado."]
```

---

## 📊 Tabelas Envolvidas

### `leads` (Tabela Principal)
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  numero_whatsapp TEXT,
  password_hash TEXT,          -- ← Armazena senha hasheada
  ativo BOOLEAN DEFAULT true,  -- ← Status de login
  stage TEXT,
  criado_em TIMESTAMPTZ,
  ultimo_acesso TIMESTAMPTZ
);
```

### `pagamentos` (Histórico de Transações)
```sql
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  gateway TEXT,                -- stripe, mercado_pago, asaas, infinitepay
  valor_cents INT,
  status TEXT,                 -- pendente, aprovado, recusado
  session_id TEXT,             -- ID na plataforma de pagamento
  transaction_id TEXT,         -- ID após confirmação
  criado_em TIMESTAMPTZ,
  confirmado_em TIMESTAMPTZ
);
```

---

## 🔐 Fluxo de Autenticação Detalhado

### Passo 1: Gerar JWT Token (após login bem-sucedido)

```typescript
// No N8N, após validar senha:
const payload = {
  sub: lead.id,              // Subject = lead_id
  email: lead.email,
  iat: Date.now(),
  exp: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 dias
};
const token = jwt.sign(payload, JWT_SECRET);
```

### Passo 2: Validar Token Antes de Pagar

```bash
curl -X POST https://vyvdrbkcrvklcaombjqu.supabase.co/functions/v1/validate-lead-auth \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "uuid-123"
  }'
```

**Resposta de Sucesso:**
```json
{
  "authenticated": true,
  "lead": {
    "id": "uuid-123",
    "nome": "João Silva",
    "email": "joao@example.com",
    "stage": "qualified"
  },
  "message": "Autenticado com sucesso"
}
```

**Resposta de Erro:**
```json
{
  "authenticated": false,
  "error": "Invalid token"
}
```

---

## 🛠️ Nós N8N Necessários

### Node 1: Receber Cadastro
```json
{
  "type": "Webhook",
  "method": "POST",
  "content": "Lead envia nome, email, telefone"
}
```

### Node 2: Validar Email Único
```json
{
  "type": "Supabase",
  "operation": "SELECT",
  "table": "leads",
  "where": "email = $1",
  "check": "count == 0"
}
```

### Node 3: Inserir Lead no Banco
```json
{
  "type": "Supabase",
  "operation": "INSERT",
  "table": "leads",
  "data": {
    "nome": "{{ $input.body.nome }}",
    "email": "{{ $input.body.email }}",
    "numero_whatsapp": "{{ $input.body.telefone }}",
    "user_id": "{{ agent_id }}",
    "ativo": true
  }
}
```

### Node 4: Enviar Confirmação
```json
{
  "type": "WhatsApp",
  "text": "Cadastro realizado! Lead ID: {{ $prev.id }}"
}
```

### Node 5: Receber Solicitação de Pagamento
```json
{
  "type": "Webhook",
  "method": "POST",
  "content": "Lead quer pagar"
}
```

### Node 6: Validar Autenticação
```json
{
  "type": "HTTP Request",
  "method": "POST",
  "url": "https://.../functions/v1/validate-lead-auth",
  "headers": {
    "Authorization": "Bearer {{ jwt_token }}"
  },
  "body": {
    "lead_id": "{{ lead_id }}"
  }
}
```

### Node 7: Processar Pagamento (Condicional)
```json
{
  "type": "HTTP Request",
  "method": "POST",
  "url": "https://.../functions/v1/payment-{{ gateway }}",
  "condition": "if previous.authenticated == true",
  "body": {
    "lead_email": "{{ lead.email }}",
    "lead_nome": "{{ lead.nome }}",
    "amount_cents": 5000,
    "lead_id": "{{ lead_id }}",
    "user_id": "{{ agent_id }}"
  }
}
```

### Node 8: Enviar Link de Pagamento
```json
{
  "type": "WhatsApp",
  "text": "Clique para pagar: {{ previous.checkout_url }}"
}
```

---

## 🔒 Segurança

✅ **Senha hasheada** com bcrypt (NUNCA salvar em texto plano)
✅ **JWT token** com expiração (7 dias)
✅ **Validação** antes de cada operação sensível
✅ **RLS policies** para isolamento de dados
✅ **HTTPS only** para todas as requisições
✅ **Rate limiting** para prevenir ataques

---

## 📈 Monitoramento

Ver leads cadastrados e seus pagamentos:

```sql
SELECT 
  l.id,
  l.nome,
  l.email,
  l.ativo,
  COUNT(p.id) as total_pagamentos,
  SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_cents ELSE 0 END)/100 as valor_total_pago
FROM leads l
LEFT JOIN pagamentos p ON l.id = p.lead_id
GROUP BY l.id
ORDER BY l.criado_em DESC;
```

---

## 🆘 Troubleshooting

| Erro | Solução |
|------|---------|
| "Lead not found" | Verificar se lead foi cadastrado |
| "Invalid token" | Token expirou, fazer novo login |
| "Lead inactive" | Lead foi desativado (ativo = false) |
| "Email already exists" | Validar unicidade antes de cadastrar |
| "Payment not processed" | Validar autenticação antes de cobrar |

---

## 💡 Melhores Práticas

1. **Sempre validar** antes de cobrar
2. **Usar HTTPS** em todas as URLs
3. **Expirar tokens** após 7 dias
4. **Logar tentativas** de pagamento falhas
5. **Confirmar** pagamento via webhook
6. **Notificar lead** após confirmação

