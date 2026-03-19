# Próximos Passos — Relatório Completo + Despedida + Ações Customizáveis

## 📋 Resumo do que foi feito

✅ **Semana anterior:**
- Migration `workflow_acoes` (ações customizáveis)
- V3 com 69 nodes (54 → +15 nodes de ações)
- Documentação completa (isolamento, fluxo explicado)

✅ **Esta sessão:**
- Documento "MUDANCAS-RELATORIO-DESPEDIDA.md" com especificações exatas

---

## 🎯 PRÓXIMAS IMPLEMENTAÇÕES (ordem de prioridade)

### 1️⃣ **IMEDIATO** — Atualizar V3 Workflow

#### 1.1 Node: "Monta notificacao de transferencia" (modificar)

**O que fazer:** Incluir RESUMO COMPLETO da conversa

```javascript
// Antes (atual): relatório com apenas nome, celular, motivo
// Depois: relatório com histórico COMPLETO

const msgHistory = $('Salva msg cliente').first().json?.message_history || [];
const resumoConversa = msgHistory
  .map(msg => {
    const sender = msg.sender === 'user' ? 'Lead' : 'Agent';
    return `[${sender}]: "${msg.conteudo}"`;
  })
  .join('\n\n');

// Incluir resumoConversa no relatório final
```

**Resultado esperado:**
```
📋 LEAD NÃO QUALIFICADO
Nome: João da Silva
[Lead]: "Oi, tive um acidente..."
[Agent]: "Ótima pergunta! Sim..."
[Lead]: "Na verdade foi acidente de rua"
[Agent]: "Ah entendi..."
```

**Arquivo:** `workflow-agente-sdr-v3.json`  
**Node:** "Monta notificacao de transferencia"  
**Esforço:** ⭐⭐ (médio)

---

#### 1.2 Novo Node: "Despede gentilmente" (adicionar)

**O que fazer:** Criar novo node que envia despedida ANTES da pesquisa

```javascript
// Novo node Code
const despedida = cmap.msg_desqualificado || 'Obrigado pelo contato! Até logo!';
// Enviar via WhatsApp antes da pesquisa
```

**Posição no fluxo:**
```
IF encerramento?
  ├─ IF remover_ativo → Remove de lista ativa
  ├─ 🆕 Despede gentilmente ← NOVO AQUI
  │   └─ Envia: "Obrigado! Até logo!"
  ├─ IF pesquisa → Envia pesquisa satisfação
  └─ IF tag → Adiciona tag encerramento
```

**Arquivo:** `workflow-agente-sdr-v3.json`  
**Tipo:** Code node  
**Esforço:** ⭐⭐ (médio)

---

### 2️⃣ **CURTO PRAZO** — Atualizar Software UI

#### 2.1 Page "🤖 Agente & Prompt" — Adicionar seção DESPEDIDA

**Adicionar ao PROMPT_PADRAO:**

```
## DESPEDIDA E FECHAMENTO

Ao final do atendimento:
1. Se QUALIFICADO: envie msg_qualificado
2. Se DESQUALIFICADO: se despça gentilmente
   - Exemplos: "Obrigado pelo contato! Até logo!"
   - Breve, amigável, profissional

A despedida é enviada ANTES da pesquisa de satisfação.
A pesquisa é enviada automaticamente pelo sistema.
```

**Arquivo:** `software/index.html`  
**Elemento:** `#cfg-prompt_sistema` textarea  
**Esforço:** ⭐ (fácil)

---

#### 2.2 Page "✅ Qualificação" — Adicionar seção "Ações Customizáveis"

**Adicionar controles na página:**

```html
<div class="section">
  <h3>🔄 Ações Pós-Qualificação</h3>
  <label>
    <input type="checkbox" id="cfg-criar_tarefa_crm" />
    Criar tarefa no CRM
    <input type="number" id="cfg-dias_follow_up" min="1" max="14" value="3" />
    dias para vencimento
  </label>
  <label>
    <input type="checkbox" id="cfg-agendar_follow_up" />
    Agendar follow-up automático
    <input type="number" id="cfg-dias_follow_up_2" min="1" max="14" value="5" />
    dias
  </label>
  <label>
    <input type="checkbox" id="cfg-adicionar_tag_qualificado" />
    Adicionar tag: <input type="text" id="cfg-tag_qualificado" />
  </label>
</div>

<div class="section">
  <h3>🏁 Ações de Encerramento</h3>
  <label>
    <input type="checkbox" id="cfg-enviar_pesquisa_satisfacao" />
    Enviar pesquisa de satisfação
  </label>
  <label>
    <input type="checkbox" id="cfg-remover_lista_ativa" />
    Remover de lista ativa
  </label>
  <label>
    <input type="checkbox" id="cfg-adicionar_tag_encerramento" />
    Adicionar tag: <input type="text" id="cfg-tag_encerramento" />
  </label>
</div>

<button onclick="saveWorkflowAcoes()">💾 Salvar Ações</button>
```

**Função JS:**
```javascript
async function saveWorkflowAcoes() {
  const acoes = {
    criar_tarefa_crm: document.getElementById('cfg-criar_tarefa_crm').checked,
    dias_follow_up: parseInt(document.getElementById('cfg-dias_follow_up').value),
    // ... resto dos campos
  };
  
  // PATCH em /supabase/workflow_acoes
  await supabase
    .from('workflow_acoes')
    .upsert([{ user_id: currentUser.id, ...acoes }])
    .select();
    
  showNotification('✅ Ações salvas!');
}
```

