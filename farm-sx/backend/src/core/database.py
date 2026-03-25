from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os

# Note: In production (EasyPanel), environment variables are set directly
# In local development, create a .env file or set environment variables manually
# We don't call load_dotenv() here to avoid file I/O issues during deployment

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
