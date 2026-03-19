# Fluxo V3 — O Que o Cliente Configura e Recebe

## 📱 Cenário: Um Lead Manda Mensagem WhatsApp

---

## ⚙️ **PASSO 1: Cliente Configura Tudo no Software**

### 1.1 Página "🤖 Agente & Prompt"
Cliente preenche:
- **Objetivo do agente:** "Qualificar prospects de direito previdenciário e coletar informações para encaminhamento"
- **System Prompt customizado:** Instruções detalhadas de como o agente deve se comportar
  - Exemplo: "Você é um especialista em direito previdenciário. Seu objetivo é qualificar se o lead tem possibilidade de ação judicial..."

**O que o workflow vai fazer com isso:**
- Vai usar esse prompt na chamada ao ChatGPT
- GPT vai "falar" como o cliente quer que ele fale

---

### 1.2 Página "💬 Comunicação"
Cliente preenche:
- **Tonalidade:** "Empático, profissional, usando linguagem simples"
- **Instruções de comunicação:** "Máximo 500 caracteres por mensagem. Uma pergunta por vez. Não fazer promessas de resultado"
- **Mensagem se qualificado:** "Perfeito! Vou agendar uma consulta com nosso especialista"
- **Mensagem se não qualificado:** "Obrigado pelo contato! Infelizmente seu caso não se encaixa..."
- **Áudio:** Toggle se quer respostas em áudio (WhatsApp voice message)

**O que o workflow vai fazer com isso:**
- Vai injetar a tonalidade no prompt do GPT
- Depois de qualificar, vai enviar a mensagem customizada
- Se áudio ativado, vai converter a resposta em MP3 via TTS

---

### 1.3 Página "✅ Qualificação"
Cliente preenche:
- **Critérios de Qualificação:** (1 por linha)
  ```
  1. Tem caso que pode gerar ação judicial
  2. Interessado em conversar com especialista
  3. Disponível para próximos passos
  ```
- **Para onde enviar notificação:**
  - ☑️ Número WhatsApp (ex: 5511999999999)
  - ☑️ Grupo WhatsApp (ex: 120363XXXXXXXXXX@g.us)
  - ☑️ Ambos
- **Número de destino:** 5511999999999 (seu número pessoal ou supervisor)
- **Grupo de destino:** 120363XXXXXXXXXX@g.us (grupo do time)

**O que o workflow vai fazer com isso:**
- Vai avaliá-los contra os critérios que o cliente definiu
- Se lead qualificado → vai mandar notificação pro número/grupo
- A notificação vai ter: nome, celular, resumo da conversa

---

### 1.4 Página "📚 Base de Conhecimento"
Cliente faz upload de PDFs:
- "Artigos sobre direito previdenciário"
- "Jurisprudência favorável"
- "Procedimentos de ação judicial"

**O que o workflow vai fazer com isso:**
- Quando GPT responder o lead, ele vai buscar nesses PDFs primeiro
- Se a resposta estiver nos PDFs → usa informação local (rápido, confiável)
- Se não estiver → busca na web geral

---

### 1.5 **NOVO** — Página "⚙️ Qualificação" → Seção "🔄 Ações Customizáveis"
Cliente marca o que quer que aconteça após qualificação e encerramento:

#### **Após Qualificação (lead virou "qualificado"):**
- ☐ Criar tarefa no CRM
  - com quantos dias de prazo? [3]
- ☐ Agendar follow-up automático
  - em quantos dias? [5]
- ☐ Adicionar tag customizada
  - qual tag? [Alto Potencial]

#### **Ao Encerrar Atendimento (lead desqualificado ou fim da conversa):**
- ☐ Enviar pesquisa de satisfação (via WhatsApp)
- ☐ Remover de lista ativa (não insistir de novo)
- ☐ Adicionar tag customizada
  - qual tag? [Sem Potencial]

