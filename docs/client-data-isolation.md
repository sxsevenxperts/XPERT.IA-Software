# Client Data Isolation (Multi-Tenancy)

## Princípio Fundamental
✅ **Cada cliente (subscription) começa do ZERO**
- Sem prompts customizados
- Sem base de conhecimento
- Sem workflows criados
- Sem configurações
- Deve criar tudo manualmente via UI

---

## Tabelas e Isolamento

### 1. Tabelas com isolamento por `user_id`

| Tabela | Chave | Isolamento | Descrição |
|--------|-------|-----------|-----------|
| `agente_config` | user_id | ✅ RLS | Configs customizadas do SDR (prompt, objetivo, tonalidade, etc) |
| `documentos_conhecimento` | user_id | ✅ RLS | Base de conhecimento (PDFs) do cliente |
| `links_prioritarios_web` | user_id | ✅ RLS | Links web que o LLM deve usar como fonte |
| `leads` | user_id | ✅ RLS | Todos os leads do cliente |
| `lead_tarefas` | via leads.user_id | ✅ RLS | Tarefas de cada lead |
| `lead_tags` | via leads.user_id | ✅ RLS | Tags dinâmicas em leads |
| `lead_objections` | via leads.user_id | ✅ RLS | Histórico de objeções detectadas |
| `message_history` | user_id | ✅ RLS | Histórico de mensagens WhatsApp |
| `workflow_acoes` | user_id | ✅ RLS | Configurações customizáveis do workflow (novo cliente: defaults) |
| `agentes` | user_id | ✅ RLS | Instâncias de agentes/equipas do cliente |
| `assinaturas` | user_id | ✅ RLS | Dados da subscription (plano, addons, tokens) |

### 2. RLS Policies Padrão

Cada tabela com `user_id` tem estas policies:

