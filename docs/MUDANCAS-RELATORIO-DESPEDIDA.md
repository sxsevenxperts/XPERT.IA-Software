# Mudanças: Relatório Completo + Despedida Gentil

## 🎯 Requisito do Usuário
1. **Relatório deve ter RESUMO COMPLETO da conversa**, não apenas 2 palavras
2. **Antes da pesquisa de satisfação**, agente se despeça gentilmente (isso vai estar no prompt)

## ⚠️ CONSIDERAÇÃO IMPORTANTE
**O cliente escolhe qual IA usar:** OpenAI (GPT-4o), Claude (Claude 3.5 Sonnet) ou Gemini (Google Gemini)

Implicações:
- Despedida pode variar conforme a IA (Claude é mais formal, GPT mais natural, Gemini mais criativo)
- O prompt precisa funcionar bem em TODAS as três IAs
- Resumo da conversa será gerado pela IA escolhida (peut variar em qualidade/estilo)
- JSON estruturado ("qualificado", "nome_completo", etc.) precisa ser esperado em qualquer IA

**Solução:** Prompt agnóstico que funciona em qualquer IA, com instruções claras de formato JSON

---

## 📋 MUDANÇA 1: Relatório com Resumo Completo

### Situação Atual (node: "Monta notificacao de transferencia")
```
📋 RELATÓRIO DE ATENDIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: João da Silva
📱 Celular: 11988776655
🎯 Motivo do Contato: Acidente de trabalho
❌ Motivo da Transferência: Não qualificado: Fora do escopo

💬 Aguardando atendimento do agente...
```

**Problema:** Muito resumido, supervisor não vê o que foi conversado.

### Novo Formato (desejado)
```
📋 RELATÓRIO DE ATENDIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: João da Silva
📱 Celular: 11988776655
🎯 Motivo do Contato: Acidente de trabalho
❌ Motivo da Transferência: Não qualificado: Fora do escopo

📝 RESUMO DA CONVERSA:
[Lead]: "Oi, tive um acidente de trabalho e não recebi o seguro desemprego. 
         Tem alguma chance de eu reclamar na Justiça?"

[Agent]: "Ótima pergunta! Sim, tem sim! Você pode entrar com ação de 
          indenização por acidente de trabalho. Preciso coletar algumas informações:
          1. Em que data foi o acidente?
          2. Você foi registrado na época?
          3. Quais foram seus danos/prejuízos?"

[Lead]: "Foi em janeiro de 2024. Sim, era registrado."

[Agent]: "Ótimo! E quais foram seus prejuízos (salários parados, tratamentos, etc)?"

[Lead]: "Na verdade, foi um acidente de rua, não de trabalho"

[Agent]: "Ah entendi. Nesse caso, você teria que entrar com ação contra o 
         causador do acidente ou com a seguadora dele. Recomendo você buscar 
         um advogado especializado em acidentes de trânsito."

💬 Próximos passos: Contatar para oferecer outros serviços ou encaminhamento especializado.
```

**Benefício:** Supervisor vê exatamente o que foi conversado, pode entender contexto completo.

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Node a Modificar: "Monta notificacao de transferencia"

**Mudança no código JavaScript:**

```javascript
const cliente = $('Resolve cliente pelo instanceName').first().json;
const dadosVerif = $('Verifica se precisa transferir').first().json;
const contato = $('Normaliza e filtra mensagem').first().json;
const msgHistory = $('Salva msg cliente').first().json?.message_history || []; // ← NOVO

const nomeCompleto = dadosVerif.nome_completo || contato.nomeContato || 'Contato desconhecido';
const numero = contato.numero || 'N/A';
const motivo = dadosVerif.motivo_contato || 'Não informado';
const motTransf = dadosVerif.motivo === 'nao_qualificado' 
  ? 'Não qualificado: ' + (dadosVerif.nao_qualificado_motivo || 'motivo não informado')
  : 'Fim de atendimento';

// ← NOVO: Montar resumo completo da conversa
const resumoConversa = msgHistory
  .map(msg => {
    const sender = msg.sender === 'user' ? 'Lead' : 'Agent';
    const content = msg.conteudo || msg.content || '';
    return `[${sender}]: "${content}"`;
  })
  .join('\n\n');

const relatorio = `
📋 RELATÓRIO DE ATENDIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nome: ${nomeCompleto}
📱 Celular: ${numero}
🎯 Motivo do Contato: ${motivo}
❌ Motivo da Transferência: ${motTransf}

📝 RESUMO DA CONVERSA:
${resumoConversa}

