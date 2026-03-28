# 🔌 Integração PDV e Balanças - Smart Market

## Visão Geral

O Smart Market coleta dados em **tempo real** de:
1. **PDVs** (Pontos de Venda) - vendas, clientes, itens
2. **Balanças Eletrônicas** - peso, SKU, valor calculado
3. **Outros Sensores** - câmeras, termômetros, etc

Esses dados alimentam as análises Claude AI.

---

## 1. PDV (Ponto de Venda)

### O Que é Necessário

O PDV precisa enviar para Smart Market a cada venda:
```json
{
  "loja_id": "uuid-da-loja",
  "transacao_id": "PDV-20250328-001",
  "data_hora": "2025-03-28T14:32:00Z",
  "cliente_id": "CLI-12345",  // opcional
  "itens": [
    {
      "produto_id": "SKU-001",
      "nome": "Óleo Soja 900ml",
      "quantidade": 2,
      "valor_unitario": 8.50,
      "valor_total": 17.00
    }
  ],
  "subtotal": 17.00,
  "desconto": 0.00,
  "valor_final": 17.00,
  "metodo_pagamento": "dinheiro|cartao|pix",
  "operador": "Maria Silva"
}
```

### Métodos de Integração

#### **Opção 1: API REST (Recomendado)**
```bash
POST https://smartmarket.com/api/vendas

Headers:
  Authorization: Bearer sk_loja_uuid-xxx
  Content-Type: application/json

Body: { ...dados da venda... }
```

**Vantagens:**
- ✅ Simples de implementar
- ✅ HTTPS seguro
- ✅ Funciona com qualquer PDV
- ✅ Responses imediatas

**Implementação em PHP (comum em PDVs):**
```php
<?php
// Quando venda é fechada no PDV
$venda = [
    "loja_id" => "uuid-xxx",
    "transacao_id" => "PDV-" . date("YmdHis"),
    "data_hora" => date("c"),
    "cliente_id" => $cliente_id ?? null,
    "itens" => $itens,
    "valor_final" => $total,
    "metodo_pagamento" => "dinheiro",
    "operador" => $_SESSION['usuario']
];

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://smartmarket.com/api/vendas",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($venda),
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer " . getenv('SMART_MARKET_API_KEY'),
        "Content-Type: application/json"
    ]
]);

$response = curl_exec($curl);
$result = json_decode($response, true);

if ($result['success']) {
    // Venda registrada com sucesso
    // Mostrar recibo com ID de sincronização
    echo "Venda registrada: " . $result['venda_id'];
} else {
    // Erro - salvar localmente e tentar depois
    salvarFilaLocal($venda);
}
?>
```

#### **Opção 2: Webhook (PDV notifica)**
PDV dispara webhook quando venda é concluída:
```bash
POST https://smartmarket.com/webhooks/venda

# PDV tira print de tela ou arquivo JSON
# e envia para Smart Market
```

#### **Opção 3: Sincronização em Lote**
```bash
POST https://smartmarket.com/api/vendas/lote

Body: [
  { venda1 },
  { venda2 },
  ...
]
```

### Fluxo de Integração Típico

```
Caixa da Loja
    │
    ├─ Cliente seleciona itens
    ├─ Sistema calcula total
    ├─ Paga (dinheiro, cartão, PIX)
    ├─ PDV emite recibo
    └─ Gera JSON com dados da venda
          │
          ├─ Tenta enviar para Smart Market
          │  (HTTPS POST)
          │
          ├─ Se internet OK:
          │  └─ Registra em Supabase
          │
          └─ Se internet caiu:
             └─ Salva em arquivo local
                └─ Enfileira para sincronizar depois
                   (a cada 5 min tenta novamente)
```

---

## 2. Balanças Eletrônicas

### O Que é uma Balança Eletrônica

Equipamento que:
- ✅ Pesa itens (kg, g)
- ✅ Calcula preço automaticamente
- ✅ Exibe valor na tela LCD
- ✅ Conecta via TCP/IP ou Serial

### Marcas Comuns
- **Marte** (Brasil)
- **Horacel** (Brasil)
- **Toledo** (Brasil)
- **Bizerba** (Internacional)
- **Digiweigh** (EUA)

### Protocolos de Comunicação

