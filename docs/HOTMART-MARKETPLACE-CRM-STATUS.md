# Status: Hotmart Marketplace Integration + CRM Kanban UI

**Data:** 14 de Março de 2026

## ✅ Tarefas Completas

### Parte 1: Hotmart Marketplace Integration

#### 1.1 ✅ Migrations Supabase
- **20260307100000_add_addon_fields.sql** — Colunas em `assinaturas` (addon_objecao, agentes_extras, numeros_extras, usuarios_extras_limite)
- **20260307210000_addon_purchases_and_incrementar_rpc.sql** — Tabela `addon_purchases` + RPC `incrementar_addon`
- Ambas as migrations **já estão aplicadas** no projeto

#### 1.2 ✅ Edge Function `hotmart-webhook` Estendida
- Arquivo: `supabase/functions/hotmart-webhook/index.ts`
- **Funcionalidades implementadas:**
  - ✅ Mapa `ADDON_OFFERS` com todos os offer codes (tokens, objeção, agente, número, usuário)
  - ✅ Função `applyAddon()` — ativa addon para cliente existente
  - ✅ Função `removeAddon()` — cancela addon com segurança
  - ✅ Suporte a renovações recorrentes (distingue primeira compra vs renovação)
  - ✅ Integração com `assinaturas` table e RPC `incrementar_addon`
  - ✅ Histórico em `addon_purchases` table

**Offer Codes Mapeados:**
```
tokens_mini     → f623v6bt (5M, R$97)
tokens_medio    → z9f5y7h3 (10M, R$177)
tokens_grande   → yfbmox0t (20M, R$297)
tokens_max      → e23bospr (50M, R$597)
addon_objecao   → 8ivu9gbb (R$127/mês)
addon_agente    → cjszocj0 (R$197/mês)
addon_numero    → w17oc1q3 (R$97/mês)
addon_usuario   → vhne1box (R$57/mês)
```

#### 1.3 ✅ UI Marketplace (`software/index.html`)
- **Arquivo:** `software/index.html` (linhas 2950-3400)
- **Seções implementadas:**

**1. Tokens Extras** (linhas 3090-3145)
- 4 cards: Mini (5M), Médio (10M), Grande (20M), Max (50M)
- Botões com `onclick="showBuyModal('...')"` → redirecionam para Hotmart se HOTMART_LINKS configurado

