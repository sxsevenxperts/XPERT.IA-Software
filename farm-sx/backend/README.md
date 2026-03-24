# Farm SX Predictive OS - Backend

FastAPI-based backend for the agricultural predictive platform designed for family farmers in Brazil.

## Features

### Core Modules

1. **Soil Analysis** (`/api/v1/soil`)
   - Register and track soil analysis data (pH, nutrients, organic matter)
   - Get soil health scores
   - Receive fertilizer and amendment recommendations

2. **Product Management** (`/api/v1/products`)
   - Track inputs and agrochemicals used
   - Analyze product efficiency and ROI
   - Get recommendations based on historical performance

3. **Government Subsidies** (`/api/v1/subsidies`)
   - Discover available subsidies and credit opportunities
   - Match opportunities to farmer profile
   - Track subsidy applications

4. **Economic Analysis** (pending)
   - IPCA, SELIC, and inflation tracking
   - Economic scenarios and impact analysis

5. **Consumption Forecasting** (pending)
   - Predict market demand trends
   - Optimize planting dates for peak demand

6. **Climate Data** (pending)
   - Weather forecasts
   - Drought index and climate alerts

## Setup

### Prerequisites
- Python 3.10+
- PostgreSQL 12+
- pip or poetry

### Installation

1. Clone the repository and navigate to backend:
```bash
cd farm-sx/backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

5. Initialize database:
```bash
python -c "from src.core.database import init_db; init_db()"
```

## Running

### Development
```bash
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Soil Analysis
- `POST /api/v1/soil/analysis` - Register soil analysis
- `GET /api/v1/soil/analysis/{propriedade_id}` - Get all analyses for a property
- `GET /api/v1/soil/analysis/{propriedade_id}/latest` - Get latest analysis
- `POST /api/v1/soil/recommendations/{propriedade_id}` - Get recommendations
- `GET /api/v1/soil/health-check/{propriedade_id}` - Get soil health score

### Products
- `POST /api/v1/products/register` - Register product used
- `GET /api/v1/products/plantio/{plantio_id}` - Get products for a planting
- `GET /api/v1/products/agricultor/{agricultor_id}/history` - Get farmer's product history
- `GET /api/v1/products/analysis/{plantio_id}` - Analyze products used
- `GET /api/v1/products/efficiency/{agricultor_id}` - Get product efficiency metrics
- `POST /api/v1/products/recommendations/{plantio_id}` - Get product recommendations

### Subsidies
- `POST /api/v1/subsidies/opportunities` - Create subsidy opportunity (admin)
- `GET /api/v1/subsidies/opportunities` - List all opportunities
- `GET /api/v1/subsidies/opportunities/{agricultor_id}/matched` - Get matched opportunities
- `POST /api/v1/subsidies/candidatura` - Apply for subsidy
- `GET /api/v1/subsidies/candidatura/{agricultor_id}` - Get farmer's applications
- `GET /api/v1/subsidies/statistics/{municipio}` - Get subsidy statistics

## Database Schema

### Key Models
- **Agricultor** - Farmer profiles
- **Propriedade** - Land/property records
- **Plantio** - Planting records with actual/estimated yields
- **AnaliseSolo** - Soil analysis data with NPK, pH, organic matter
- **RegistroProduto** - Product/input usage tracking
- **OportunidadeSubsidio** - Government subsidies and credit programs
- **CandidaturaSubsidio** - Subsidy application tracking
- **ConsumoHistorico** - Historical consumption data
- **IndicadorEconomico** - Economic indicators (IPCA, SELIC, etc)

## Next Steps

1. Set up Alembic migrations
2. Create farmer authentication endpoints
3. Integrate CEASA market data collector
4. Integrate FUNCEME climate data
5. Integrate IBGE economic data
6. Deploy to production

## Documentation

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT
