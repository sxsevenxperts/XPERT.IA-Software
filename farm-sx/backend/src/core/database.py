from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

# Load .env file if it exists (optional, for local development)
try:
    load_dotenv()
except Exception:
    pass  # Continue without .env file (will use environment variables)

# PostgreSQL connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://farm_user:farm_password@localhost:5432/farm_sx_db"
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool if os.getenv("ENV") == "production" else None,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database with all tables"""
    Base.metadata.create_all(bind=engine)
