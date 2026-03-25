# Deploy Rápido: Farm-SX no Supabase Existente

## TL;DR - 5 Passos

### 1️⃣ Console do Supabase (No EasyPanel)

```sql
psql -U postgres -h localhost -d postgres

CREATE DATABASE farm_sx_db;
CREATE USER farm_user WITH PASSWORD 'senha-forte';
GRANT ALL PRIVILEGES ON DATABASE farm_sx_db TO farm_user;

\q
```

### 2️⃣ Connection String

```
postgresql://farm_user:senha-forte@postgres:5432/farm_sx_db
```

(Use `postgres` se tiver dentro da rede Docker)

### 3️⃣ Variáveis no EasyPanel (Farm-SX App)

```
DATABASE_URL = postgresql://farm_user:senha-forte@postgres:5432/farm_sx_db
ANTHROPIC_API_KEY = sk-ant-...
GEMINI_API_KEY = AIzaSy...
ENV = production
```

### 4️⃣ Deploy

```
EasyPanel → Farm-SX → Deploy
```

### 5️⃣ Verificar

```bash
curl https://seu-farm-sx.easypanel.io/health
# Retorna: {"status": "healthy"}

https://seu-farm-sx.easypanel.io/docs
```

---

## Status Final ✅

| O Que | Feito |
|------|-------|
| Claude + Gemini | ✅ |
| Documentação | ✅ |
| Git Workflow | ✅ |
| Código Supabase-ready | ✅ |
| Guia Banco Novo | ✅ |

**Próximo**: Executar os 5 passos acima no console do EasyPanel