**2. Agente IA — Objeção** (linhas 3150-3180)
- Card destacado em vermelho (#dc2626)
- Botão `onclick="showAddonModal('objecao')"`
- Badge "⭐ MAIS VENDIDO"

**3. Agentes de IA Extras** (linhas 3190-3210)
- Stepper quantitativo (-, +)
- Cálculo dinâmico de total
- Botão `onclick="showAddonModal('agente')"`

**4. Números WhatsApp Extras** (linhas 3220-3250)
- Stepper quantitativo
- Botão `onclick="showAddonModal('numero')"`

**5. Usuários Extras** (linhas 3260-3285)
- Stepper quantitativo
- Botão `onclick="showAddonModal('usuario')"`

**URLs Hotmart Configuradas:**
```javascript
const HOTMART_LINKS = {
  main_plan:     'https://pay.hotmart.com/A104782857U?off=xj0983i2',
  tokens_mini:   'https://pay.hotmart.com/V104801379S',
  tokens_medio:  'https://pay.hotmart.com/U104799604W',
  tokens_grande: 'https://pay.hotmart.com/W104801398L',
  tokens_max:    'https://pay.hotmart.com/U104801421X',
  addon_objecao: 'https://pay.hotmart.com/A104782857U?off=8ivu9gbb',
  addon_agente:  'https://pay.hotmart.com/A104782857U?off=cjszocj0',
  addon_numero:  'https://pay.hotmart.com/A104782857U?off=w17oc1q3',
  addon_usuario: 'https://pay.hotmart.com/A104782857U?off=vhne1box',
};
```

**Funções JS implementadas:**
- `showBuyModal(pacoteId)` (linha 8307) — Redireciona para checkout Hotmart
- `showAddonModal(tipo)` (linha 8249) — Redireciona para checkout Hotmart com quantidade
- `loadAddonStatus()` — Carrega status de addons do cliente (assinar se necessário)
- Botões fallback para solicitação manual via PIX se Hotmart não configurado

### Parte 2: CRM Kanban UI

#### 2.1 ✅ Página `page-crm` Completa
- Arquivo: `software/index.html` (linhas 2080-2250)

**Componentes implementados:**
1. Header com:
   - Título "🗂️ CRM — Pipeline de Leads"
   - Botão "Atualizar CRM"
   - Botão "Colunas" (gerenciar estágios)
   - Botão "➕ Novo Lead"

2. Funnel Navigation Tab:
   - "Todos" com contador global
   - Tabs por funil/fluxo (dinâmicos)
   - Botão "＋" para criar novo funil

3. Kanban Board:
   - 6 colunas padrão (customizáveis)
   - Drag-and-drop de cards (entre colunas)
   - Drag-and-drop de colunas (reordenação)
   - Cards com:
     - Nome do lead
     - Ícone de aniversário (🎂 hoje, 🎁 amanhã, 🎉 em breve)
     - Tese/Motivo (produto de interesse)
     - Assunto/Pendência
     - Chips (telefone, email, data aniversário)
     - Funil/Fluxo (se atribuído)
     - Indicador de tarefas (⚠️ atrasada, ⏰ hoje, 📅 amanhã, 📋 pendente, ✅ concluída)
     - Score badge
     - Botão "＋ tarefa"
     - Botão "🔀 mover para funil"
     - Tempo decorrido desde última atualização

#### 2.2 ✅ Estágios CRM Configurados
```javascript
const CRM_STAGES = [
  { id: 'novo_contato',    label: '🆕 Novo Contato',      color: '#f59e0b' },
  { id: 'em_atendimento',  label: '💬 Em Atendimento',    color: '#3b82f6' },
  { id: 'qualificado',     label: '✅ Qualificado',        color: '#16a34a' },
  { id: 'nao_qualificado', label: '❌ Não Qualificado',   color: '#dc2626' },
  { id: 'convertido',      label: '🎉 Convertido',         color: '#7c3aed' },
  { id: 'perdido',         label: '🚪 Perdido',            color: '#9ca3af' }
];
```

#### 2.3 ✅ Funções JS Implementadas

**Carregamento:**
- `loadCRM()` (linha 5042) — Carrega leads + estágios + fluxos
- `loadCRMFluxos()` (linha 5060) — Popula tabs de funil
- `loadCRMStages()` (linha 5718) — Carrega estágios (custom ou padrão)

**Renderização:**
- `renderKanban(leads)` (linha 5095) — Monta colunas + cards
- `renderCard(lead, stageColor)` (linha 5145) — Renderiza card individual
- Todas as informações visíveis conforme spec

**Drag & Drop:**
- `dragCard(event, el)` — Inicia drag de card
- `dropCard(event, dropZone)` — Drop em nova coluna
- `updateLeadStage(leadId, newStage)` — Persiste stage no Supabase
- Reordenação de colunas também suportada

**Modal Lead:**
- `openLeadModal(leadId)` — Abre modal com abas:
  - **Dados:** nome, celular, email, tese, assunto, data aniversário, stage, fluxo, resumo
  - **Tarefas:** lista com checkboxes, adicionar tarefa, atribuir para colega, data vencimento
  - **Notas:** textarea para anotações do lead
  - **Conversa:** histórico de mensagens (do message_history table)

- `saveLeadDetails()` — Salva mudanças em leads
- `addTarefa()` — Insere tarefa em lead_tarefas
- `toggleTarefa()` — Marca tarefa como concluída

**Tarefas Rápidas:**
- Quick Task Popup (mostrado ao clicar em card)
- Adicionar tarefa sem abrir modal completo

**Gerenciamento de Estágios:**
- `openStagesModal()` — Modal para editar estágios
- Renomear colunas (duplo clique)
- Reordenar (drag-and-drop)
- Trocar cores (dropdown)
- Criar nova coluna custom
- Deletar coluna

#### 2.4 ✅ CSS Kanban Completo
- `.crm-board` — Container flexbox com horizontal scroll
- `.crm-col` — Coluna com min-width, background, border-top colored
- `.crm-cards` — Drop zone para cards
- `.crm-card` — Card individual com border-left colored
- `.crm-card:active`, `.crm-card:hover` — Estados
- `.crm-card-*` — Componentes internos (name, tese, assunto, footer, tasks, etc.)
- `.crm-col.dragover`, `.crm-cards.dragover` — Estados durante drag-and-drop

---

## 🎯 Fluxo de Uso Completo

### 1. Cliente Novo Compra Addon
1. Cliente vai para **Faturamento** → **Marketplace**
2. Clica em "Adicionar" (tokens) ou "Ativar" (addon)
3. Se HOTMART_LINKS configurado → abre Hotmart em nova aba
4. Após compra → Hotmart envia webhook a `hotmart-webhook` edge function
5. Função detecta `offer.code` e chama `applyAddon()`
6. Addon ativado em até 5 minutos
7. Client side: após refresh, addon status atualiza

### 2. Lead Entra pelo WhatsApp
1. Bot envia mensagem, lê com agente
2. SDK cria lead automático em `leads` table via `auto_create_leads_trigger`
3. Lead aparece em CRM Kanban → coluna "🆕 Novo Contato"

### 3. Agente Responde / Qualifica
1. Lead se move para "💬 Em Atendimento" (manual ou automático via n8n)
2. Ao final, agente calcula `qualificado: true/false` (JSON na última msg)
3. n8n workflow processa:
   - Se qualificado → move para "✅ Qualificado" + cria relatório + envia notificação
   - Se não qualificado → move para "❌ Não Qualificado"

### 4. Gerente Atribui Tarefas
1. Abre lead no CRM modal
2. Tab "Tarefas" → "Adicionar Tarefa"
3. Define descrição, data vencimento, atribui para colega
4. Task aparece no card (indicador "📋" ou "⏰" conforme prazo)

### 5. Conversão/Encerramento
1. Lead finaliza (convertido ou perdido)
2. Move manualmente para "🎉 Convertido" ou "🚪 Perdido"
3. Sistema pode calcular score automático se scoring ativado

---

## 📋 Checklist de Verificação

### Marketplace
- [ ] HOTMART_LINKS configurados (verificar se apontam para produtos corretos)
- [ ] Botões "Adicionar" redirecionam para Hotmart
- [ ] Confirmar: webhook testa com PURCHASE_APPROVED (offer_code = 'tokens_medio')
- [ ] Tabela `addon_purchases` registra compras corretamente
- [ ] Assinar recebe + 10M tokens
- [ ] Confirmar: addon recorrente (agente, número, usuário) funciona em renovações

### CRM Kanban
- [ ] 6 estágios aparecem com cores corretas
- [ ] Cards movem entre colunas via drag-and-drop
- [ ] Stage persiste no Supabase após drop
- [ ] Modal abre ao clicar em card
- [ ] Tarefa pode ser adicionada e marcada como concluída
- [ ] Aniversário mostra emoji correto (🎂/🎁/🎉)
- [ ] Score badge exibe score corretamente
- [ ] Funil filtra leads quando tab é selecionado

---

## 🔗 Referências de Arquivo

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `supabase/migrations/20260307100000_add_addon_fields.sql` | — | Addon columns |
| `supabase/migrations/20260307210000_addon_purchases_and_incrementar_rpc.sql` | — | Purchases + RPC |
| `supabase/functions/hotmart-webhook/index.ts` | 1-598 | Webhook handler |
| `software/index.html` | 2950-3400 | Marketplace UI |
| `software/index.html` | 2080-2250 | CRM page |
| `software/index.html` | 5027-6200 | CRM JS (load, render, DnD) |
| `software/index.html` | 7959-7968 | HOTMART_LINKS config |
| `software/index.html` | 8249-8340 | showAddonModal / showBuyModal |

---

## ⚠️ Notas Importantes

1. **HOTMART_LINKS**: Deve estar preenchido. Se vazio, fallback pede solicitação manual via PIX
2. **RLS Policies**: Todos os inserts via webhook usam `service_role` (bypassa RLS). Safe.
3. **Addon Recorrentes**: Renovações (recurrence_number > 1) não incrementam agentes/números/usuários novamente (idempotente)
4. **Tokens**: Sempre somam, nunca expiram
5. **Drágables**: Cards e colunas são ambos draggable. Cuidado com event.stopPropagation()

---

**Status Final:** ✅ **100% COMPLETO**

Hotmart Marketplace + CRM Kanban estão prontos para testes.
