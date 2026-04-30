# 📝 N8N Workflow Logging Integration Guide

## Overview

This guide explains how to integrate the N8N workflow with the XPERT.IA monitoring system. The workflow will automatically log execution metrics (performance, tokens, cost) to the monitoring database after each LLM interaction.

---

## Architecture

```
N8N Workflow
    ↓
LLM Node (captures tokens, response time)
    ↓
HTTP Request Node (sends to edge function)
    ↓
log-workflow-execution Edge Function
    ↓
Supabase: workflow_executions table
    ↓
Monitoring Dashboard (real-time display)
```

---

## Workflow Integration Steps

### Step 1: Identify Your LLM Nodes

In `workflow-agente-sdr-v2.json`, find the nodes that call the LLM (OpenAI, Claude, etc).

Typical nodes:
- `node-llm-openai` (GPT calls)
- `node-llm-claude` (Claude calls if configured)
- Any node calling `node-llm-proxy` via edge function

**Expected input:**
```json
{
  "sistema_prompt": "Você é um SDR...",
  "user_message": "Olá, tudo bem?",
  "model": "gpt-4o-mini",
  "user_id": "uuid-here",
  "lead_id": "uuid-here",
  "agent_type": "principal",
  "numero_whatsapp": "+55-11-9999-9999"
}
```

**Expected output:**
```json
{
  "response": "Olá! Tudo bem sim...",
  "tokens": {
    "input": 150,
    "output": 200,
    "total": 350
  },
  "model_used": "gpt-4o-mini",
  "execution_time_ms": 2500
}
```

### Step 2: Add HTTP Request Node for Logging

1. **Add new node after each LLM node:**
   - Type: **HTTP Request**
   - Name: `node-log-execution`
   - Method: `POST`

2. **Configure the URL:**
   ```
   https://vyvdrbkcrvklcaombjqu.functions.supabase.co/functions/v1/log-workflow-execution
   ```

3. **Set Headers:**
   ```
   Authorization: Bearer {{ $env.SUPABASE_JWT_TOKEN }}
   Content-Type: application/json
   X-Request-ID: {{ $nodeId }}-{{ $executionId }}
   ```

4. **Set Request Body (JSON):**

```json
{
  "user_id": "{{ $json.user_id }}",
  "lead_id": "{{ $json.lead_id }}",
  "agent_type": "{{ $json.agent_type || 'principal' }}",
  "agent_index": "{{ $json.agent_index || 0 }}",
  "duracao_ms": "{{ $now - $json._execution_start_ms }}",
  "status": "sucesso",
  "tokens_input": "{{ $json.tokens.input || 0 }}",
  "tokens_output": "{{ $json.tokens.output || 0 }}",
  "modelo_usado": "{{ $json.model_used || 'gpt-4o-mini' }}",
  "resposta_gerada": "{{ $json.response }}",
  "numero_whatsapp": "{{ $json.numero_whatsapp }}",
  "prompt_usado": "{{ $json.sistema_prompt }}"
}
```

5. **Set Error Handling:**
   - Continue on Error: **YES** (don't stop workflow if logging fails)
   - Add error handler node to log failures:
     ```
     Type: HTTP Request
     Name: node-log-error
     URL: (same as above)
     Body: Add "status": "erro", "erro_mensagem": "{{ $error.message }}", "erro_tipo": "workflow_error"
     ```

### Step 3: Calculate Execution Time

To accurately track execution time, add a timestamp at the start of the relevant section:

**In the workflow initialization or before LLM nodes:**
```
Add Assignment Node:
  _execution_start_ms = {{ Date.now() }}
```

**Then in the logging node:**
```
duracao_ms = {{ Date.now() - $json._execution_start_ms }}
```

### Step 4: Capture Token Data

Ensure your LLM nodes output token information:

**For OpenAI (gpt-4):**
```
tokens: {
  input: {{ $json.usage.prompt_tokens }},
  output: {{ $json.usage.completion_tokens }},
  total: {{ $json.usage.total_tokens }}
}
```

**For Claude (via llm-proxy):**
```
tokens: {
  input: {{ $json.input_tokens }},
  output: {{ $json.output_tokens }},
  total: {{ $json.input_tokens + $json.output_tokens }}
}
```

### Step 5: Test the Integration

1. **Configure N8N Environment:**
   - Set `SUPABASE_JWT_TOKEN` in N8N environment/secrets
   - Use a service role or user token with proper RLS access

2. **Run a test workflow:**
   - Start a test with a sample lead
   - Check N8N execution logs for any errors
   - Go to Supabase Dashboard → Table Editor → `workflow_executions`
   - Verify new record appears

3. **Check Monitoring Dashboard:**
   - Login to XPERT.IA Software
   - Go to: Sidebar → **Resultados** → **Monitoramento**
   - Should show execution count, tokens, and performance data

---

## Example Workflow Structure

Here's the recommended structure for a logging-enabled workflow:

```
┌─ Start Trigger (WhatsApp webhook)
│
├─ Extract Message Data
├─ Load User Config (sistema_prompt, model)
├─ Record Start Time: _execution_start_ms = now()
│
├─ Call LLM (GPT-4o-mini)
│  ├─ Input: message
│  ├─ Output: response + tokens
│
├─ Send Logging Request
│  ├─ POST to log-workflow-execution
│  ├─ Include: tokens, duration, model, status
│  └─ Error: log error separately (don't block)
│
├─ Send Response to Lead
│
└─ End
```

---

## Error Handling

### Common Issues

1. **401 Unauthorized on Logging Request**
   - **Cause:** Invalid or expired JWT token
   - **Fix:** Refresh `SUPABASE_JWT_TOKEN` in N8N environment

2. **Network Timeout on Logging**
   - **Cause:** Edge function slow or unreachable
   - **Fix:** Set "Continue on Error" to not block main workflow
   - **Monitor:** Check Edge Function logs in Supabase

3. **Missing Token Data**
   - **Cause:** LLM output format differs
   - **Fix:** Map token fields correctly based on provider
   - **Test:** Log the full LLM response to see structure

### Debug Mode

Add a log node before the HTTP request to see the payload:

```
Type: Set Node
```Set:
```
logging_payload = {
  "user_id": "{{ $json.user_id }}",
  "tokens": "{{ $json.tokens }}",
  "duracao_ms": "{{ $now - $json._execution_start_ms }}"
}
```

Then check N8N execution logs to verify structure.

---

## Performance Considerations

### Batch Logging

If logging every execution creates too much overhead:

1. **Option A: Batch Every N Executions**
   - Keep counter: `_execution_count = ($json._execution_count || 0) + 1`
   - Only log when count reaches threshold (e.g., 10)
   - Reset counter after logging

2. **Option B: Sample Logging**
   - Log only 1 in 10 requests (production sampling)
   - Still track overall metrics via aggregation

3. **Option C: Async Logging Queue**
   - Store logs locally, batch send via separate process
   - Reduces per-request overhead

### Cost Optimization

Token logging adds ~50-100 bytes per request. For high-volume:
- Compress response before logging: only save first 500 chars
- Log hash of response instead of full text
- Use summarization for long responses

---

## Monitoring Dashboard Usage

### Real-time Metrics

Once logging is active, the dashboard shows:

1. **Execution Count** - Total requests processed
2. **Success Rate** - % of successful executions
3. **Avg Duration** - Average response time
4. **Tokens Used** - Total tokens (input + output)
5. **Cost USD** - Calculated from tokens

### Charts

- **Executions per Hour** - Hourly traffic
- **Error Rate by Agent** - Agent-specific failures
- **Token Usage Trend** - Cost tracking

### Filters

- By Agent Type (Principal, Objeção, Extra)
- By Status (Sucesso, Erro, Timeout)
- By Time Period (24h, 7d, 30d)

---

## Deployment Checklist

- [ ] Supabase tables deployed (`workflow_executions`, `workflow_errors`)
- [ ] Edge function `log-workflow-execution` deployed
- [ ] N8N environment has `SUPABASE_JWT_TOKEN` set
- [ ] HTTP logging node added to workflow
- [ ] Error handling configured (continue on error)
- [ ] Test execution completes successfully
- [ ] Data appears in Supabase table
- [ ] Monitoring dashboard shows data
- [ ] Feedback modal triggers on terminal stages (convertido/perdido)
- [ ] Lead feedback saved to `lead_feedback` table

---

## Next Steps

### Phase 2: Analytics & Win Rate Tracking

1. **Implement Lead Feedback Modal** ✅ (DONE)
   - Trigger on lead completion
   - Collect: Win/Loss, SDR rating, deal value
   - Store in `lead_feedback` table

2. **Analytics Dashboard** (TODO)
   - View win rate by agent
   - SDR performance metrics
   - Revenue tracking by agent
   - Feedback sentiment analysis

### Phase 3: Advanced Features

1. **Real-time Alerts**
   - Error rate spike detection
   - Timeout alerts
   - Cost threshold warnings

2. **Predictive Analytics**
   - Predict lead conversion likelihood
   - Identify high-performing agents
   - Optimize agent routing

3. **A/B Testing**
   - Compare prompt variations
   - Track performance differences
   - Auto-enable best performers

---

## Support

**Troubleshooting:**
- Check N8N Execution History for node errors
- View Supabase Edge Function Logs for API errors
- Check Browser Console (F12) for dashboard issues
- Verify JWT token is valid and has RLS permissions

**Questions:**
- Refer to MONITORING_SETUP.md for database setup
- Check `supabase/functions/log-workflow-execution/` for function code
- Review `software/index.html` lines 5229-5400 for dashboard implementation

---

**Version:** 1.0
**Last Updated:** 2026-03-19
**Status:** ✅ Ready for N8N integration
