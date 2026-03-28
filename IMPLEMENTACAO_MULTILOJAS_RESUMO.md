# 📋 Resumo da Implementação - Smart Market Multi-Lojas

**Data:** 28 de março de 2025
**Status:** ✅ Estrutura completa implementada

---

## O Que Foi Implementado

### 1. 🏪 **Sistema de Múltiplas Lojas (1 Loja = 1 Licença)**

#### Migrations do Supabase
- ✅ `001_add_lojas.sql` - Tabelas básicas (lojas, planos_lojas, usuarios_lojas)
- ✅ `002_loja_by_loja_licensing.sql` - Modelo de licença por loja (subscriptions vinculadas a lojas)
- ✅ `003_claude_analytics.sql` - Tabelas para análises Claude (tokens, previsões, RFM, alertas)

#### Componentes Frontend
- ✅ `/src/pages/Lojas.jsx` - Página de gerenciamento de lojas
  - Adicionar nova loja
  - Editar loja existente
  - Deletar loja
  - Selecionar plano por loja
  - Modal de planos (Starter, Professional, Enterprise)

#### Integração no App
- ✅ `src/App.jsx` - Importação da página Lojas + rota
- ✅ `src/pages/Settings.jsx` - Link "🏪 Gerenciar Lojas"
- ✅ `src/pages/Billing.jsx` - Cards de planos (Starter/Professional/Enterprise)

#### Funções Supabase
- ✅ `src/lib/supabase.js` - Funções para gerenciar lojas
  - `getLojas()`, `createLoja()`, `updateLoja()`, `deleteLoja()`

---

### 2. 🤖 **Integração Claude AI para Análises Preditivas**

#### Edge Function
- ✅ `supabase/functions/analisar-vendas/index.ts`
  - Recebe: histórico de vendas, estoque, clientes
  - Chama Claude 3.5 Sonnet
  - Retorna: previsões + RFM scores + alertas
  - Registra: tokens gastos + custo em USD

#### Análises Fornecidas pela Claude
1. **Previsão de Vendas** - 7, 14 e 30 dias com % confiança
2. **RFM Scoring** - Segmentação de clientes (VIP, Regular, Em Risco, Dorminhoco)
3. **Detecção de Anomalias** - Produtos com baixo estoque, clientes em risco
4. **Recomendações** - Ações imediatas para aumentar vendas

#### Tabelas de Rastreamento
- ✅ `lojas_analises` - Armazena análises completas + custos
- ✅ `tokens_uso` - Rastreia cada token gasto (para faturamento)
- ✅ `previsoes_vendas` - Cache de previsões (não refazer análise)
- ✅ `rfm_scores` - Scores individuais de clientes
- ✅ `alertas_sistema` - Alertas automáticos

---

### 3. 💰 **Modelo de Preços com Tokens Claude**

#### Estrutura de Custos
```
Claude 3.5 Sonnet:
  Input:  $0.003 por 1K tokens
  Output: $0.015 por 1K tokens

Exemplo:
  Uma análise = ~6.300 tokens = $0.0405 de custo
```

#### Planos (com inclusão de análises)
| Plano | Preço | Análises/mês | Custo Tokens | Margem |
|-------|-------|--------------|--------------|--------|
| **Starter** | R$ 99,90 | 7 análises | ~R$ 2,00 | R$ 97,90 |
| **Professional** | R$ 199,90 | 35 análises | ~R$ 8,00 | R$ 191,90 |
| **Enterprise** | R$ 499,90 | Ilimitado | ~R$ 25,00 | R$ 474,90 |

---

### 4. 📊 **Segurança e RLS**

#### Políticas de Acesso
- ✅ Usuário vê apenas suas próprias lojas
- ✅ Gerentes veem lojas que têm acesso
- ✅ Dados isolados por `loja_id`

#### Auditoria
- ✅ Tabela `auditoria_lojas` - Log de acessos
- ✅ Rastreamento de tokens por loja
- ✅ Histórico de análises

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
```
supabase/migrations/
  ├─ 001_add_lojas.sql (lojas básicas)
  ├─ 002_loja_by_loja_licensing.sql (licenciamento)
  └─ 003_claude_analytics.sql (análises Claude)

supabase/functions/analisar-vendas/
  └─ index.ts (edge function)

src/pages/
  └─ Lojas.jsx (gerenciamento de lojas)

docs/
  ├─ LOJAS_STRUCTURE.md (documentação)
  ├─ CLAUDE_AI_INTEGRATION.md (integração Claude)
  └─ IMPLEMENTACAO_MULTILOJAS_RESUMO.md (este arquivo)
```

