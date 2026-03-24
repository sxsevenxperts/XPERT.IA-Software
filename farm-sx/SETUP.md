# Farm SX Predictive OS - Guia de Configuração

## 📋 Pré-requisitos

- Python 3.10+
- Node.js 18+ e npm
- PostgreSQL 12+
- Git

## 🏗️ Configuração do Backend

### 1. Ambiente PostgreSQL

```bash
# Criar banco de dados e usuário
createuser -P farm_user  # Digite a senha quando solicitado
createdb -O farm_user farm_sx_db
```

### 2. Instalar e Configurar Backend

```bash
cd farm-sx/backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # macOS/Linux
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env

# Editar .env com suas credenciais
nano .env  # ou use seu editor favorito
```

### 3. Inicializar Banco de Dados

```bash
python -c "from src.core.database import init_db; init_db()"
```

### 4. Rodar Servidor

```bash
# Desenvolvimento
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Produção
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Acesse: http://localhost:8000/docs para documentação interativa

## 💻 Configuração do Dashboard

### 1. Instalar Dependências

```bash
cd farm-sx/dashboard
npm install
```

### 2. Variáveis de Ambiente

```bash
# Criar .env.local
cp .env.example .env.local

# Se necessário, ajuste a URL da API
# VITE_API_URL=http://localhost:8000
```

### 3. Rodar Dashboard

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview de produção
npm run preview
```

Acesse: http://localhost:5173

## 📊 API Endpoints Rápidos

### Análise de Solo

```bash
# Registrar análise
curl -X POST http://localhost:8000/api/v1/soil/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "propriedade_id": 1,
    "data_coleta": "2024-02-20",
    "ph": 6.2,
    "nitrogenio_ppm": 35,
    "fosforo_ppm": 18,
    "potassio_ppm": 75,
    "materia_organica_percent": 3.2
  }'

# Obter recomendações
curl http://localhost:8000/api/v1/soil/recommendations/1

# Health check
curl http://localhost:8000/api/v1/soil/health-check/1
```

### Produtos

```bash
# Registrar produto
curl -X POST http://localhost:8000/api/v1/products/register \
  -H "Content-Type: application/json" \
  -d '{
    "plantio_id": 1,
    "tipo_produto": "insumo",
    "nome": "Ureia",
    "categoria": "fertilizante",
    "data_aplicacao": "2024-02-20",
    "quantidade_usada": 50,
    "unidade": "kg",
    "custo": 450
  }'

# Análise de produtos
curl http://localhost:8000/api/v1/products/analysis/1

# Eficiência
curl http://localhost:8000/api/v1/products/efficiency/1
```

### Subsídios

```bash
# Listar oportunidades
curl http://localhost:8000/api/v1/subsidies/opportunities

# Oportunidades por agricultor
curl http://localhost:8000/api/v1/subsidies/opportunities/1/matched

# Candidatar-se
curl -X POST http://localhost:8000/api/v1/subsidies/candidatura \
  -H "Content-Type: application/json" \
  -d '{
    "oportunidade_id": 1,
    "agricultor_id": 1,
    "data_candidatura": "2024-02-20",
    "valor_solicitado": 50000
  }'

# Estatísticas por município
curl http://localhost:8000/api/v1/subsidies/statistics/Fortaleza
```

## 🗄️ Estrutura de Dados

### Inserir Agricultor

```bash
curl -X POST http://localhost:8000/api/v1/agricultores \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João da Silva",
    "email": "joao@farm.local",
    "telefone": "85999999999",
    "cpf": "12345678901",
    "cidade": "Fortaleza",
    "estado": "CE"
  }'
```

### Inserir Propriedade

```bash
curl -X POST http://localhost:8000/api/v1/propriedades \
  -H "Content-Type: application/json" \
  -d '{
    "agricultor_id": 1,
    "nome": "Propriedade Principal",
    "area_total_hectares": 10,
    "area_cultivavel": 8,
    "latitude": -3.7319,
    "longitude": -38.5267,
    "tipo_solo": "argiloso"
  }'
```

## 🧪 Testes

```bash
cd backend

# Rodar todos os testes
pytest

# Com cobertura
pytest --cov=src

# Teste específico
pytest tests/test_soil_analysis.py -v
```

## 🚀 Deploy

### Docker

```bash
# Build
docker build -t farm-sx:latest .

# Run
docker run -p 8000:8000 -e DATABASE_URL=postgresql://... farm-sx:latest
```

### Variáveis de Ambiente Importantes

```env
# Database
DATABASE_URL=postgresql://farm_user:password@localhost:5432/farm_sx_db
SQL_ECHO=false

# API
API_PORT=8000
API_HOST=0.0.0.0
ENV=production

# CORS
CORS_ORIGINS=https://yourdomain.com

# Optionals
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

## 📱 Recursos Futuros

- [ ] Integração com CEASA para preços de mercado
- [ ] Dados climáticos FUNCEME
- [ ] Indicadores econômicos IBGE
- [ ] Previsão de consumo com Prophet
- [ ] Otimização de plantio automática
- [ ] Notificações via WhatsApp
- [ ] Dashboard mobile nativo
- [ ] Offline-first PWA

## 🆘 Troubleshooting

### Erro de Conexão com PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Criar banco se não existir
createdb farm_sx_db -U farm_user
```

### Erro de CORS no Frontend

Adicione ao `.env` do backend:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Porta Já em Uso

```bash
# Mudar porta no backend
uvicorn src.api.main:app --port 8001

# Mudar porta no frontend (vite.config.js)
server: {
  port: 5174
}
```

## 📚 Documentação Adicional

- Backend API: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Banco de Dados: Ver `src/models/database_models.py`
- Schemas: Ver `src/schemas/pydantic_models.py`

## ✅ Checklist de Inicialização

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `farm_sx_db` criado
- [ ] Python venv criado e ativado
- [ ] Dependências pip instaladas
- [ ] `.env` configurado com DATABASE_URL
- [ ] Backend iniciado com `uvicorn`
- [ ] Node.js dependências instaladas
- [ ] Dashboard rodando em localhost:5173
- [ ] API documentação acessível em localhost:8000/docs
- [ ] Primeiro agricultor criado e testado

## 🎯 Próximos Passos

1. Configurar Alembic para migrações de banco de dados
2. Criar fixtures de teste com dados reais
3. Integrar coletores de dados externos (CEASA, FUNCEME, IBGE)
4. Implementar autenticação JWT
5. Adicionar rate limiting e segurança
6. Configurar CI/CD com GitHub Actions
7. Deploy em servidor cloud

Boa sorte! 🚀
