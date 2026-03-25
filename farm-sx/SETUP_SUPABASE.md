# Setup Farm-SX com Supabase

## Passo 1: Criar Novo Projeto no Supabase

1. Acesse o painel do Supabase no EasyPanel
2. Clique em "New Project" ou "Create New"
3. Preencha:
   - **Nome**: `farm-sx-predictive`
   - **Região**: Escolha a mais próxima (ex: us-east-1)
   - **Senha do admin**: Salve em local seguro

## Passo 2: Obter Connection String

Após criar o projeto:

1. Vá em **Settings → Database → Connection String**
2. Copie a URI do PostgreSQL (modo padrão)
3. Ela terá o formato:
   ```
   postgresql://postgres.abc123:[PASSWORD]@aws-0-abc123.pooler.supabase.com:6543/postgres
   ```

## Passo 3: Configurar no EasyPanel

No painel de deployment do EasyPanel, adicione estas variáveis de ambiente:

```
DATABASE_URL=postgresql://postgres.abc123:[PASSWORD]@aws-0-abc123.pooler.supabase.com:6543/postgres
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
ENV=production
```

**Importante**:
- Use a connection string do Supabase (não localhost)
- Mantenha as chaves de API seguras
- Use o padrão de pool se disponível para produção

## Passo 4: Deploy

O código Farm-SX já está pronto para funcionar com Supabase:
- ✅ SQLAlchemy configurado para aceitar DATABASE_URL
- ✅ Migrations automáticas no init_db()
- ✅ Modelos PostgreSQL compatíveis

Apenas faça deploy normalmente - o banco será criado automaticamente.

## Verificação

Após deploy, teste o health check:

```bash
curl https://seu-farm-sx.easypanel.io/health
```

Deve retornar:
```json
{"status": "healthy"}
```

## Modelos que serão criados automaticamente

- farmers (usuários/agricultores)
- predictions (análises de safra)
- livestock_analysis (análises de pecuária)
- prices (preços monitorados)
- climate_data (dados climáticos)
- soil_data (dados de solo)
- market_data (dados de mercado)

Todos criados automaticamente via SQLAlchemy ORM.
