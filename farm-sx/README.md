# Farm SX Predictive OS

Plataforma de IA para agricultores familiares no Brasil (especialmente no Ceará) que fornece análise preditiva de consumo, demanda de mercado, dados de solo e oportunidades de subsídios para otimizar plantios e evitar perdas de safra.

## 🌾 Visão Geral

Farm SX é uma solução integrada que combina:

- **Análise de Solo Inteligente**: Rastreamento completo de nutrientes (NPK), pH, matéria orgânica
- **Gestão de Produtos**: Registro de insumos, agroquímicos e mecanização com análise de ROI
- **Oportunidades de Subsídios**: Acesso a créditos, seguros e programas governamentais
- **Previsão de Consumo** (em desenvolvimento): Otimização de plantio com base em picos de demanda
- **Análise Econômica** (em desenvolvimento): Indicadores macroeconômicos e cenários

## 📁 Estrutura do Projeto

```
farm-sx/
├── backend/                      # FastAPI REST API
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py          # Aplicação principal
│   │   │   └── routes/          # Endpoints da API
│   │   │       ├── soil_analysis.py    # Análise de solo
│   │   │       ├── products.py         # Gestão de produtos
│   │   │       └── subsidies.py        # Subsídios
│   │   ├── models/
│   │   │   └── database_models.py      # Modelos SQLAlchemy ORM
│   │   ├── schemas/
│   │   │   └── pydantic_models.py      # Validação Pydantic
│   │   ├── core/
│   │   │   └── database.py      # Configuração PostgreSQL
│   │   └── data/
│   │       └── collectors/      # Coletores de dados
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
└── dashboard/                     # React 18 + Vite + Tailwind
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx                  # Página inicial
    │   │   ├── SoilAnalysis.jsx              # Análise de solo
    │   │   ├── ProductManagement.jsx         # Produtos
    │   │   └── SubsidiesOpportunities.jsx    # Subsídios
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Card.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Editar .env com credenciais do banco

# Inicializar banco de dados
python -c "from src.core.database import init_db; init_db()"

# Rodar servidor
uvicorn src.api.main:app --reload --port 8000
```

API estará disponível em: `http://localhost:8000/docs`

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard estará em: `http://localhost:5173`

## 📊 Recursos Principais

### 1. Análise de Solo (`/api/v1/soil`)
- Registrar análises com pH, NPK, matéria orgânica
- Calcular score de saúde do solo
- Obter recomendações de fertilizantes e corretivos
- Histórico de análises

**Endpoints:**
- `POST /api/v1/soil/analysis` - Registrar análise
- `GET /api/v1/soil/analysis/{propriedade_id}` - Listar análises
- `GET /api/v1/soil/health-check/{propriedade_id}` - Score de saúde
- `POST /api/v1/soil/recommendations/{propriedade_id}` - Recomendações

### 2. Gestão de Produtos (`/api/v1/products`)
- Rastrear insumos, agroquímicos, mecanização
- Análise de custo e ROI
- Histórico de uso
- Recomendações baseadas em plantios anteriores

**Endpoints:**
- `POST /api/v1/products/register` - Registrar produto
- `GET /api/v1/products/plantio/{plantio_id}` - Produtos por plantio
- `GET /api/v1/products/analysis/{plantio_id}` - Análise
- `GET /api/v1/products/efficiency/{agricultor_id}` - Eficiência

### 3. Oportunidades de Subsídios (`/api/v1/subsidies`)
- Descobrir programas governamentais
- Crédito, seguros, subvenções
- Candidatura e rastreamento
- Estatísticas por município

**Endpoints:**
- `GET /api/v1/subsidies/opportunities` - Listar oportunidades
- `GET /api/v1/subsidies/opportunities/{agricultor_id}/matched` - Oportunidades por perfil
- `POST /api/v1/subsidies/candidatura` - Candidatar-se
- `GET /api/v1/subsidies/statistics/{municipio}` - Estatísticas

