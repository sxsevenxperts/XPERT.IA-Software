# ⚡ EXECUTE AGORA - Criar Banco Farm-SX

## 3 Passos:

### Passo 1️⃣: Copie Este Comando Completo

```bash
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE farm_sx_db; CREATE USER farm_user WITH PASSWORD 'Senha123!Farm-SX'; GRANT ALL PRIVILEGES ON DATABASE farm_sx_db TO farm_user;"
```

### Passo 2️⃣: Cole No Console do EasyPanel

1. Vá em: EasyPanel → diversos → supabase → Console
2. Selecione **Bash**
3. Cole o comando acima
4. Pressione **Enter**

### Passo 3️⃣: Copie a Connection String

```
postgresql://farm_user:Senha123!Farm-SX@postgres:5432/farm_sx_db
```

---

## Após executar:

1. Vá em: **EasyPanel → farmsxpredictiveos → Settings → Environment Variables**

2. Adicione:

```
DATABASE_URL=postgresql://farm_user:Senha123!Farm-SX@postgres:5432/farm_sx_db
ANTHROPIC_API_KEY=sk-ant-xxxxx
GEMINI_API_KEY=AIzaSy-xxxxx
ENV=production
```

3. Clique em **Deploy**

---

## ✅ Pronto!

Seu Farm-SX estará rodando com:
- ✅ Banco novo criado
- ✅ Variáveis configuradas
- ✅ Claude + Gemini prontos
- ✅ Todas as funcionalidades
