# 📊 XPERT.IA Monitoring — Setup & Deployment Guide

## Overview

The monitoring system tracks workflow executions, performance metrics, tokens usage, and costs. It consists of:

1. **Database Tables** (Supabase PostgreSQL)
   - `workflow_executions` — Tracks each AI agent execution
   - `workflow_errors` — Logs errors with details
   - `lead_feedback` — Collects closed-loop feedback from leads

2. **Edge Functions** (Deno)
   - `log-workflow-execution` — Receives logs from N8N, stores in database

3. **Frontend Dashboard** (Web UI)
   - Real-time performance metrics
   - Charts (executions, error rates, token usage)
   - Filterable execution history
   - Lead feedback collection modal

---

## Phase 1: Deploy Database Tables

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select project: **XPERT.IA** (`vyvdrbkcrvklcaombjqu`)
3. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Create New Query

1. Click **"New Query"** (top right)
2. Name it: `monitoring-setup` (optional)

### Step 3: Copy & Execute SQL

1. Open file: `supabase/xpertia-monitoring.sql` in this project
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter`)

**Expected Output:**
```
✅ Tables created: workflow_executions, workflow_errors, lead_feedback
✅ Indexes created for performance
✅ RLS policies enabled
✅ Views created for analytics
```

If you see errors about existing tables/indexes, that's OK — they have `IF NOT EXISTS` clauses.

### Step 4: Verify Tables

Run this query in SQL Editor to confirm:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('workflow_executions', 'workflow_errors', 'lead_feedback')
ORDER BY table_name;
```

Should return 3 rows.

---

## Phase 2: Enable Edge Function

### Deploy log-workflow-execution Function

```bash
# From project root:
supabase functions deploy log-workflow-execution
```

Or manually:

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **"Create a new function"**
3. Name: `log-workflow-execution`
4. Copy code from: `supabase/functions/log-workflow-execution/index.ts`
5. Deploy

**Test the function:**

```bash
curl -X POST https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/log-workflow-execution \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "agent_type": "principal",
    "duracao_ms": 2500,
    "status": "sucesso",
    "tokens_input": 150,
    "tokens_output": 200,
    "modelo_usado": "gpt-4o-mini"
  }'
```

Expected response:
```json
{
  "success": true,
  "execution_id": "...",
  "stats": {
    "tokens_total": 350,
    "custo_usd": 0.00525,
    "duracao_ms": 2500
  }
}
```

---

## Phase 3: Update N8N Workflow

### Add Logging Node to Workflow

In **workflow-agente-sdr-v2.json**, after the LLM response node:

1. Add new node: **HTTP Request**
   - Name: `node-log-execution`
   - Method: `POST`
   - URL: `https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/log-workflow-execution`

2. Headers:
   ```
   Authorization: Bearer {{ $secret.SUPABASE_JWT_TOKEN }}
   Content-Type: application/json
   ```

3. Body (JSON):
   ```json
   {
     "user_id": "{{ $json.user_id }}",
     "lead_id": "{{ $json.lead_id }}",
     "agent_type": "{{ $json.agent_type }}",
     "duracao_ms": "{{ $json.execution_time_ms }}",
     "status": "sucesso",
     "tokens_input": "{{ $json.tokens.input }}",
     "tokens_output": "{{ $json.tokens.output }}",
     "modelo_usado": "{{ $json.model }}",
     "resposta_gerada": "{{ $json.response }}",
     "numero_whatsapp": "{{ $json.numero_whatsapp }}"
   }
   ```

4. Add error handler to log failures:
   - On error: Don't stop workflow
   - Log error separately

5. Activate the node

**Test the workflow:**
- Execute a test lead through the workflow
- Go to Supabase Dashboard → **Table Editor**
- Open `workflow_executions` table
- Verify new record appears with correct data

---

## Phase 4: Access Monitoring Dashboard

### For Regular Users (SDR Agents)

1. Login to XPERT.IA Software
2. Sidebar → **Resultados** → **Monitoramento** ✨
3. See dashboard with:
   - Execution count (last 24h)
   - Success rate
   - Tokens used & cost
   - Average duration
   - Charts by agent type
   - Recent execution table