## 🗄️ Banco de Dados

### Modelos Principais

- **Agricultor** - Perfil do agricultor com localização
- **Propriedade** - Dados da propriedade/gleba
- **Plantio** - Registros de plantios com rendimento real e estimado
- **AnaliseSolo** - Dados completos de análise de solo
- **RegistroProduto** - Rastreamento de insumos e agrochemicals
- **OportunidadeSubsidio** - Programas governamentais disponíveis
- **CandidaturaSubsidio** - Rastreamento de candidaturas
- **ConsumoHistorico** - Dados de consumo para forecasting
- **IndicadorEconomico** - IPCA, SELIC, desemprego, etc.
- **Alerta** - Notificações para o agricultor

## 📱 Dashboard UI

### Páginas Implementadas

1. **Dashboard** - Overview com alertas e estatísticas
2. **Análise de Solo** - Registrar e visualizar análises com score de saúde
3. **Gestão de Produtos** - Rastrear custos e eficiência
4. **Oportunidades** - Descobrir e candidatar-se a subsídios

### Recursos
- Layout responsivo (mobile-first)
- Dark mode ready (Tailwind)
- Tabela de dados com filtros
- Gráficos com Recharts
- Integração com API via Axios

## 🔄 Próximos Passos

1. **Alembic Migrations** - Setup do sistema de versionamento de banco
2. **Integração de Dados**
   - CEASA (preços de mercado)
   - FUNCEME (dados climáticos)
   - IBGE (indicadores econômicos)
3. **Previsão de Consumo** - Modelo Prophet/LSTM
4. **Otimização de Plantio** - Análise preditiva de demanda
5. **Autenticação** - JWT + Refresh tokens
6. **Testes** - Unitários e integração
7. **Deployment** - Docker + Cloud

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI 0.104.1** - Framework web async
- **SQLAlchemy 2.0.23** - ORM
- **PostgreSQL 12+** - Banco de dados
- **XGBoost 2.0.3** - ML para previsões
- **Prophet 1.1.5** - Time series forecasting
- **Pydantic 2.5.0** - Validação de dados

### Frontend
- **React 18.2.0** - UI library
- **Vite 5.0.8** - Build tool
- **Tailwind CSS 3.3.6** - Estilos
- **Recharts 2.10.3** - Gráficos
- **Lucide React** - Ícones
- **React Router 6.20.0** - Roteamento

## 📋 Modelos de Banco de Dados

### AnaliseSolo
```
- id, agricultor_id, propriedade_id
- data_coleta, profundidade_cm
- pH, materia_organica_percent
- nitrogenio_ppm, fosforo_ppm, potassio_ppm
- calcio_ppm, magnesio_ppm, acidez_al3_ppm
- texture, umidade_percent, condutividade_eletrica
- recomendacoes, laboratorio
```

### RegistroProduto
```
- id, agricultor_id, plantio_id
- tipo_produto, nome, categoria
- data_aplicacao, quantidade_usada, unidade
- custo, fabricante, lote, validade
- metodo_aplicacao, efeitos_observados
```

### OportunidadeSubsidio
```
- id, titulo, descricao, tipo
- orgao, municipios_validos, culturas_validas
- valor_minimo, valor_maximo, taxa_juros
- data_inicio, data_fim, requisitos
- link_documentacao, telefone, email
- aprovacao_taxa, tempo_processamento_dias, ativo
```

## 🌍 Localização

Desenvolvido especificamente para:
- **Região**: Ceará, Brasil
- **Públicoalvo**: Agricultura Familiar
- **Idioma**: Português (pt-BR)
- **Culturas**: Milho, feijão, mandioca, caju, entre outras

## 📝 Licença

MIT

## 👥 Contribuições

Desenvolvido como solução para otimizar a produção agrícola familiar através de análise de dados e IA predictiva.