#### **Opção 1: TCP/IP (Direto)**
Balança conectada à rede com IP fixo
```
Balança IP: 192.168.1.100
Porta: 5000

Smart Market Agent (roda na loja ou nuvem):
├─ Conecta: telnet 192.168.1.100 5000
├─ Recebe: "2.350|SKU-001|R$19.95"
├─ Processa: peso=2.350kg, sku=SKU-001
└─ Envia para Supabase
```

**Implementação em Python:**
```python
import socket
import json
from datetime import datetime

def ler_balanca(ip, porta):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((ip, porta))
    
    while True:
        # Balança envia continuamente
        data = sock.recv(1024).decode('utf-8').strip()
        
        if data:
            # Formato: peso|sku|valor
            peso, sku, valor = data.split('|')
            
            payload = {
                "loja_id": "uuid-xxx",
                "balanca_id": "BAL-001",
                "timestamp": datetime.now().isoformat(),
                "produto_sku": sku,
                "peso_kg": float(peso),
                "valor_calculado": float(valor.replace('R$', ''))
            }
            
            # Enviar para Smart Market
            enviar_para_smart_market(payload)
```

#### **Opção 2: MQTT (IoT Padrão)**
Balança publica peso em broker MQTT
```
Broker: mqtt.smartmarket.com
Topic: /lojas/{loja_id}/balanca/{balanca_id}

Mensagem:
{
  "peso": 2.350,
  "sku": "SKU-001",
  "timestamp": "2025-03-28T14:35:22Z"
}
```

**Implementação em Python (Cliente MQTT):**
```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload)
    
    # Calcular preço baseado em tabela
    sku = payload['sku']
    peso = payload['peso']
    preco_por_kg = buscar_preco(sku)
    valor = peso * preco_por_kg
    
    # Enviar para Smart Market
    enviar_para_smart_market({
        "loja_id": userdata['loja_id'],
        "sku": sku,
        "peso": peso,
        "valor": valor,
        "timestamp": datetime.now().isoformat()
    })

client = mqtt.Client()
client.on_message = on_message
client.connect("mqtt.smartmarket.com", 1883, 60)
client.subscribe("/lojas/uuid-xxx/balanca/BAL-001")
client.loop_forever()
```

#### **Opção 3: Serial RS-232 (Legado)**
Balança antiga conectada via porta serial
```
COM3 (Serial) ← Balança
        ↓
Agent Local (roda no PC do caixa)
        ↓
Lê porta serial a cada 500ms
        ↓
Envia HTTP para Smart Market
```

**Implementação em Python:**
```python
import serial
import requests
import json

# Conectar à porta serial
ser = serial.Serial('COM3', baudrate=9600, timeout=1)

while True:
    if ser.in_waiting:
        # Ler peso da balança
        linha = ser.readline().decode().strip()
        
        # Formato: W2.350<CR><LF>
        if linha.startswith('W'):
            peso = float(linha[1:])
            
            # Enviar para Smart Market
            requests.post(
                'https://smartmarket.com/api/balanca',
                headers={
                    'Authorization': 'Bearer sk_loja_xxx',
                    'Content-Type': 'application/json'
                },
                json={
                    'loja_id': 'uuid-xxx',
                    'balanca_id': 'BAL-001',
                    'peso_kg': peso,
                    'timestamp': datetime.now().isoformat()
                }
            )
```

### Fluxo Integrado PDV + Balança

```
CENÁRIO: Cliente compra tomates na balança

1. Cliente coloca tomates na balança
2. Balança mede: 2.350kg
3. Envia para Smart Market: {sku: "SKU-TOMATE", peso: 2.350}
4. Smart Market calcula: 2.350kg × R$8.50/kg = R$19.95
5. Valor aparece na tela da balança: "R$19.95"
6. Cliente pega ticket com código de barra
7. Cliente vai ao caixa (PDV)
8. Operador escaneia código de barra
9. PDV puxa dados: produto, peso, valor
10. PDV registra venda: "1x Tomate 2.350kg - R$19.95"
11. PDV envia para Smart Market:
    {
      "transacao_id": "PDV-xxx",
      "itens": [
        { "sku": "SKU-TOMATE", "peso": 2.350, "valor": 19.95 }
      ]
    }
12. Smart Market:
    ├─ Valida: peso corresponde ao sku?
    ├─ Atualiza estoque: -2.350kg de tomate
    ├─ Registra venda em trips
    └─ Treina modelo Claude para próximas previsões
```