💬 Aguardando atendimento do agente...
`.trim();

return [{
  json: {
    evoInstance: cliente.evo_instance,
    numeroAtendente: dadosVerif.numeroAtendente,
    relatorio,
    nomeCompleto,
    numero,
    motivo,
    motTransf
  }
}];
```

**O que muda:**
- Acessa `msgHistory` do node anterior ("Salva msg cliente")
- Itera por todas as mensagens (lead + agent)
- Monta string formatada: `[Lead]: "..."` + `[Agent]: "..."`
- Inclui no relatório final

---

## 😊 MUDANÇA 2: Despedida Gentil Antes da Pesquisa

### Novo Node: "Despede gentilmente"
**Tipo:** Code node  
**Posição:** Entre "Verifica se precisa transferir" e "Envia pesquisa satisfação"  
**Condição:** Executar ANTES da pesquisa (na branch que vai para encerramento)

**Código:**

```javascript
const cliente = $('Resolve cliente pelo instanceName').first().json;
const contato = $('Normaliza e filtra mensagem').first().json;
const llmConfig = $('Monta system prompt').first().json;

// Pegar configuração de despedida do cliente (ou usar default)
const configDespedida = $('Busca config: destino relatorio').first().json || [];
const cmap = {};
(Array.isArray(configDespedida) ? configDespedida : []).forEach(c => {
  cmap[c.chave] = c.valor;
});

// Despedida customizável do cliente OU default
const despedida = cmap.msg_desqualificado || 
  'Obrigado pelo contato! Até logo!';

const nomeContato = contato.nomeContato || 'Contato';

// Montar mensagem de despedida
const msgDespedida = `
${despedida}
`.trim();

return [{
  json: {
    evoInstance: cliente.evo_instance,
    numero: contato.numero,
    mensagem: msgDespedida,
    tipo: 'despedida'
  }
}];
```

### Fluxo Atualizado

**ANTES:**
```
IF encerramento?
  ├─ IF remover_ativo → Remove de lista ativa
  ├─ IF pesquisa → Envia pesquisa satisfação ← AQUI A PESQUISA SAI SEM DESPEDIDA
  └─ IF tag → Adiciona tag encerramento
```

**DEPOIS:**
```
IF encerramento?
  ├─ IF remover_ativo → Remove de lista ativa
  ├─ Despede gentilmente ← NOVO NODE
  │  └─ Envia mensagem de despedida via WhatsApp
  ├─ IF pesquisa → Envia pesquisa satisfação ← AGORA SIM, DEPOIS DA DESPEDIDA
  └─ IF tag → Adiciona tag encerramento
```

---

## 📝 MUDANÇA 3: Prompt Padrão com Instrução de Despedida

### ⚠️ Prompt AGNÓSTICO de IA

O prompt precisa funcionar com:
- ✅ OpenAI (GPT-4o)
- ✅ Claude (Claude 3.5 Sonnet)  
- ✅ Gemini (Google Gemini)

**Recomendações:**
- Ser explícito nas instruções (evitar ambiguidade)
- JSON estruturado em formato CLARO
- Usar exemplos de resposta esperada
- Evitar formatação complexa que pode quebrar com IAs diferentes

### PROMPT_PADRAO no software (page-agente)

Adicionar ao final:

```
---

## DESPEDIDA E FECHAMENTO

Ao final do atendimento (quando você decide encerrar ou detecta que não há mais interesse):

1. Se o lead foi QUALIFICADO:
   - Envie a mensagem de qualificado configurada pelo cliente
   - Exemplo: "Ótimo! Vou encaminhar suas informações ao responsável. Em breve entrará em contato."

2. Se o lead foi DESQUALIFICADO ou fim de atendimento:
   - Primeiro, se despça gentilmente com uma frase breve e educada
   - Exemplos de despedidas:
     * "Obrigado pelo contato! Até logo!"
     * "Ficamos à disposição. Até breve!"
     * "Obrigado pela confiança. Que você tenha um ótimo dia!"
     * "Até logo! Fique bem!"
   - Depois, a sistema enviará uma pesquisa de satisfação
   - NÃO inclua a pesquisa na sua mensagem (ela é enviada automaticamente)

A despedida deve ser:
- Breve (máx 50 caracteres)
- Amigável e profissional
- Fechamento natural da conversa
- NÃO prometa retorno ou contato futuro (isso é responsabilidade do atendente)

IMPORTANTE: Sua despedida é enviada ANTES da pesquisa de satisfação.
A pesquisa será enviada automaticamente pelo sistema após sua mensagem.

---

## RESPOSTA ESTRUTURADA (FINAL DO ATENDIMENTO)

Ao final, sempre retorne um JSON com esta estrutura:

{
  "qualificado": true/false,
  "nome_completo": "Nome do Lead",
  "celular": "11999999999",
  "motivo_contato": "Motivo inicial do contato",
  "nao_qualificado_motivo": "Motivo se não qualificado (opcional)",
  "fim_atendimento": true,
  "despedida": "Sua mensagem de despedida aqui"
}

Exemplos:

Exemplo 1 - QUALIFICADO:
{
  "qualificado": true,
  "nome_completo": "João Silva",
  "celular": "11988776655",
  "motivo_contato": "Acidente de trabalho, possível ação judicial",
  "fim_atendimento": false,
  "despedida": ""
}

Exemplo 2 - NÃO QUALIFICADO:
{
  "qualificado": false,
  "nome_completo": "Maria Santos",
  "celular": "21987654321",
  "motivo_contato": "Dúvida sobre direito do consumidor",
  "nao_qualificado_motivo": "Caso já foi julgado, sem nova ação possível",
  "fim_atendimento": true,
  "despedida": "Obrigado pelo contato! Até logo!"
}
```

---

## ✅ Checklist de Mudanças

### V3 Workflow (workflow-agente-sdr-v3.json)

- [ ] **Node "Monta notificacao de transferencia"**
  - Incluir `msgHistory` do node anterior
  - Montar resumo completo da conversa
  - Incluir no relatório final

- [ ] **Novo Node "Despede gentilmente"**
  - Tipo: Code node
  - Busca msg_desqualificado ou default
  - Envia despedida pro lead via WhatsApp
  - Executar ANTES da pesquisa de satisfação

- [ ] **Conexões do Workflow**
  - Redirecionar branch de encerramento:
    - (antiga) IF encerramento → IF remover → IF pesquisa
    - (nova) IF encerramento → IF remover → **Despede** → IF pesquisa

### Software (software/index.html - page-agente)

- [ ] **PROMPT_PADRAO**
  - Adicionar seção "DESPEDIDA" com exemplos
  - Instruções de como se despedir gentilmente

### Banco de Dados (Supabase)

- [ ] **message_history table** (verificar se existe)
  - Precisa ter: `id, user_id, lead_id, numero_whatsapp, sender, conteudo, tokens_usados, criado_em`
  - Cada mensagem (lead + agent) precisa estar registrada

---

## 🔗 Dados que Vão Fluir

```
Lead manda msg
  ↓
Salva msg cliente (INSERT message_history)
  ↓
Extrai dados estruturados
  ↓
... processamento ...
  ↓
[IF encerramento = true]
  ↓
Remove de lista ativa (se habilitado)
  ↓
Despede gentilmente ← NOVO
  ├─ Busca msg_desqualificado ou default
  ├─ Envia despedida: "Obrigado! Até logo!"
  └─ Lead recebe: "Obrigado! Até logo!" no WhatsApp
  ↓
Envia pesquisa satisfação (se habilitado)
  ├─ "Como foi sua experiência? 1-5 ⭐"
  └─ Após resposta: registra feedback
  ↓
Monta notificacao de transferencia ← ATUALIZADO
  ├─ Query message_history (todas as msgs)
  ├─ Monta resumo: [Lead]: "..." [Agent]: "..." [Lead]: "..."
  └─ Envia pro supervisor: relatório COMPLETO
```

---

## 🧪 Teste Esperado

### Cenário: Lead não qualificado

1. ✅ Lead manda mensagem
2. ✅ Agent responde 3-4 vezes
3. ✅ Agent identifica: qualificado = false
4. ✅ **Agent manda despedida:** "Obrigado pelo contato! Até logo!"
5. ✅ Pesquisa de satisfação é enviada: "Como foi sua experiência?"
6. ✅ Supervisor recebe notificação com RESUMO COMPLETO:
   ```
   📋 LEAD NÃO QUALIFICADO
   [Lead]: "Oi, tive um acidente..."
   [Agent]: "Ótima pergunta! Sim, tem sim..."
   [Lead]: "Foi em janeiro..."
   [Agent]: "E quais foram seus prejuízos?"
   [Lead]: "Na verdade foi acidente de rua"
   [Agent]: "Ah entendi. Nesse caso..."
   ```

**Resultado:** Supervisor vê EXATAMENTE o que foi conversado! 🎯

---

## 📌 Arquivos a Modificar

1. **workflow-agente-sdr-v3.json**
   - Node "Monta notificacao de transferencia" → incluir msgHistory
   - Novo node "Despede gentilmente" → antes da pesquisa
   - Atualizar conexões

2. **software/index.html**
   - PROMPT_PADRAO → adicionar seção DESPEDIDA

3. **Documentação**
   - docs/FLUXO-V3-EXPLICADO.md → atualizar com nova despedida

