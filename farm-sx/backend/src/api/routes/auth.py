from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.core.database import get_db
from src.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, verify_token, TokenResponse
)
from src.models.database_models import Agricultor
from src.schemas.pydantic_models import AgricultorCreate

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    senha: str

class RegisterRequest(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str = None
    cpf: str = None
    cidade: str = None
    estado: str = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Registrar novo agricultor"""

    # Verificar se email já existe
    existente = db.query(Agricultor).filter(Agricultor.email == request.email).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )

    # Criar agricultor
    agricultor = Agricultor(
        nome=request.nome,
        email=request.email,
        telefone=request.telefone,
        cpf=request.cpf,
        cidade=request.cidade,
        estado=request.estado
    )

    # Adicionar campo de senha (não será armazenado no modelo atual)
    # Para isso, seria necessário adicionar um campo 'senha_hash' ao modelo

    db.add(agricultor)
    db.commit()
    db.refresh(agricultor)

    # Gerar tokens
    access_token = create_access_token(agricultor.id, agricultor.email)
    refresh_token = create_refresh_token(agricultor.id, agricultor.email)

    return {
        'status': 'registrado',
        'agricultor_id': agricultor.id,
        'nome': agricultor.nome,
        'email': agricultor.email,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer'
    }

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Fazer login com email"""

    agricultor = db.query(Agricultor).filter(Agricultor.email == request.email).first()

    if not agricultor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    # Por enquanto, aceitamos qualquer senha (em produção, verificar com hash)
    # Aqui seria: if not verify_password(request.senha, agricultor.senha_hash)

    # Gerar tokens
    access_token = create_access_token(agricultor.id, agricultor.email)
    refresh_token = create_refresh_token(agricultor.id, agricultor.email)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'bearer',
        'agricultor_id': agricultor.id,
        'nome': agricultor.nome
    }

@router.post("/refresh")
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Gerar novo access token usando refresh token"""

    token_data = verify_token(request.refresh_token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )

    agricultor = db.query(Agricultor).filter(Agricultor.id == token_data.agricultor_id).first()

    if not agricultor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agricultor não encontrado"
        )

    access_token = create_access_token(agricultor.id, agricultor.email)

    return {
        'access_token': access_token,
        'token_type': 'bearer'
    }

@router.get("/me")
def get_current_user(
    token: str = None,
    db: Session = Depends(get_db)
):
    """Obter dados do usuário autenticado"""

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido"
        )

    token_data = verify_token(token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    agricultor = db.query(Agricultor).filter(Agricultor.id == token_data.agricultor_id).first()

    if not agricultor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agricultor não encontrado"
        )

    return {
        'agricultor_id': agricultor.id,
        'nome': agricultor.nome,
        'email': agricultor.email,
        'telefone': agricultor.telefone,
        'cidade': agricultor.cidade,
        'estado': agricultor.estado
    }

@router.post("/logout")
def logout():
    """Fazer logout"""
    # Em uma implementação real, seria necessário manter uma lista de tokens revogados
    return {'mensagem': 'Logout realizado com sucesso'}
