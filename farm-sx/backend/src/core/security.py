from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

class TokenData(BaseModel):
    agricultor_id: int
    email: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar se a senha corresponde ao hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gerar hash da senha"""
    return pwd_context.hash(password)

def create_access_token(
    agricultor_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Criar token JWT de acesso"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "agricultor_id": agricultor_id,
        "email": email,
        "exp": expire
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    agricultor_id: int,
    email: str
) -> str:
    """Criar token de refresh"""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "agricultor_id": agricultor_id,
        "email": email,
        "exp": expire,
        "type": "refresh"
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verificar e decodificar token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        agricultor_id: int = payload.get("agricultor_id")
        email: str = payload.get("email")

        if agricultor_id is None or email is None:
            return None

        return TokenData(agricultor_id=agricultor_id, email=email)
    except JWTError:
        return None
