# Deploy Farm-SX no EasyPanel com Supabase

## Pre-requisitos

- ✅ Projeto Farm-SX clonado
- ✅ Acesso ao EasyPanel
- ✅ Acesso ao Supabase no EasyPanel

## Passo 1: Criar Novo Projeto Supabase

**⚠️ IMPORTANTE: Crie um NOVO projeto, não reutilize o existente**

1. No EasyPanel, acesse **Supabase**
2. Clique em **"Create New Project"**
3. Preencha:
   ```
   Project Name: farm-sx-predictive
   Database Password: [senha-forte]
   Region: us-east-1 (ou sua região)
   ```
4. Aguarde criação (2-5 minutos)

## Passo 2: Obter Credenciais do Banco

1. Entre no novo projeto criado
2. Vá em **Settings → Database**
3. Copie a **Connection String** (abra em modo "URI"):
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

## Passo 3: Preparar Chaves de API

Você precisa ter:
- **ANTHROPIC_API_KEY**: Da sua conta Anthropic
- **GEMINI_API_KEY**: Da sua conta Google (gratuito)

Se não tiver, crie em:
- Anthropic: https://console.anthropic.com/
- Google Gemini: https://ai.google.dev/

## Passo 4: Deploy no EasyPanel

1. **Crie uma nova aplicação** no EasyPanel
   - Escolha repositório GitHub: `sxsevenxperts/Farm-SX-Predictive-OS`
   - Branch: `main`
   - Diretório: `farm-sx`

2. **Configure variáveis de ambiente**:

   Vá em **Environment → Add Variable** e adicione:

   ```
   DATABASE_URL = postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

   ANTHROPIC_API_KEY = sk-ant-xxxxx

   GEMINI_API_KEY = AIzaSy-xxxxx

   ENV = production

   SQL_ECHO = false

   PORT = 8000
   ```

3. **Configure o build**:
   - Type: Docker
   - Dockerfile: `farm-sx/Dockerfile`
   - Port: `8000`

4. **Clique em Deploy**

## Passo 5: Acompanhar Deploy

O log mostrará:
```
Building Docker image...
Running: pip install -r requirements.txt
[Compilando xgboost, prophet, etc...]
Container starting...
Health check: OK
```

Tempo estimado: **5-10 minutos** (primeira vez é mais lento devido às dependências ML)

## Passo 6: Testar

Após deploy bem-sucedido:

```bash
# Health check
curl https://seu-app.easypanel.io/health

# Docs
https://seu-app.easypanel.io/docs
```

## Checklist Final

- ✅ Novo projeto Supabase criado (separado do existente)
- ✅ Variáveis de ambiente configuradas
- ✅ Deploy bem-sucedido
- ✅ Health check retorna `{"status": "healthy"}`
- ✅ Swagger docs acessível em `/docs`
- ✅ Banco de dados criado automaticamente
- ✅ Claude + Gemini funcionando para pareceres

## Solução de Problemas

### Error: "GEMINI_API_KEY não configurada"
→ Adicione `GEMINI_API_KEY` nas variáveis de ambiente

### Error: "DATABASE_URL connection failed"
→ Verifique a connection string do Supabase (senha correta, region correta)

### Error: "xgboost compilation failed"
→ Aumente timeout do build ou use Railway/Render se persistir

### Health check falha
→ Verifique os logs: **App → Logs**
