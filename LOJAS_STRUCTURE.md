# 🏪 Smart Market - Sistema de Múltiplas Lojas com Licença Individual

## Visão Geral
Smart Market agora suporta **múltiplas lojas** com modelo de **1 LICENÇA POR LOJA** — cada estabelecimento é uma assinatura independente.

---

## Modelo de Negócio (1 LOJA = 1 LICENÇA)

### Exemplo Prático:
```
Usuario: João (proprietário)
├─ Loja A (São Paulo)
│  └─ Subscrição: Starter (R$ 99,90/mês)
│  └─ Licença: ATIVA
│
├─ Loja B (Rio de Janeiro)
│  └─ Subscrição: Professional (R$ 199,90/mês)
│  └─ Licença: ATIVA
│
└─ Loja C (Minas Gerais)
   └─ Subscrição: —
   └─ Licença: SEM ASSINATURA (bloqueada)
```

**Cobrança Total de João:** R$ 99,90 + R$ 199,90 = **R$ 299,80/mês**

---

## Arquitetura do Supabase

### Tabelas Principais

#### 1. **lojas**
Informações de cada loja
```sql
id                UUID (primary key)
user_id           UUID (proprietário original)
nome              TEXT
cnpj              TEXT
endereco          TEXT
cidade            TEXT
estado            TEXT
cep               TEXT
telefone          TEXT
email             TEXT
responsavel       TEXT
status            TEXT ('ativa' | 'inativa' | 'suspensa')
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

#### 2. **subscriptions** (MODIFICADA)
Subscrições **por loja** (não por usuário)
```sql
id                UUID (primary key)
user_id           UUID (quem contratou)
loja_id           UUID (qual loja) ← NOVO
plano             TEXT (starter | professional | enterprise)
status            TEXT (active | cancelled | expired)
preco_mensal      NUMERIC
cobranca_anual    BOOLEAN
proxima_cobranca  DATE
hotmart_transaction TEXT
starts_at         TIMESTAMPTZ
expires_at        TIMESTAMPTZ
created_at        TIMESTAMPTZ
```

**Unique Constraint:** `(loja_id, user_id)` com status='active'
- Uma loja ativa por vez
- Múltiplas lojas = múltiplas assinaturas

#### 3. **planos_lojas** (SIMPLIFICADA)
Apenas planos disponíveis (sem limite de lojas)
```sql
id              TEXT (starter | professional | enterprise)
nome            TEXT
descricao       TEXT
preco_mensal    NUMERIC
preco_anual     NUMERIC
features        JSONB
ativo           BOOLEAN
created_at      TIMESTAMPTZ
```

**Planos Padrão:**
- **Starter** - R$ 99,90/mês
  - Previsão de vendas básica
  - Gestão de estoque
  - 1 usuário
  
- **Professional** - R$ 199,90/mês
  - Previsão + RFM Scoring
  - Estoque avançado
  - 3 usuários
  
- **Enterprise** - R$ 499,90/mês
  - Tudo do Professional
  - Detecção de anomalias
  - Acesso a API
  - 10 usuários

#### 4. **usuarios_lojas** (NOVO)
Permissões por loja (para gerentes, consultores)
```sql
id              UUID
user_id         UUID
loja_id         UUID
role            TEXT ('proprietario' | 'gerente' | 'consultor')
acesso_desde    TIMESTAMPTZ
acesso_ate      TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

**Casos de Uso:**
- João (proprietário) da Loja A
- Maria (gerente) da Loja A e Loja B
- Pedro (consultor) de todas as 3 lojas

#### 5. **lojas_dados** (NOVO)
Cache de métricas analíticas por loja/mês
```sql
id              UUID
loja_id         UUID
mes             DATE (primeiro dia do mês)
vendas_total    NUMERIC
vendas_prevista NUMERIC
estoque_total   NUMERIC
estoque_valor   NUMERIC
ticket_medio    NUMERIC
clientes_total  INTEGER
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### 6. **auditoria_lojas** (NOVO)
Log de acessos e mudanças
```sql
id              UUID
loja_id         UUID
user_id         UUID
acao            TEXT
detalhes        JSONB
created_at      TIMESTAMPTZ
```

---

## Fluxo de Usuário

### 1. Criar primeira loja
```
[+] Adicionar Loja
  ├─ Nome: "Supermercado Centro"
  ├─ CNPJ: 12.345.678/0001-90
  ├─ Endereço: Rua Principal, 123
  ├─ Cidade: São Paulo
  ├─ Estado: SP
  └─ Salvar
  
