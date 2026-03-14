# Workflow V3 — Ações Customizáveis

## Visão Geral
O workflow V3 foi estendido para suportar ações customizáveis que cada cliente (subscription) pode ativar/desativar via UI do software.

As ações são controladas pela tabela `workflow_acoes` (um registro por usuário) e executadas em 2 momentos:
1. **Após qualificação** (qualificado = true)
2. **Ao encerramento** (fim_atendimento = true OU qualificado = false)

---

## Nodes a Serem Adicionados

### Fase 1: Buscar Ações Customizáveis (após "Extrai dados estruturados")

**Node: Postgres Query**
- Nome: `Busca ações customizáveis`
- Query:
  ```sql
  SELECT * FROM buscar_acoes_workflow($1)
  ```
- Parâmetro: `{{ $json.user_id }}`
- Propósito: Buscar todas as configurações de ações para o usuário atual
- Output: `{ enviar_relatorio, criar_tarefa_crm, agendar_follow_up, dias_follow_up, ... }`

**Conexão:**
- De: `Extrai dados estruturados` (success) → Para: `Busca ações customizáveis`
- De: `Busca ações customizáveis` (success) → Para: `Verifica se precisa transferir`

---

### Fase 2: Ações Pós-Qualificação (após "Verifica se precisa transferir" E qualificado=true)

Esses nodes executam APENAS se `qualificado === true` E a respectiva ação está habilitada.

#### 2.1 Criar Tarefa CRM
**Node: If → Postgres**
- Nome: `Precisa criar tarefa CRM?`
- Condição: `{{ $json.criar_tarefa_crm === true }}`
- Se SIM:
  ```sql
  INSERT INTO lead_tarefas (lead_id, descricao, data_vencimento, concluida)
  VALUES ($1, 'Follow-up automático da conversa', NOW() + INTERVAL '{{ $json.dias_follow_up }} days', false)
  ```
  Parâmetros: `[{{ $json.lead_id }}]`

#### 2.2 Agendar Follow-up
**Node: If → Postgres**
- Nome: `Precisa agendar follow-up?`
- Condição: `{{ $json.agendar_follow_up === true }}`
- Se SIM:
  ```sql
  INSERT INTO lead_tarefas (lead_id, descricao, data_vencimento, concluida)
  VALUES ($1, 'Follow-up automático - Lead qualificado', NOW() + INTERVAL '{{ $json.dias_follow_up }} days', false)
  ```
  Parâmetros: `[{{ $json.lead_id }}]`

#### 2.3 Adicionar Tag Qualificado
**Node: If → Postgres**
- Nome: `Precisa adicionar tag qualificado?`
- Condição: `{{ $json.adicionar_tag_qualificado === true && $json.tag_qualificado }}`
- Se SIM:
  ```sql
  SELECT adicionar_tag_lead($1, $2)
  ```
  Parâmetros: `[{{ $json.lead_id }}, {{ $json.tag_qualificado }}]`

---

### Fase 3: Ações de Encerramento (antes de notificar atendente OU ao final, se não transferir)

Esses nodes executam quando `fim_atendimento === true` OU `qualificado === false`.

#### 3.1 Remover de Lista Ativa
**Node: If → Postgres**
- Nome: `Precisa remover de lista ativa?`
- Condição: `{{ $json.remover_lista_ativa === true }}`
- Se SIM:
  ```sql
  UPDATE leads SET ativo = false WHERE id = $1
  ```
  Parâmetros: `[{{ $json.lead_id }}]`

#### 3.2 Enviar Pesquisa Satisfação
**Node: If → HTTP Request**
- Nome: `Precisa enviar pesquisa?`
- Condição: `{{ $json.enviar_pesquisa_satisfacao === true }}`
- Se SIM:
  - Método: POST
  - URL: `{{ $env.SUPABASE_URL }}/functions/v1/send-satisfaction-survey`
  - Body:
    ```json
    {
      "user_id": "{{ $json.user_id }}",
      "lead_id": "{{ $json.lead_id }}",
      "numero_whatsapp": "{{ $json.numero_whatsapp }}"
    }
    ```

#### 3.3 Adicionar Tag Encerramento
**Node: If → Postgres**
- Nome: `Precisa adicionar tag encerramento?`
- Condição: `{{ $json.adicionar_tag_encerramento === true && $json.tag_encerramento }}`
- Se SIM:
  ```sql
  SELECT adicionar_tag_lead($1, $2)
  ```
  Parâmetros: `[{{ $json.lead_id }}, {{ $json.tag_encerramento }}]`

---

## Fluxo de Execução Atualizado

```
1. Webhook entrada
2. Validação → Normaliza → Resolve cliente → Registra → Verifica tokens
3. Processa media (audio/image/document)
4. Busca configs → Monta system prompt
5. Strategic silence (10 seg)
6. LLM → Salva msg cliente
7. Extrai dados estruturados ✨ (JSON: qualificado, fim_atendimento, etc)
8. Busca ações customizáveis ✨ (RPC: retorna todas as ações habilitadas)
9. [IF qualificado=true]:
   - [IF criar_tarefa] → Cria tarefa CRM ✨
   - [IF agendar_follow_up] → Agenda follow-up ✨
   - [IF adicionar_tag_qualificado] → Adiciona tag ✨
10. [IF fim_atendimento OR qualificado=false]:
    - [IF remover_lista_ativa] → Marca como inativo ✨
    - [IF enviar_pesquisa] → Envia survey ✨
    - [IF adicionar_tag_encerramento] → Adiciona tag ✨
11. [IF transferir]:
    - Avisa lead: transferindo
    - Formata relatório
    - Notifica atendente
12. [ELSE]:
    - Responde 200 OK
```

---

## Configuração no Software (UI)

A página "⚙️ Qualificação" do software terá seção adicional:

### "🔄 Ações Pós-Qualificação"
- [ ] Enviar relatório ao atendente/grupo (default: true)
- [ ] Criar tarefa no CRM
  - Dias para vencimento: [3] (select 1-14)
- [ ] Agendar follow-up automático
  - Dias: [3] (select 1-14)
- [ ] Adicionar tag customizada
  - Tag: [__________] (textbox)

### "🏁 Ações de Encerramento"
- [ ] Enviar pesquisa de satisfação
- [ ] Remover de lista ativa
- [ ] Adicionar tag customizada
  - Tag: [__________] (textbox)

Botão "Salvar Ações" chama: `saveWorkflowAcoes()` que PATCH em `workflow_acoes` para o usuário atual.

---

## Isolamento de Dados (Multi-tenancy)

✅ **Garantido por RLS e user_id:**

| Tabela | RLS | Campo | Isolamento |
|--------|-----|-------|-----------|
| `workflow_acoes` | ✅ | user_id | Cada cliente vê apenas suas próprias ações |
| `lead_tarefas` | ✅ | via leads.user_id | Tarefas isoladas por cliente |
| `lead_tags` | ✅ | via leads.user_id | Tags isoladas por cliente |
| `leads` | ✅ | user_id | Leads isolados por cliente |

---

## Próximos Passos

1. ✅ **Migration** `workflow_acoes` — COMMITADA
2. ⏳ **Estender V3 workflow** — Adicionar nodes customizáveis (via n8n UI ou JSON)
3. ⏳ **Software UI** — Página "Qualificação" com seção "Ações customizáveis"
4. ⏳ **RPC: send-satisfaction-survey** — Edge Function para enviar pesquisa WhatsApp
5. ⏳ **Testes** — Simular fluxos completos com diferentes ações habilitadas