**O que o workflow vai fazer com isso:**
- Se cliente marca "Criar tarefa CRM" → cria automaticamente
- Se marca "Agendar follow-up" → cria lembrete para 5 dias
- Se marca "Adicionar tag" → adiciona a tag definida no CRM
- Tudo automatizado, cliente não precisa fazer nada

---

## 📞 **PASSO 2: Lead Manda Mensagem WhatsApp**

```
Lead: "Oi, tive um acidente de trabalho e não recebi o seguro desemprego. 
       Tem alguma chance de eu reclamar na Justiça?"
```

### Que vai acontecer, segundo a segundo:

#### **1️⃣ Recebimento (segundo 1)**
- Workflow recebe a mensagem
- Identifica que é do cliente JOÃO (usuário_id = abc123)
- Verifica: "JOÃO tem tokens disponíveis?" 
  - SIM: continua
  - NÃO: responde "Saldo insuficiente de tokens"

#### **2️⃣ Processamento de Mídia (segundo 2)**
- Se lead mandou áudio → transcreve com Whisper
- Se lead mandou imagem → extrai texto com Vision
- Se lead mandou documento → extrai conteúdo
- Neste caso: só texto, pula essa etapa

#### **3️⃣ Busca de Contexto (segundo 3-5)**
- Vai pra base de conhecimento do JOÃO
- Busca: "acidente trabalho, seguro desemprego, reclamação judicial"
- Encontra: 3 artigos relevantes sobre indenizações

#### **4️⃣ Construção do Prompt (segundo 6)**
O sistema monta um super-prompt para o GPT:
```
[SISTEMA]
- Objetivo: {objetivo do JOÃO}
- Tonalidade: {tonalidade do JOÃO}
- Instruções: {instruções do JOÃO}
- Critérios de qualificação: {critérios do JOÃO}
- Base de conhecimento: {3 artigos encontrados}
- Links prioritários: {links que JOÃO salvou}
- Conversa até agora: {mensagens anteriores}

Responda conforme instruído acima. Ao final, 
indique JSON: {"qualificado": true/false, "nome": "...", "motivo": "..."}
```

#### **5️⃣ Silêncio Estratégico (segundo 7-17)**
- Se GPT responder rápido (< 10 seg) → espera 10 seg
- Motivo: parece mais natural, não tipo robô
- Cliente não percebe nada, é transparente

#### **6️⃣ Resposta do GPT (segundo 18-25)**
GPT responde algo como:
```
"Ótima pergunta! Sim, tem sim! Você pode entrar com ação de 
indenização por acidente de trabalho. Preciso coletar algumas informações:
1. Em que data foi o acidente?
2. Você foi registrado na época?
3. Quais foram seus danos/prejuízos?"

RESPOSTA_JSON: {
  "qualificado": true,
  "nome_completo": "João da Silva",
  "celular": "11988776655",
  "motivo_contato": "Acidente de trabalho, possível ação de indenização",
  "fim_atendimento": false
}
```

#### **7️⃣ Envio para Lead (segundo 26)**
- Manda a resposta pro lead no WhatsApp (texto)
- OU em áudio se cliente marcou "Responder em áudio"
- Deduz tokens da conta

#### **8️⃣ Execução de Ações Customizáveis (segundo 27-35)** ✨ **NOVO**

**Se "qualificado": true** (como é o caso):
- ✅ Cliente marcou "Criar tarefa CRM"?
  - SIM → Cria tarefa no CRM: "Follow-up: João da Silva - Acidente trabalho" (vencimento em 3 dias)
- ✅ Cliente marcou "Agendar follow-up"?
  - SIM → Cria nova tarefa: "Contato follow-up: João da Silva" (vencimento em 5 dias)
- ✅ Cliente marcou "Adicionar tag"?
  - SIM → Adiciona tag "Alto Potencial" ao lead João

