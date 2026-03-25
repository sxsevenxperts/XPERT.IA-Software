# Criar Novo Banco Farm-SX no Supabase Existente (Self-Hosted)

## Situação Atual

- ✅ Supabase self-hosted já existe no EasyPanel
- ✅ Tem projeto(s) existente(s)
- 🎯 Criar NOVO banco separado para Farm-SX

## Passo 1: Acessar Console do Supabase

```bash
# Via SSH no EasyPanel
ssh user@easypanel-ip

# Ou via console web do EasyPanel
# Dashboard → Supabase → Console/Terminal
```

## Passo 2: Listar Bancos Existentes

```bash
# Conectar ao PostgreSQL principal do Supabase
psql -U postgres -h localhost -d postgres

# Ou se tiver senha
psql -U postgres -h localhost -d postgres -W

# Listar bancos existentes
\l

# Você verá algo como:
# postgres  | postgres
# supabase  | postgres
# [outro projeto] | postgres
```

## Passo 3: Criar Novo Banco para Farm-SX

```bash
# Dentro do psql, criar novo banco
CREATE DATABASE farm_sx_db OWNER postgres;

# Criar usuário específico (opcional mas recomendado)
CREATE USER farm_user WITH PASSWORD 'senha-forte-aqui';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE farm_sx_db TO farm_user;

# Confirmar criação
\l

# Você verá:
# farm_sx_db | farm_user | UTF8
```

## Passo 4: Obter Connection String

```bash
# Sair do psql
\q

# Connection string para o Farm-SX será:
postgresql://farm_user:senha-forte-aqui@localhost:5432/farm_sx_db

# Ou se acessar de outro container/serviço no Docker:
postgresql://farm_user:senha-forte-aqui@postgres:5432/farm_sx_db

# (postgres é o hostname do container PostgreSQL dentro da rede Docker)
```

## Passo 5: Testar Conexão

```bash
# Testar nova connection string
psql -U farm_user -h localhost -d farm_sx_db -W

# Depois de conectar:
\dt

# Deve estar vazio (sem tabelas ainda)
```

## Passo 6: Configurar no App Farm-SX no EasyPanel

### Via Interface EasyPanel:

1. **Dashboard → Aplicações → Farm-SX**
2. **Settings → Environment Variables**
3. **Add Variable:**

```
DATABASE_URL = postgresql://farm_user:senha-forte-aqui@postgres:5432/farm_sx_db

ANTHROPIC_API_KEY = sk-ant-xxxxx

GEMINI_API_KEY = AIzaSyxxxxx

ENV = production

PORT = 8000
```

### Ou via Console/SSH:

```bash
# Editar arquivo .env da aplicação
cd /path/to/farm-sx

# Se usar docker-compose, editar .env ou variáveis
nano .env.production

# Adicionar:
DATABASE_URL=postgresql://farm_user:senha-forte-aqui@postgres:5432/farm_sx_db
ANTHROPIC_API_KEY=sk-ant-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
ENV=production
```

## Passo 7: Deploy da Aplicação

### Via EasyPanel Interface:
```
Dashboard → Farm-SX → Deploy
```

### Via Console:
```bash
# Se usando Docker
docker-compose up -d --build

# Acompanhar logs
docker logs -f farm-sx
```

## Passo 8: Verificar Criação de Tabelas

Após deploy bem-sucedido, o SQLAlchemy criará as tabelas automaticamente:

```bash
# Conectar ao novo banco
psql -U farm_user -h localhost -d farm_sx_db -W

# Listar tabelas criadas
\dt

# Você verá:
# farmers
# predictions
# livestock_analysis
# prices
# climate_data
# soil_data
# market_data
# ... e outras
```

## Passo 9: Testar API

```bash
# Health check
curl https://farm-sx.easypanel.io/health

# Swagger docs
https://farm-sx.easypanel.io/docs

# Escolher provider de IA
curl -X POST https://farm-sx.easypanel.io/parecer \
  -H "Content-Type: application/json" \
  -d '{"cultura": "milho", "provedor_ia": "gemini"}'
```

## Checklist

- ✅ Novo banco `farm_sx_db` criado
- ✅ Usuário `farm_user` criado com permissões
- ✅ Connection string obtida
- ✅ Variáveis de ambiente configuradas
- ✅ App deployado
- ✅ Tabelas criadas automaticamente
- ✅ Claude + Gemini testados

## ⚠️ Importante

- **SEPARADO**: Novo banco, não reutiliza o existente
- **SEGURANÇA**: Use senha forte para `farm_user`
- **DOCKER**: Se usar `postgres` como hostname (dentro do Docker)
- **LOCALHOST**: Se acessar direto da máquina, use `localhost:5432`

## Referência SQL Rápida

```sql
-- Listar bancos
\l

-- Conectar a banco
\c farm_sx_db

-- Listar tabelas
\dt

-- Ver estrutura de uma tabela
\d farmers

-- Ver usuários
\du

-- Dropar banco (se precisar recriar)
DROP DATABASE farm_sx_db;

-- Dropar usuário
DROP USER farm_user;
```
