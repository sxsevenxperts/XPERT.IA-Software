# ✅ Checklist de Implantação - Fase 1

## 🎯 Objetivo
Ativar o sistema de monitoramento completo em 1 hora.

---

## ⏱️ Passo 1: Supabase SQL (5 minutos)

### Opção A: Manual via Dashboard (Recomendado para primeira vez)

1. **Abrir Supabase Dashboard:**
   ```
   https://app.supabase.com/project/vyvdrbkcrvklcaombjqu
   ```

2. **Ir para SQL Editor:**
   - Left Sidebar → **SQL Editor**
   - Click em **New Query**

3. **Copiar arquivo SQL:**
   ```bash
   # No seu terminal:
   cat supabase/xpertia-monitoring.sql
   ```

4. **Colar no editor Supabase:**
   - Selecionar todo código (Ctrl+A)
   - Colar (Ctrl+V)

5. **Executar:**
   - Click em **Run** (ou Ctrl+Enter)
   - Aguardar 2-3 segundos

6. **Verificar resultado:**
   ```
   ✅ Tables created successfully
   ✅ Indexes created
   ✅ Policies applied
   ```

### Opção B: Automatizado via CLI

```bash
# Se tiver Supabase CLI instalado:
supabase db push

# Ou executar via psql:
psql "postgresql://postgres:PASSWORD@db.vyvdrbkcrvklcaombjqu.supabase.co:5432/postgres" \
  -f supabase/xpertia-monitoring.sql
```

### Verificação Pós-Execução

No SQL Editor, copiar e executar:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workflow_executions', 'workflow_errors', 'lead_feedback')
ORDER BY table_name;

-- Resultado esperado: 3 linhas
-- lead_feedback
-- workflow_errors
-- workflow_executions
```

---

## 🔄 Passo 2: Configurar Workflow N8N (15-30 minutos)

### 2.1: Adicionar Node HTTP Request

1. **Abrir workflow:** `workflow-agente-sdr-v2.json` no N8N Editor

2. **Encontrar nó LLM:**
   - Procurar por: "node-llm-openai" ou similar
   - Este é o nó que chama a API de IA

3. **Adicionar novo nó após LLM:**
   - Click em **"+"** (Add Node)
   - Procurar: "HTTP Request"
   - Selecionar

4. **Configurar nó HTTP:**

   **Nome:** `node-log-execution`

   **Method:** POST

   **URL:**
   ```
   https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/log-workflow-execution
   ```

   **Headers Tab:**
   ```
   Authorization: Bearer {{ $env.SUPABASE_JWT_TOKEN }}
   Content-Type: application/json
   ```

   **Body Tab (JSON):**
   ```json
   {
     "user_id": "{{ $json.user_id }}",
     "lead_id": "{{ $json.lead_id }}",
     "agent_type": "{{ $json.agent_type || 'principal' }}",
     "duracao_ms": {{ $now - ($json._start_time || 0) }},
     "status": "sucesso",
     "tokens_input": {{ $json.tokens?.input || 0 }},
     "tokens_output": {{ $json.tokens?.output || 0 }},
     "modelo_usado": "{{ $json.model_used || 'gpt-4o-mini' }}",
     "resposta_gerada": "{{ $json.response }}",
     "numero_whatsapp": "{{ $json.numero_whatsapp }}"
   }
   ```

5. **Configurar Tratamento de Erro:**
   - Click em **"Continue on Error"** ✅
   - (Assim workflow não para se logging falhar)

### 2.2: Adicionar Timestamp de Início

Antes do nó LLM, adicionar nó "Set":

```
Name: node-set-start-time
```

Adicionar valor:
```
_start_time = {{ Date.now() }}
```

### 2.3: Variáveis de Ambiente N8N

1. **Ir para:** N8N Dashboard → **Settings** → **Environment Variables**

2. **Adicionar:**
   ```
   SUPABASE_JWT_TOKEN = <seu-token-aqui>
   ```

   Para obter token:
   - Supabase Dashboard → **SQL Editor** → **Execution Logs**
   - Ou usar um token service role (vide Documentação)

---

## 🧪 Passo 3: Teste End-to-End (10 minutos)

### 3.1: Executar Teste no N8N

1. **Abrir workflow no N8N**

2. **Click em "Test Workflow"** ou **"Execute"**

3. **Fornecer dados de teste:**
   ```json
   {
     "user_id": "seu-uuid-aqui",
     "lead_id": "lead-uuid",
     "agent_type": "principal",
     "tokens": { "input": 150, "output": 200 },
     "model_used": "gpt-4o-mini",
     "response": "Olá! Como posso ajudar?",
     "numero_whatsapp": "+5511999999999"
   }
   ```

4. **Verificar execução:**
   - ✅ Sem erros no N8N
   - ✅ Status 200 da HTTP Request

### 3.2: Verificar Dados no Supabase

1. **Supabase Dashboard → Table Editor**

2. **Selecionar tabela:** `workflow_executions`

3. **Verificar dados:**
   - Deve aparecer 1 nova linha
   - user_id, lead_id, tokens, duration preenchidos

### 3.3: Verificar Dashboard de Monitoramento

1. **XPERT.IA Software:** Sidebar → **Resultados** → **Monitoramento**

2. **Verificar:**
   - ✅ Metric card mostra: "1 execução"
   - ✅ Gráfico exibe ponto
   - ✅ Tabela recente mostra execução

---

## ⚠️ Troubleshooting

### Problema: "401 Unauthorized" no HTTP Request

**Solução:**
- Verificar `SUPABASE_JWT_TOKEN` em N8N Environment Variables
- Regenerar token no Supabase Dashboard
- Usar token com permissão `INSERT` na tabela

### Problema: Nenhum dado aparece no Supabase

**Solução:**
- Verificar URL do HTTP Request (copiar exatamente)
- Verificar Headers: `Authorization` deve começar com "Bearer"
- Verificar N8N execution logs para erro

### Problema: Dashboard mostra "Carregando..."

**Solução:**
- Aguardar 10 segundos (dados podem estar em cache)
- Refresh página (F5)
- Verificar browser console (F12) para erros JavaScript
- Verificar RLS policies no Supabase

---

## 📝 Checklist Final

- [ ] SQL executado no Supabase com sucesso
- [ ] Tabelas aparecem em Table Editor
- [ ] Node HTTP Request adicionado ao workflow
- [ ] SUPABASE_JWT_TOKEN configurado em N8N
- [ ] Workflow testado com dados de teste
- [ ] Dados aparecem em workflow_executions
- [ ] Dashboard mostra métrica de execução
- [ ] Modal de feedback aparece ao mover lead para "convertido/perdido"

---

## 🎉 Próximos Passos Após Validação

1. **Executar com leads reais** (não de teste)
2. **Monitorar dashboard** durante 24 horas
3. **Validar precisão** de tokens e custo
4. **Implementar Fase 2** (Analytics de Win Rate)

---

**Status:** 🟢 Pronto para implantação
**Tempo Total:** ~1 hora
**Data:** 2026-03-19