→ Loja criada com status 'ativa'
→ Mas SEM LICENÇA (bloqueada)
```

### 2. Ativar licença
```
[🏪 Supermercado Centro]
├─ 🔒 Sem Licença
├─ [Ativar Licença]
│
→ Modal de Planos
  ├─ Starter (R$ 99,90/mês)
  ├─ Professional (R$ 199,90/mês)
  └─ Enterprise (R$ 499,90/mês)
  
[Escolher Starter]
→ Redirecionar para checkout
→ Hotmart/Stripe cria subscription
→ Webhook atualiza `subscriptions` com `loja_id`
→ Loja desbloqueada ✅
```

### 3. Adicionar segunda loja
```
[+] Adicionar Loja
  ├─ Nome: "Supermercado Zona Leste"
  └─ Salvar
  
→ Loja criada com status 'ativa' mas SEM LICENÇA
→ João escolhe plano Professional
→ Nova assinatura criada (independente)
→ Total mensal: R$ 99,90 + R$ 199,90 = R$ 299,80
```

---

## Políticas RLS (Row Level Security)

### lojas
- **SELECT:** Proprietário OU usuário com acesso na `usuarios_lojas`
- **INSERT:** Apenas o proprietário
- **UPDATE:** Proprietário OU gerente com role='proprietario'
- **DELETE:** Apenas o proprietário

### subscriptions
- **SELECT:** Usuário que contratou OU usuário com acesso na `usuarios_lojas`

### usuarios_lojas
- **SELECT:** Apenas o próprio usuário pode ver suas lojas

---

## Integração com Pagamento

### Webhook Hotmart/Stripe
```
Event: PURCHASE_APPROVED
├─ hotmart_transaction: "ABC123"
├─ customer_email: "joao@example.com"
├─ product_id: "loja_starter"
├─ custom_field: "{ loja_id: 'uuid-xxx', plan: 'starter' }"
│
→ Criar/atualizar `subscriptions`
├─ loja_id = uuid-xxx
├─ plano = 'starter'
├─ status = 'active'
├─ expires_at = now() + 1 month
└─ proxima_cobranca = calculated
```

### Cobrança Recorrente
- Hotmart/Stripe automaticamente cobra a cada mês
- Webhook notifica renovação
- Loja continua ativa até `expires_at`
- 7 dias antes: notificação de renovação próxima

---

## Interface de Usuário

### Página Lojas
```
🏪 Minhas Lojas
━━━━━━━━━━━━━━━━━
1 LOJA = 1 LICENÇA

[+ Adicionar Loja]

📍 Supermercado Centro
   CNPJ: 12.345.678/0001-90
   R. Principal, 123 - SP
   
   🟢 Licença Ativa | Starter (R$ 99,90/mês)
   Próxima cobrança: 28/04/2025
   [Gerenciar Plano]

📍 Supermercado Zona Leste
   CNPJ: 98.765.432/0001-12
   
   🔴 Sem Licença
   [Ativar Licença]
```

### Modal de Planos
Ao clicar em "Ativar Licença" ou "Gerenciar Plano":
```
Planos para Supermercado Centro
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟦 Starter - R$ 99,90/mês
   ✓ Previsão de vendas
   ✓ Estoque básico
   [Ativar]

🟩 Professional - R$ 199,90/mês
   ✓ RFM Scoring
   ✓ Estoque avançado
   [Ativar] ← ATUAL

🟧 Enterprise - R$ 499,90/mês
   ✓ Tudo acima +
   ✓ Detecção de anomalias
   ✓ API
   [Fazer upgrade]
```

---

## Funcionalidades de Relatórios

Cada loja tem seus próprios dados:
- Vendas
- Estoque
- Clientes (RFM)
- Anomalias
- PDF Reports

Não há mistura entre lojas — dados isolados por `loja_id`.

---

## Segurança

### RLS Força
- Usuário A só vê suas próprias lojas
- Usuário B (gerente) vê apenas lojas que tem acesso
- Dados de uma loja nunca vaza para outra

### Auditoria
- Todo acesso à loja é registrado em `auditoria_lojas`
- Quem acessou, quando, e o quê fez
- Importante para compliance

---

## Próximas Implementações

- [ ] Integração com Hotmart/Stripe webhooks
- [ ] Notificações de renovação de licença
- [ ] Cancelamento/pausa de subscrição
- [ ] Downgrade de plano
- [ ] Relatórios de uso por loja
- [ ] API para criar lojas via integração
- [ ] Dashboard administrativo (multi-loja)