### Arquivos Modificados
```
src/App.jsx
  + Importar Lojas.jsx
  + Adicionar rota 'lojas'

src/pages/Settings.jsx
  + Link "🏪 Gerenciar Lojas"

src/pages/Billing.jsx
  + Cards de planos com detalhes

src/lib/supabase.js
  + Funções para lojas
```

---

## 🚀 Próximos Passos

### Desenvolvimento
1. **Integração de Pagamento** (Hotmart/Stripe)
   - Webhook para criar subscrição por loja
   - Webhook para cancelamento
   - Webhook para renovação

2. **Dashboard de Análises**
   - Exibir previsões em gráficos
   - Mostrar RFM scores em tabela
   - Alertas em tempo real

3. **API para Terceiros**
   - Endpoints para criar lojas
   - Endpoints para solicitar análises
   - Sistema de API keys por loja

### Testes
- [ ] Testar criação/edição/exclusão de lojas
- [ ] Testar RLS (usuários não veem lojas de outros)
- [ ] Testar integração com Claude (tokens, custos)
- [ ] Testar cache de análises

### Deployment
- [ ] Deploy migrations no Supabase
- [ ] Deploy edge function
- [ ] Configurar variáveis de ambiente (ANTHROPIC_API_KEY)
- [ ] Testar em staging antes de produção

---

## 📞 Configuração Necessária

### Variáveis de Ambiente
```bash
# .env.production
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# .env (Edge Function)
ANTHROPIC_API_KEY=sk-ant-...
```

### Hotmart/Stripe Webhook
```
Deve chamar endpoint que:
1. Cria registro em subscriptions com loja_id
2. Ativa a loja
3. Registra em payment_history
```

---

## 📈 Métricas para Monitorar

### Por Loja
- ✅ Tokens gastos/mês
- ✅ Custo total/mês
- ✅ Taxa de acerto de previsões (comparar previsto vs realizado)
- ✅ Número de análises/mês

### Por Sistema
- ✅ Taxa de erro de análises (falha ao chamar Claude)
- ✅ Tempo médio de resposta
- ✅ Tokens economizados com cache

---

## ✅ Checklist de Implementação

- [x] Criar tabelas de lojas
- [x] Criar modelo de licença (1 loja = 1 subscrição)
- [x] Criar page Lojas.jsx
- [x] Integrar com App.jsx
- [x] Adicionar link em Settings
- [x] Mostrar planos em Billing
- [x] Criar edge function Claude
- [x] Criar tabelas de rastreamento (tokens, análises, RFM, alertas)
- [x] Criar documentação completa
- [ ] Testar em local
- [ ] Deploy em staging
- [ ] Integração com Hotmart/Stripe
- [ ] Dashboard de análises
- [ ] Testes e2e

---

---

## 🔌 **Integração com PDVs e Balanças**

### Arquitetura de Conexão

```
┌─────────────────────────────────────────────────────────┐
│              Smart Market Backend (Supabase)             │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼────┐ ┌──▼───────┐ ┌▼─────────┐
   │   API   │ │WebSocket │ │  MQTT    │
   │ REST    │ │(Real-     │ │ (IoT)    │
   │(/api)   │ │time)      │ │          │
   └────┬────┘ └──┬────────┘ └┬─────────┘
        │         │           │
        │    ┌────┴─────┬─────┴──────┐
        │    │          │            │
   ┌────▼────▼──┐   ┌──▼──────┐ ┌───▼──────┐
   │  PDVs      │   │Balanças  │ │Câmeras/  │
   │(Gerenciador│   │(Eletrônicas
   │ como Tef)  │   │TCP/IP)   │ │Sensores  │
   └────────────┘   └──────────┘ └──────────┘
```

### 1️⃣ **PDV (Sistema de Ponto de Venda)**

#### Opções de Integração

**Opção A: API REST (Padrão)**
```
PDV → HTTP POST → Smart Market API
      [vendas, cliente_id, itens, valor]
            ↓
         Supabase
         (salva em trips/estoque)
```