#### **9️⃣ Notificação ao Supervisor (segundo 36)**
Sistema envia pro número/grupo do cliente:
```
📋 LEAD QUALIFICADO

Nome: João da Silva
Celular: 11988776655
Motivo: Acidente de trabalho, possível ação de indenização

Histórico:
[Lead]: "Oi, tive um acidente..."
[Agent]: "Ótima pergunta!..."

---
✅ Status: QUALIFICADO
🏷️ Tags: Alto Potencial
```

---

## 🔄 **CONTINUAÇÃO DA CONVERSA**

### Supervisor Responde
Supervisor lê a notificação, ve que lead é bom, e quer continuar conversando por conta própria (não automático).

**OU** lead manda outra mensagem:

```
Lead: "Foi em janeiro de 2024. Sim, era registrado."
```

Workflow faz a MESMA COISA:
1. Verifica tokens
2. Busca contexto na base
3. Injeita no prompt
4. GPT responde
5. **Agora vai fazer a 3ª pergunta**

GPT também avalia: "Este lead ainda é qualificado?" 
- SIM: mantém qualificado
- NÃO: marca como "não_qualificado"

---

## ❌ **CENÁRIO: Lead Não Qualificado**

```
Lead: "Na verdade, foi um acidente de rua, não de trabalho"
```

GPT responde:
```
"Ah entendi. Nesse caso, você teria que entrar com ação contra o 
causador do acidente ou com a seguadora dele. Recomendo você buscar 
um advogado especializado em acidentes de trânsito."

RESPOSTA_JSON: {
  "qualificado": false,
  "motivo_nao_qualificado": "Acidente não é de trabalho, fora do escopo",
  "fim_atendimento": true
}
```

### Ações Executadas:
- ✅ Cliente marcou "Remover de lista ativa"?
  - SIM → Lead João é marcado como "inativo" (não vai insistir com mensagens automáticas)
- ✅ Cliente marcou "Enviar pesquisa de satisfação"?
  - SIM → Envia pesquisa via WhatsApp: "Como foi sua experiência? 1-5 ⭐"
- ✅ Cliente marcou "Adicionar tag encerramento"?
  - SIM → Adiciona tag "Sem Potencial" / "Fora do Escopo"

### Notificação ao Supervisor:
```
📋 LEAD DESQUALIFICADO

Nome: João da Silva
Celular: 11988776655
Motivo: Acidente não é de trabalho, fora do escopo

---
❌ Status: NÃO QUALIFICADO
🏷️ Tags: Sem Potencial, Fora do Escopo
```

---

## 🎯 **RESUMO: O Que Cliente Configura vs. O Que Recebe**

### Cliente Configura:
```
┌─────────────────────────────────────────┐
│ 1. Objetivo & Prompt do Agente         │
│ 2. Tonalidade & Instruções de Fala     │
│ 3. Mensagens de Qualificado/Desqualif  │
│ 4. Critérios de Qualificação           │
│ 5. Número/Grupo para Notificações      │
│ 6. Base de Conhecimento (PDFs)         │
│ 7. Links Prioritários de Web           │
│ 8. Ações Customizáveis (NEW) ✨        │
│    └─ Criar tarefas CRM                │
│    └─ Agendar follow-ups               │
│    └─ Adicionar tags                   │
│    └─ Enviar pesquisas                 │
│    └─ Remover de lista ativa           │
└─────────────────────────────────────────┘
```

### Cliente Recebe:
```
┌─────────────────────────────────────────┐
│ ✅ LEADS QUALIFICADOS                  │
│    • Notificação imediata no WhatsApp  │
│    • Resumo da conversa com lead       │
│    • Tarefa no CRM (se habilitado)     │
│    • Follow-up automático (se hab.)    │
│    • Tags customizadas (se hab.)       │
│                                         │
│ ❌ LEADS NÃO QUALIFICADOS              │
│    • Notificação que foi desqualif.    │
│    • Lead marcado como inativo         │
│    • Pesquisa de satisfação (se hab.)  │
│    • Tags customizadas (se hab.)       │
│                                         │
│ 📊 TUDO AUTOMATIZADO                   │
│    • Sem intervenção manual            │
│    • 24/7 mesmo à noite                │
│    • Múltiplos leads simultâneos       │
└─────────────────────────────────────────┘
```