---

## 3. Agent Local (Software na Loja)

Para lojas com internet instável, é necessário um **Agent Local**:

### Requisitos
- Mini-PC ou Raspberry Pi
- Windows/Linux
- 2GB RAM
- Conexão com PDV (Serial/USB/Rede)
- Conexão com balanças (Serial/TCP/MQTT)

### Funcionalidades
```
┌─ Agent Local ────────────────────────┐
│                                      │
│ 1. Lê dados de PDVs e balanças      │
│ 2. Processa localmente               │
│ 3. Enfileira se internet cair        │
│ 4. Sincroniza a cada 5 minutos      │
│ 5. Valida dados antes de enviar     │
│ 6. Gera relatórios locais           │
│                                      │
└──────────────────────────────────────┘
        ↓
   [Fila Local]
   - venda123
   - venda124
   - balanca001
        ↓
   [Tenta enviar]
   ├─ Internet OK?
   │  └─ POST para nuvem
   └─ Internet caiu?
      └─ Tenta novamente em 5 min
```

### Implementação

**index.js (Node.js - multiplataforma)**
```javascript
const express = require('express')
const fs = require('fs')
const axios = require('axios')

class AgenteLoja {
  constructor(loja_id) {
    this.loja_id = loja_id
    this.fila = []
    this.carregarFila()
    
    // Sincronizar a cada 5 minutos
    setInterval(() => this.sincronizar(), 5 * 60 * 1000)
  }
  
  async processarVenda(venda) {
    try {
      // Enviar para nuvem
      const response = await axios.post(
        'https://smartmarket.com/api/vendas',
        venda,
        {
          headers: {
            'Authorization': `Bearer ${process.env.API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log('✅ Venda enviada:', response.data.venda_id)
    } catch (error) {
      console.log('❌ Erro ao enviar venda, enquileirando...')
      
      // Adicionar à fila
      this.fila.push({
        timestamp: new Date().toISOString(),
        tipo: 'venda',
        dados: venda
      })
      
      // Salvar fila em arquivo
      this.salvarFila()
    }
  }
  
  async sincronizar() {
    if (this.fila.length === 0) return
    
    console.log(`Sincronizando ${this.fila.length} itens...`)
    
    const itens_pendentes = [...this.fila]
    
    for (const item of itens_pendentes) {
      try {
        await axios.post(
          'https://smartmarket.com/api/vendas',
          item.dados,
          {
            headers: {
              'Authorization': `Bearer ${process.env.API_KEY}`
            }
          }
        )
        
        // Remover da fila
        this.fila = this.fila.filter(i => i !== item)
      } catch (error) {
        console.log('Tentaremos novamente em 5 minutos...')
        break
      }
    }
    
    // Salvar fila atualizada
    this.salvarFila()
  }
  
  salvarFila() {
    fs.writeFileSync(
      'fila_vendas.json',
      JSON.stringify(this.fila, null, 2)
    )
  }
  
  carregarFila() {
    try {
      this.fila = JSON.parse(
        fs.readFileSync('fila_vendas.json', 'utf-8')
      ) || []
    } catch {
      this.fila = []
    }
  }
}

// Iniciar
const agent = new AgenteLoja(process.env.LOJA_ID)

// Receber dados de PDVs locais via HTTP
const app = express()
app.use(express.json())

app.post('/venda', (req, res) => {
  agent.processarVenda(req.body)
  res.json({ success: true })
})