```sql
-- Usuários veem apenas seus próprios dados
CREATE POLICY "users_own_data"
  ON <table>
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins veem tudo
CREATE POLICY "admin_access"
  ON <table>
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Novo Cliente: Fluxo de Setup

### 1. Autenticação
- Email + Password (ou SSO)
- Cria `auth.user` automaticamente
- Trigger `handle_new_user()` executa:
  - INSERT `profiles` (role='user')
  - INSERT `assinaturas` (plano inicial, 0 tokens, status='ativo')
  - INSERT `workflow_acoes` (todas as ações com defaults = false, exceto enviar_relatorio=true)
  - Trigger `criar_workflow_acoes_padrao()`

### 2. Cliente Acessa Software
- UI carrega vazio (sem prompts, sem base, sem leads)
- Dashboard mostra:
  - "0 leads"
  - "0 documentos de conhecimento"
  - "0 workflows criados"
- Menu permite criar tudo

### 3. Cliente Cria Configurações (UI → software/index.html)

#### 3.1 Configurar Agente (page-agente)
- Objetivo: "Qual é o objetivo do seu SDR?"
- System Prompt: Editor de texto com PROMPT_PADRAO como fallback
- Salva em `agente_config` com chaves: `objetivo`, `prompt_sistema`
- user_id = auth.uid() automaticamente (RLS)

#### 3.2 Configurar Comunicação (page-comunicacao)
- Tonalidade: "Como o agente deve falar?"
- Instruções de comunicação: Regras de comunicação
- Mensagens de qualificado/desqualificado: Templates
- Responder em áudio: Toggle
- Salva em `agente_config` com chaves: `tonalidade`, `instrucoes_comunicacao`, `msg_qualificado`, `msg_desqualificado`, `responder_em_audio`

#### 3.3 Configurar Qualificação (page-qualificacao)
- Critérios de Qualificação: Textarea com 1 critério por linha
- Destino Notificações: Radio (número/grupo/ambos)
- Número WhatsApp: Input
- Grupo WhatsApp: Input (opcional)
- Salva em `agente_config` com chaves: `criterios_qualificacao`, `numero_destino`, `grupo_destino`
- **NOVO**: Ações Pós-Qualificação + Pós-Encerramento
  - Toggle cada ação
  - Parâmetros (dias_follow_up, tags, etc)
  - Salva em `workflow_acoes`

#### 3.4 Carregar Base de Conhecimento (page-conhecimento)
- Upload de PDFs: Cria `documentos_conhecimento` com user_id
- RPC `process-pdf` (Edge Function) extrai texto + indexa FTS
- cliente vê lista de docs, pode remover

#### 3.5 Configurar Web Links Prioritários (page-links)
- Input: URL + label
- Salva em `links_prioritarios_web` com user_id
- Workflow LLM busca esses links como fonte confiável
- Cliente pode adicionar/remover à vontade

#### 3.6 Criar Workflows Customizados (page-workflows / Designer de Fluxos) ⏳ FUTURO
- Drawflow visual builder
- Mostra base V3 como template
- Cliente ativa/desativa ações customizáveis
- Salva em BD (nova tabela `custom_workflows`)

---

## Garantias de Isolamento

### A. Nível Banco de Dados (Postgres RLS)
- ✅ Cada query com `user_id = auth.uid()` built-in
- ✅ Sem filtro user_id? → RLS bloqueia e retorna vazio
- ✅ Admin pode ver tudo com policy `admin_access`

### B. Nível Application (Software)
- ✅ Auth.uid() obtido do JWT do Supabase
- ✅ API calls incluem JWT em Authorization header
- ✅ Supabase executa RLS ANTES de retornar dados
- ✅ Logs mostram user_id de cada operação

### C. Nível Workflow (n8n V3)
- ✅ Webhook recebe `user_id` do JSON (atribuído durante "Resolve cliente")
- ✅ Queries postgres incluem parametrizado: `WHERE user_id = $1` → `[{{ $json.user_id }}]`
- ✅ LLM prompt busca KB com: `buscar_conhecimento(p_user_id, query, 5)`
- ✅ Links prioritários filtrados: `SELECT * FROM links_prioritarios_web WHERE user_id = $1`

---

## Cenários de Teste de Isolamento

### Teste 1: Cliente A não vê dados de Cliente B
```
Cliente A login → vê 10 leads dele
Cliente B login → vê 0 leads (próprios vazios)
Cliente A tenta SQL injection: ?filters=user_id=xxxxx → RLS bloqueia
```
**Resultado esperado:** ✅ Isolado

### Teste 2: Nova subscription começa vazia
```
Novo usuário criado → profiles INSERT + assinaturas INSERT + workflow_acoes INSERT
Acessa software → "0 leads, 0 docs, 0 workflows"
Upload PDF → INSERT documentos_conhecimento (user_id = seu id)
Cliente B não vê o PDF
```
**Resultado esperado:** ✅ Isolado

### Teste 3: Prompt não é compartilhado
```
Cliente A salva prompt: "Você é especialista em direito previdenciário"
Salva em agente_config: user_id=A, chave=prompt_sistema, valor="..."
Cliente B tenta buscar prompt_sistema → RLS retorna vazio
Cliente B cria seu próprio prompt
```
**Resultado esperado:** ✅ Isolado

### Teste 4: Workflow executa com dados corretos
```
Lead envia msg → Webhook recebe lead.user_id=A
V3 busca agente_config WHERE user_id=$1 (A) → obtém prompt_A
V3 busca documentos_conhecimento WHERE user_id=$1 (A) → obtém docs_A
LLM responde com dados de A, não mistura com B
```
**Resultado esperado:** ✅ Isolado

---

## Checklist: Garantias Implementadas

- ✅ **RLS Policies**: Todas as tabelas client-facing têm `user_id = auth.uid()`
- ✅ **Triggers auto-create**: Novo user → auto-create profiles, assinaturas, workflow_acoes
- ✅ **JWT Validation**: Supabase autenticação obrigatória em todas as APIs
- ✅ **Parametrized Queries**: Workflow V3 usa `$1`, `$2` com params array (não string interpolation)
- ✅ **Edge Functions**: Auth via JWT, mesmo RLS aplicado
- ✅ **RPC Queries**: `buscar_conhecimento()`, `buscar_acoes_workflow()`, etc têm `WHERE user_id = p_user_id`
- ✅ **Admin Override**: Admins podem ver/gerenciar dados de clientes (com audit)
- ✅ **Soft Delete**: Deleted at timestamps para auditoria, não hard deletes
- ✅ **Audit Logs**: Todos inserts/updates/deletes registrados com user_id, timestamp, tipo operação

---

## Dados que NÃO são isolados (Sistema-wide)

| Tabela | Motivo | Exemplo |
|--------|--------|---------|
| `profiles` | Admin precisa ver todos os users | Painel administrativo |
| `assinaturas` | Cobrança/billing centralizado | Relatório faturamento |
| `n8n_workflows` | Workflows templates podem ser compartilhados | Base V3 shared |
| `audit_logs` | Compliance/segurança centralizado | Trace histórico global |

---

## Documentação Relacionada

- [workflow-agente-sdr-v3.md](./agent-prompt-v3.md) — Prompts dinâmicos por cliente
- [workflow-v3-customizable-actions.md](./workflow-v3-customizable-actions.md) — Ações customizáveis por cliente
- Código: `/software/index.html` — loadConfigs(), saveConfigs(), RLS checks client-side