---

## ✅ **ALINHAMENTO COM SOFTWARE**

### O que JÁ EXISTE no software:
- ✅ page-agente (objetivo + prompt customizado)
- ✅ page-comunicacao (tonalidade + mensagens)
- ✅ page-qualificacao (critérios + destino notificações)
- ✅ page-pdfs (base de conhecimento)
- ✅ page-leads (mostra leads + status)
- ✅ page-crm (CRM com tarefas) ← aqui aparecem as tarefas criadas
- ✅ page-fluxos (Designer de Fluxos visual)

### O que FALTA no software:
- ⏳ Seção "Ações Customizáveis" na page-qualificacao
  - Checkboxes para cada ação
  - Inputs para tags/parâmetros
  - Botão "Salvar Ações"

---

## 🚀 **PRÓXIMO PASSO**

Implementar na UI do software a seção "⚙️ Ações Customizáveis":
```
PÁGINA: ✅ Qualificação

Seção "🔄 Ações Após Qualificação":
  ☑️ Criar tarefa no CRM
     Dias para vencimento: [3]
  ☐ Agendar follow-up automático
     Dias: [5]
  ☐ Adicionar tag customizada
     Tag: [_____________]

Seção "🏁 Ações ao Encerrar":
  ☐ Enviar pesquisa de satisfação
  ☐ Remover de lista ativa
  ☐ Adicionar tag customizada
     Tag: [_____________]

[SALVAR AÇÕES]
```

Isso vai salvar em `workflow_acoes` table no Supabase.

---

## 📋 **FLUXO VISUAL**

```
Lead manda msg
   ↓
✅ Tem tokens?
   ├─ NÃO → "Saldo insuficiente"
   └─ SIM:
      ↓
Processa media (áudio/imagem/doc)
   ↓
Busca base de conhecimento
   ↓
Monta prompt com:
  • Objetivo
  • Tonalidade
  • Instruções
  • Base de conhecimento
   ↓
Silêncio estratégico (10s)
   ↓
GPT responde + JSON estruturado
   ↓
Envia resposta pro lead (+ áudio se hab.)
   ↓
Deduz tokens
   ↓
✅ AÇÕES CUSTOMIZÁVEIS:
   ↓
[IF qualificado = true]
   ├─ [IF criar_tarefa] → Cria tarefa CRM
   ├─ [IF agendar] → Agenda follow-up
   └─ [IF tag] → Adiciona tag
   ↓
[IF encerramento]
   ├─ [IF remover_ativo] → Marca inativo
   ├─ [IF pesquisa] → Envia survey
   └─ [IF tag] → Adiciona tag
   ↓
Notifica supervisor
   ↓
FIM (aguarda próxima msg ou ação manual)
```

---

## 🎯 **CHECKLIST: ESTÁ TUDO ALINHADO?**

- ✅ Cliente configura tudo no software → Workflow lê de agente_config
- ✅ Sistema busca base de conhecimento → RPC buscar_conhecimento
- ✅ GPT retorna JSON estruturado → Node "Extrai dados estruturados"
- ✅ Avalia qualificação → Node "IF qualificado?"
- ✅ Executa ações customizáveis → 15 novos nodes no V3 ✨
- ✅ Notifica supervisor → Envia relatório pro número/grupo
- ✅ Cria tarefas CRM → INSERT lead_tarefas automático
- ✅ Cada cliente isolado → RLS user_id em todas as tabelas
- ⏳ UI software falta → Seção "Ações Customizáveis" em page-qualificacao

**TUDO ALINHADO! Falta só a UI da seção de ações customizáveis.**