app.listen(8000, () => {
  console.log('Agent Local rodando em http://localhost:8000')
})
```

---

## 4. Tabelas do Supabase para Dados de PDV

### trips (vendas)
```sql
id          UUID
user_id     UUID
loja_id     UUID ← NOVO
pedido_id   TEXT (ID do PDV)
data_hora   TIMESTAMPTZ
cliente_id  TEXT (opcional)
itens       JSONB [
  {sku, nome, qtd, valor_unitario, valor_total}
]
subtotal    NUMERIC
desconto    NUMERIC
total       NUMERIC
metodo_pag  TEXT (dinheiro | cartao | pix)
operador    TEXT
origem      TEXT (pdv | manual | api) ← rastrear origem
status      TEXT (completa | devolvida)
created_at  TIMESTAMPTZ
```

### balanca_leituras (histórico de balanças)
```sql
id            UUID
loja_id       UUID
balanca_id    TEXT
produto_sku   TEXT
peso_kg       NUMERIC
valor_calcula NUMERIC
hora_leitura  TIMESTAMPTZ
criada_em     TIMESTAMPTZ
```

### sincronizacao_log (auditoria)
```sql
id            UUID
loja_id       UUID
tipo          TEXT (venda | balanca | sensor)
status        TEXT (sucesso | erro | enfileirado)
tentativas    INTEGER
ultima_tenta  TIMESTAMPTZ
erro_msg      TEXT
payload       JSONB
criada_em     TIMESTAMPTZ
```

---

## 5. Segurança

### Validações
```
1. Origem do request (IP da loja)
2. API Key válida
3. loja_id válido
4. Dados consistentes
   - Cliente existe?
   - SKU existe?
   - Peso razoável?
   - Preço corresponde ao SKU?
```

### Criptografia
```
HTTPS + API Key + JWT Token

Headers:
  Authorization: Bearer sk_loja_uuid-xxx
  X-LOJA-ID: uuid-xxx
  X-Signature: HMAC-SHA256(payload)
```

### Quotas
```
PDVs podem enviar:
  - Até 1.000 vendas/dia (Starter)
  - Até 10.000 vendas/dia (Professional)
  - Ilimitado (Enterprise)

Balanças:
  - Até 100 leituras/minuto por balança
```

---

## 6. Exemplo Completo

### PDV PHP envia venda
```php
<?php
$api_key = getenv('SMART_MARKET_API_KEY'); // sk_loja_uuid-xxx

$venda = [
    'loja_id' => 'uuid-xxx',
    'transacao_id' => 'PDV-' . date('YmdHis') . '-001',
    'data_hora' => date('c'),
    'cliente_id' => null,
    'itens' => [
        [
            'produto_id' => 'SKU-TOMATE',
            'nome' => 'Tomate',
            'quantidade' => 2.350,
            'valor_unitario' => 8.50,
            'valor_total' => 19.95
        ]
    ],
    'subtotal' => 19.95,
    'desconto' => 0,
    'valor_final' => 19.95,
    'metodo_pagamento' => 'dinheiro',
    'operador' => 'Maria Silva'
];

$ch = curl_init('https://smartmarket.com/api/vendas');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($venda),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $api_key,
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

if ($data['success']) {
    echo "✅ Venda registrada: " . $data['venda_id'];
} else {
    echo "❌ Erro: " . $data['error'];
}
?>
```

### Balança envia peso (MQTT)
```
Topic: /lojas/uuid-xxx/balanca/BAL-001
Payload: {"peso": 2.350, "sku": "SKU-TOMATE", "timestamp": "2025-03-28T14:35:22Z"}
```

### Smart Market registra
```
INSERT INTO trips (
  loja_id, pedido_id, data_hora, itens, total, origem
) VALUES (
  'uuid-xxx',
  'PDV-xxx',
  '2025-03-28T14:35:00Z',
  '[{sku: "SKU-TOMATE", peso: 2.350, valor: 19.95}]',
  19.95,
  'pdv'
)
```

---

## 7. Checklist de Implementação

**Fase 1: PDV**
- [ ] API endpoint `/api/vendas`
- [ ] Autenticação com API Key
- [ ] Validações básicas
- [ ] Salvar em trips table
- [ ] Teste com PDV simulado

**Fase 2: Balanças**
- [ ] Suporte TCP/IP
- [ ] Suporte MQTT
- [ ] Tabela balanca_leituras
- [ ] Cálculo de preço automático
- [ ] Integração com PDV

**Fase 3: Agent Local**
- [ ] Fila de sincronização
- [ ] Offline-first
- [ ] Reconciliação de dados
- [ ] Logs detalhados

**Fase 4: Monitoramento**
- [ ] Dashboard de sincronização
- [ ] Alertas de erros
- [ ] Relatório de qualidade de dados