### For Admins

1. Login as admin
2. Sidebar → **Super Admin** → **Dashboard** (financial health)
3. View subscription metrics

---

## Troubleshooting

### Issue: No data appearing in dashboard

**Cause:** Workflow hasn't logged executions yet

**Fix:**
1. Execute test lead through workflow
2. Verify function deployed correctly: Go to Edge Functions → Logs
3. Check RLS policies allow insertion: SQL Editor → query:
   ```sql
   SELECT * FROM workflow_executions LIMIT 1;
   ```

### Issue: JWT authentication error on function

**Cause:** Service role key or token invalid

**Fix:**
1. Regenerate JWT from Supabase dashboard
2. Update N8N workflow headers
3. Test with curl command above

### Issue: Charts not rendering

**Cause:** Chart.js library not loaded

**Fix:**
- Already included in `software/index.html` (line 8)
- Verify browser console has no errors: F12 → Console
- Refresh page: `Ctrl+F5`

---

## Database Schema

### workflow_executions

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Client/SDR user |
| lead_id | UUID | Lead being processed |
| agent_type | TEXT | 'principal', 'objecao', 'extra' |
| duracao_ms | INT | Execution time in milliseconds |
| timestamp_inicio | TIMESTAMPTZ | When execution started |
| timestamp_fim | TIMESTAMPTZ | When execution ended |
| status | TEXT | 'sucesso', 'erro', 'timeout', 'pendente' |
| tokens_input | INT | Input tokens used |
| tokens_output | INT | Output tokens used |
| tokens_total | INT | Sum of input + output |
| custo_usd | DECIMAL | Calculated cost |
| modelo_usado | TEXT | 'gpt-4', 'claude-opus', 'gemini', etc |
| resposta_gerada | TEXT | AI response (stored for analysis) |
| erro_mensagem | TEXT | Error details if status='erro' |

### workflow_errors

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Client/SDR user |
| execution_id | UUID | FK to workflow_executions |
| tipo_erro | TEXT | 'api_error', 'timeout', 'validation', 'n8n_error' |
| mensagem | TEXT | Error message |
| stack_trace | TEXT | Full error stack (if available) |
| criado_em | TIMESTAMPTZ | When error occurred |
| resolvido | BOOLEAN | Has this error been addressed? |

### lead_feedback

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Client/SDR user |
| lead_id | UUID | FK to leads |
| vendido | BOOLEAN | Did lead convert to customer? |
| motivo_desistencia | TEXT | If vendido=false: 'budget', 'timing', 'competition', 'other' |
| nota_sdr | INT | Rating 1-5 for SDR performance |
| prompt_foi_util | BOOLEAN | Was AI prompt helpful? |
| valor_venda | DECIMAL | Deal size if closed |
| data_venda | DATE | When deal closed |

---

## Views for Analytics

### vw_workflow_stats_por_usuario
Summary stats by user (executions, success rate, tokens, cost)

### vw_workflow_stats_por_agente
Performance comparison between agent types

### vw_lead_feedback_stats
Win rate, SDR ratings, revenue tracking

### vw_workflow_por_hora
Hourly execution trends for charts

### vw_taxa_erro_por_agente
Error rate by agent type

---

## Next Steps

After deployment:

1. **Configure Real-time Alerts** (optional)
   - Set up Supabase alerts for error rate > 5%
   - Email admin when timeout occurs

2. **Implement Lead Feedback Modal** (Phase 2)
   - UI modal when lead marked "completed"
   - Collect win/loss + SDR rating
   - Calculate win rate %

3. **Add More Providers to Model Selection** (Phase 2)
   - Expand Modelo de IA tab options
   - Support more Claude/GPT variants

4. **Analytics Dashboard** (Phase 2)
   - Executive summary view
   - ROI calculations
   - SDR effectiveness scores

---

## Support

For questions or issues:

1. Check Supabase Logs: Dashboard → Logs → Edge Functions
2. Review N8N Workflow Logs: N8N → Workflow History
3. Browser Console: F12 → Console (JS errors)
4. Database: Supabase → Table Editor → View raw data

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Status:** ✅ Ready for deployment
