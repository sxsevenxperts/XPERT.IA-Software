from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.database_models import Agricultor, Propriedade
from src.schemas.pydantic_models import AgricultorCreate, AgricultorResponse
from typing import List

router = APIRouter(prefix="/api/v1/farmers", tags=["farmers"])

@router.post("/register", response_model=AgricultorResponse)
def registrar_agricultor(
    agricultor: AgricultorCreate,
    db: Session = Depends(get_db)
):
    """Registrar novo agricultor"""

    # Verificar se CPF já existe
    existente = db.query(Agricultor).filter(Agricultor.cpf == agricultor.cpf).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado"
        )

    # Verificar se email já existe
    existente_email = db.query(Agricultor).filter(Agricultor.email == agricultor.email).first()
    if existente_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )

    db_agricultor = Agricultor(**agricultor.dict())
    db.add(db_agricultor)
    db.commit()
    db.refresh(db_agricultor)

    return db_agricultor

@router.get("/{agricultor_id}", response_model=AgricultorResponse)
def obter_agricultor(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Obter perfil do agricultor"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()

    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    return agricultor

@router.get("/email/{email}", response_model=AgricultorResponse)
def obter_agricultor_por_email(
    email: str,
    db: Session = Depends(get_db)
):
    """Obter agricultor por email"""
    agricultor = db.query(Agricultor).filter(Agricultor.email == email).first()

    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    return agricultor

@router.get("")
def listar_agricultores(
    skip: int = 0,
    limit: int = 100,
    ativo: bool = True,
    db: Session = Depends(get_db)
):
    """Listar agricultores"""
    query = db.query(Agricultor).filter(Agricultor.ativo == ativo)
    agricultores = query.offset(skip).limit(limit).all()

    return {
        'total': query.count(),
        'skip': skip,
        'limit': limit,
        'agricultores': agricultores
    }

@router.put("/{agricultor_id}", response_model=AgricultorResponse)
def atualizar_agricultor(
    agricultor_id: int,
    dados_atualizacao: dict,
    db: Session = Depends(get_db)
):
    """Atualizar dados do agricultor"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()

    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    for chave, valor in dados_atualizacao.items():
        if hasattr(agricultor, chave) and valor is not None:
            setattr(agricultor, chave, valor)

    db.commit()
    db.refresh(agricultor)

    return agricultor

@router.delete("/{agricultor_id}")
def desativar_agricultor(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Desativar agricultor"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()

    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    agricultor.ativo = False
    db.commit()

    return {'mensagem': f'Agricultor {agricultor.nome} desativado'}

@router.get("/{agricultor_id}/propriedades")
def listar_propriedades_agricultor(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Listar propriedades de um agricultor"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()

    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    propriedades = db.query(Propriedade).filter(
        Propriedade.agricultor_id == agricultor_id
    ).all()

    return {
        'agricultor_id': agricultor_id,
        'agricultor_nome': agricultor.nome,
        'quantidade_propriedades': len(propriedades),
        'propriedades': propriedades
    }

@router.post("/{agricultor_id}/propriedade")
def adicionar_propriedade(
    agricultor_id: int,
    nome: str,
    area_total_hectares: float,
    municipio: str,
    latitude: float = None,
    longitude: float = None,
    tipo_solo: str = None,
    db: Session = Depends(get_db)
):
    """Adicionar propriedade para agricultor"""

    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    propriedade = Propriedade(
        agricultor_id=agricultor_id,
        nome=nome,
        area_total_hectares=area_total_hectares,
        area_cultivavel=area_total_hectares * 0.8,  # 80% cultivável por padrão
        municipio=municipio,
        latitude=latitude,
        longitude=longitude,
        tipo_solo=tipo_solo
    )

    db.add(propriedade)
    db.commit()
    db.refresh(propriedade)

    return {
        'status': 'propriedade_criada',
        'propriedade_id': propriedade.id,
        'propriedade_nome': propriedade.nome,
        'area_total': propriedade.area_total_hectares
    }

@router.get("/{agricultor_id}/resumo")
def obter_resumo_agricultor(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Obter resumo do agricultor com estatísticas"""

    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    propriedades = db.query(Propriedade).filter(
        Propriedade.agricultor_id == agricultor_id
    ).all()

    area_total = sum(p.area_total_hectares for p in propriedades)

    return {
        'agricultor_id': agricultor_id,
        'nome': agricultor.nome,
        'email': agricultor.email,
        'telefone': agricultor.telefone,
        'cidade': agricultor.cidade,
        'estado': agricultor.estado,
        'data_cadastro': agricultor.data_criacao,
        'ativo': agricultor.ativo,
        'estatisticas': {
            'quantidade_propriedades': len(propriedades),
            'area_total_hectares': area_total,
            'area_media_propriedade': area_total / len(propriedades) if propriedades else 0
        },
        'proximos_passos': [
            'Registrar análise de solo' if not any(p for p in propriedades) else None,
            'Atualizar previsões de clima' if len(propriedades) > 0 else None,
            'Verificar oportunidades de subsídios'
        ]
    }
