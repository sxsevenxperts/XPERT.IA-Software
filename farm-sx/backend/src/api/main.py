from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from src.core.database import init_db
from src.api.routes import soil_analysis, products, subsidies

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="Farm SX Predictive OS",
    description="Platform for family farmers in Brazil to optimize planting using consumption forecasting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(soil_analysis.router)
app.include_router(products.router)
app.include_router(subsidies.router)

@app.get("/")
def read_root():
    """Welcome endpoint"""
    return {
        "message": "Farm SX Predictive OS - API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