**Arquivo:** `software/index.html`  
**Página:** `#page-qualificacao`  
**Esforço:** ⭐⭐⭐ (complexo, muitos campos)

---

### 3️⃣ **MÉDIO PRAZO** — Testes End-to-End

**Teste 1: Relatório Completo**
- [ ] Simular lead desqualificado
- [ ] Verificar que relatório inclui TODA conversa
- [ ] Não apenas "2 palavras"

**Teste 2: Despedida Antes de Pesquisa**
- [ ] Lead recebe despedida: "Obrigado! Até logo!"
- [ ] Depois pesquisa: "Como foi sua experiência?"
- [ ] Não ao contrário

**Teste 3: Ações Customizáveis**
- [ ] Cliente marca "Criar tarefa CRM"
- [ ] Lead é qualificado
- [ ] Tarefa é criada automaticamente em 3 dias
- [ ] Aparece em page-crm

**Teste 4: Multi-IA**
- [ ] Teste com OpenAI
- [ ] Teste com Claude
- [ ] Teste com Gemini
- [ ] Todos retornam JSON estruturado correto

---

## 📊 Comparação: ANTES vs. DEPOIS

### ANTES (Atual)
```
[Supervisor recebe...]
📋 LEAD NÃO QUALIFICADO
Nome: João da Silva
Celular: 11988776655
Motivo: Acidente de trabalho
Motivo Transferência: Não qualificado: Fora do escopo

[Mensagens para Lead]
1️⃣ Lead: "Oi, tive um acidente..."
2️⃣ Agent: "Ótima pergunta! Sim, tem sim..."
[...3 mais...]
Nº8: Agent: "Ah entendi. Nesse caso..."

[Pesquisa de satisfação]
"Como foi sua experiência? ⭐"
```

❌ **Problema:** Supervisor lê relatório sem contexto, não vê conversa

---

### DEPOIS (Nova)
```
[Supervisor recebe...]
📋 LEAD NÃO QUALIFICADO
Nome: João da Silva
Celular: 11988776655
Motivo: Acidente de trabalho

📝 RESUMO DA CONVERSA:
[Lead]: "Oi, tive um acidente de trabalho e não recebi o seguro desemprego..."
[Agent]: "Ótima pergunta! Sim, tem sim! Você pode entrar com ação de indenização..."
[Lead]: "Foi em janeiro de 2024. Sim, era registrado."
[Agent]: "Ótimo! E quais foram seus prejuízos..."
[Lead]: "Na verdade, foi um acidente de rua, não de trabalho"
[Agent]: "Ah entendi. Nesse caso, você teria que entrar com ação contra o causador..."

[Fluxo para o Lead]
1️⃣ Agent responde com contexto
2️⃣ Agent se despeça: "Obrigado pelo contato! Até logo!"
3️⃣ Pesquisa: "Como foi sua experiência? ⭐"
4️⃣ CRM: Lead marcado como "Sem Potencial" + inativo
```

✅ **Benefício:** Supervisor vê EXATAMENTE o que foi conversado, contexto completo!

---

## 🔗 Fluxo Final (com todas as mudanças)

```
Lead manda msg WhatsApp
  ↓
✅ Tem tokens?
  ├─ NÃO → Saldo insuficiente
  └─ SIM:
     ↓
  Processa media (áudio/imagem/doc)
     ↓
  Busca base de conhecimento
     ↓
  Monta prompt (objetivo + tonalidade + criterios)
     ↓
  Silêncio estratégico (10s)
     ↓
  GPT/Claude/Gemini responde
     ↓
  Salva msg cliente (INSERT message_history)
     ↓
  Envia resposta pro lead
     ↓
  Extrai dados estruturados
     ↓
  Busca ações customizáveis
     ↓
[IF qualificado = true]
  ├─ [IF criar_tarefa] → Cria tarefa CRM
  ├─ [IF agendar] → Agenda follow-up
  └─ [IF tag] → Adiciona tag
     ↓
[IF encerramento]
  ├─ [IF remover_ativo] → Marca inativo
  ├─ 🆕 Despede gentilmente → Envia "Até logo!" ← NOVO
  ├─ [IF pesquisa] → Envia pesquisa ⭐ 
  └─ [IF tag] → Adiciona tag encerramento
     ↓
[IF transferir]
  ├─ 🆕 Inclui RESUMO COMPLETO da conversa ← NOVO
  ├─ Envia relatório ao supervisor
  └─ Supervisor vê: NOME + CELULAR + CONVERSA INTEIRA
     ↓
FIM
```

---

## 📌 Checklist Final

### Migration + DB ✅
- ✅ workflow_acoes table
- ✅ lead_tags table
- ✅ RPCs criadas
- ✅ RLS policies aplicadas

### Workflow V3 ✅ (parcial)
- ✅ 15 nodes de ações customizáveis adicionados
- ⏳ Node "Monta notificacao" → incluir msgHistory
- ⏳ Node "Despede gentilmente" → criar e conectar

### Software UI ⏳
- ⏳ Page agente → instruções de despedida no prompt
- ⏳ Page qualificação → seção ações customizáveis + save function
- ⏳ Verificar que msg_desqualificado é usado como despedida

### Testes ⏳
- ⏳ Teste relatório completo
- ⏳ Teste despedida antes pesquisa
- ⏳ Teste ações customizáveis
- ⏳ Teste com 3 IAs diferentes

---

## 🚀 Próximo Comando?

**Qual é o primeiro passo?**

a) Atualizar V3 workflow (incluir msgHistory + novo node despedida)  
b) Implementar UI "Ações Customizáveis" no software  
c) Rodar testes end-to-end  

Qual você prefere? 🎯