**Opção B: Sincronização em Lote**
```
PDV → JSON exportado a cada 1h → Smart Market
      (arquivo ou FTP)
            ↓
         Parser
            ↓
      Salva em Supabase
```

**Opção C: Webhook do PDV**
```
Evento de venda no PDV
            ↓
Webhook automático → Smart Market
            ↓
         Registra na loja
```

#### Dados Necessários do PDV
```json
{
  "loja_id": "uuid-xxx",
  "transacao_id": "PDV-20250328-001",
  "data_hora": "2025-03-28T14:32:00Z",
  "cliente_id": "CLI-12345",
  "itens": [
    { "produto_id": "SKU-001", "nome": "Óleo Soja 900ml", "qtd": 2, "valor_unitario": 8.50 },
    { "produto_id": "SKU-002", "nome": "Pão Francês", "qtd": 4, "valor_unitario": 0.80 }
  ],
  "subtotal": 20.40,
  "desconto": 0.00,
  "total": 20.40,
  "metodo_pagamento": "dinheiro|cartao|pix",
  "operador": "Maria Silva"
}
```

#### Fluxo de Integração
```
┌─ PDV Sistema ─────────────────┐
│                               │
│ 1. Cliente compra items      │
│ 2. Total R$ 150,00           │
│ 3. Paga                      │
│ 4. Gera transação            │
└─────────────┬─────────────────┘
              │
        [HTTP POST]
              │
         ┌────▼────────────┐
         │ Smart Market    │
         │ /api/vendas     │
         └────┬────────────┘
              │
         ┌────▼─────────────────┐
         │ Supabase             │
         │ INSERT trips         │
         │ UPDATE estoque       │
         │ UPDATE RFM scores    │
         └──────────────────────┘
              │
         ┌────▼─────────────────┐
         │ Claude AI            │
         │ (análise noturna)    │
         │ - Previsão de vendas │
         │ - RFM atualizado     │
         └──────────────────────┘
```

---

### 2️⃣ **Balanças Eletrônicas**

#### Protocolo de Comunicação

**Opção A: TCP/IP Direto**
```
Balança Eletrônica
    (IP: 192.168.1.100:5000)
              ↓
       [TCP Connection]
              ↓
    Smart Market Agent
    (roda na loja ou nuvem)
              ↓
    Recebe peso + sku
    {sku: "SKU-001", peso: 2.350kg, valor: R$ 19.95}
              ↓
    Envia para Supabase
```

**Opção B: MQTT (IoT padrão)**
```
Balança Eletrônica
    (conectada ao Wi-Fi)
              ↓
    Publica: /lojas/{id}/balanca/leitura
    {peso: 2.350, sku: "SKU-001"}
              ↓
    Broker MQTT (Mosquitto)
              ↓
    Smart Market subscribe
              ↓
    Processa + Supabase
```

**Opção C: Serial RS-232/USB**
```
Balança Eletrônica
    (USB ou Serial)
              ↓
    Agent local (roda no caixa)
              ↓
    Lê porta serial
    {peso, sku}
              ↓
    Envia HTTP → Cloud
```

#### Dados de Balança
```json
{
  "loja_id": "uuid-xxx",
  "balanca_id": "BAL-001",
  "timestamp": "2025-03-28T14:35:22Z",
  "produto_sku": "SKU-TOMATE-001",
  "peso_kg": 2.350,
  "valor_calculado": 19.95,
  "status": "pronto|pesando|erro"
}
```

#### Fluxo Integrado PDV + Balança
```
Cliente compra tomates na balança
         │
         ├─→ Balança mede: 2.350kg
         │         │
         │    [TCP/MQTT]
         │         │
         │    Smart Market
         │         │
         │    Calcula: R$ 19.95
         │         │
         ├─→ Envia para PDV
         │         │
         ├─→ PDV registra na venda
         │         │
         └─→ Armazena em Supabase
                   │
              ┌────▼────────────┐
              │ trips table      │
              │ + estoque baixo  │
              └─────────────────┘
```

---

### 3️⃣ **Agent Local (Software na Loja)**

Para lojas que não têm Internet estável, é necessário um **Agent Local**:

```typescript
// agent-local.ts (roda na loja em um mini-PC/Raspberry Pi)

class AgenteLoja {
  lojaId: string
  balancas: Map<string, Balanca> = new Map()
  pdvConnected: boolean = false
  
  constructor(loja_id: string) {
    this.lojaId = loja_id
    
    // Conectar à balança via Serial/MQTT
    this.conectarBalanca()
    
    // Conectar ao PDV
    this.conectarPDV()
    
    // Queue local (se internet cair, enfileira)
    this.initQueue()
  }
  
  async conectarBalanca() {
    // Ouve porta serial ou MQTT
    // Quando peso chega, valida e envia para nuvem
  }
  
  async conectarPDV() {
    // HTTP/WebSocket com PDV
    // Recebe vendas
    // Sincroniza dados
  }
  
  async processarVenda(venda) {
    try {
      // Tentar enviar para nuvem
      await fetch('/api/vendas', { body: JSON.stringify(venda) })
    } catch (e) {
      // Internet caiu? Enfileira localmente
      this.queue.push(venda)
    }
  }
  
  async sincronizar() {
    // A cada 5 min, tenta enviar fila
    while (this.queue.length > 0) {
      const venda = this.queue.shift()
      await this.enviarParaNuvem(venda)
    }
  }
}
```

---

### 4️⃣ **Implementação por Fases**

#### **Fase 1: MVP (Próximas 2 semanas)**
- [ ] API REST `/api/vendas` para PDVs
- [ ] Receber dados de venda (cliente, itens, valor)
- [ ] Salvar em `trips` table
- [ ] Sincronizar com Supabase

#### **Fase 2: Balanças (Próximas 4 semanas)**
- [ ] Integração TCP/IP com balanças eletrônicas
- [ ] Protocolo de comunicação (peso + SKU)
- [ ] Validação de peso vs estoque
- [ ] Cálculo automático de valor

#### **Fase 3: Agent Local (Próximas 6 semanas)**
- [ ] Software para lojas sem internet estável
- [ ] Queue local para sincronização
- [ ] Offline-first architecture

#### **Fase 4: Webhooks Inteligentes**
- [ ] PDV dispara webhook ao final do dia
- [ ] Reconciliação automática
- [ ] Alertas de discrepâncias

---

### 5️⃣ **Segurança na Integração**

```
PDV → HTTPS + API Key + JWT Token
         ↓
Valida origem (IP da loja)
         ↓
Autentica com chave da loja
         ↓
Registra em auditoria_lojas
         ↓
Salva em Supabase (RLS protege)
```

#### Variáveis de Ambiente por Loja
```bash
LOJA_API_KEY_uuid-xxx = "sk_live_..."
LOJA_SECRET_uuid-xxx = "sk_secret_..."
BALANCA_IP_xxx = "192.168.1.100"
BALANCA_PORTA_xxx = "5000"
```

---

### 6️⃣ **Exemplo de Implementação**

**PDV chama Smart Market:**
```bash
curl -X POST https://smartmarket.com/api/vendas \
  -H "Authorization: Bearer $LOJA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "loja_id": "uuid-xxx",
    "transacao_id": "PDV-20250328-001",
    "data_hora": "2025-03-28T14:32:00Z",
    "cliente_id": "CLI-12345",
    "itens": [
      {"produto_id": "SKU-001", "nome": "Óleo", "qtd": 2, "valor_unitario": 8.50}
    ],
    "total": 17.00,
    "metodo_pagamento": "dinheiro"
  }'

Response:
{
  "success": true,
  "venda_id": "uuid-venda",
  "timestamp": "2025-03-28T14:32:05Z",
  "rfm_score_atualizado": true
}
```

**Balança publica peso:**
```mqtt
Topic: /lojas/uuid-xxx/balanca/BAL-001
Payload: {
  "peso_kg": 2.350,
  "sku": "SKU-TOMATE-001",
  "timestamp": "2025-03-28T14:35:22Z"
}
```

---

## 🎯 Próxima Reunião

**Tópicos para Discutir:**
1. Confirmação do modelo de preços (planos e margins)
2. Integração exata com Hotmart/Stripe
3. **Quais PDVs/balanças o cliente usa atualmente?**
4. **Preferência: API REST vs MQTT vs Agent Local?**
5. Timeline de deployment
6. Prioridades de features (dashboard vs API vs integrações)
