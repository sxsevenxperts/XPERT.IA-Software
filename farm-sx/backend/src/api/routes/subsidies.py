from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from src.core.database import get_db
from src.models.database_models import (
    OportunidadeSubsidio, CandidaturaSubsidio, Agricultor, Propriedade
)
from src.schemas.pydantic_models import (
    OportunidadeSubsidioCreate, OportunidadeSubsidioResponse,
    CandidaturaSubsidioCreate, CandidaturaSubsidioResponse
)
from datetime import date, datetime
from typing import List, Optional

router = APIRouter(prefix="/api/v1/subsidies", tags=["subsidies"])

@router.post("/opportunities", response_model=OportunidadeSubsidioResponse)
def create_subsidy_opportunity(
    opportunity: OportunidadeSubsidioCreate,
    db: Session = Depends(get_db)
):
    """Create a new subsidy/opportunity for farmers"""
    db_opportunity = OportunidadeSubsidio(**opportunity.dict())
    db.add(db_opportunity)
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity

@router.get("/opportunities", response_model=List[OportunidadeSubsidioResponse])
def list_opportunities(
    ativo: Optional[bool] = True,
    tipo: Optional[str] = None,
    orgao: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all available subsidies and opportunities"""
    query = db.query(OportunidadeSubsidio)

    if ativo is not None:
        query = query.filter(OportunidadeSubsidio.ativo == ativo)

    if tipo:
        query = query.filter(OportunidadeSubsidio.tipo == tipo)

    if orgao:
        query = query.filter(OportunidadeSubsidio.orgao == orgao)

    query = query.filter(
        or_(
            OportunidadeSubsidio.data_fim == None,
            OportunidadeSubsidio.data_fim >= date.today()
        )
    )

    return query.order_by(OportunidadeSubsidio.data_fim.desc()).all()

@router.get("/opportunities/{agricultor_id}/matched", response_model=List[dict])
def get_matched_opportunities(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Get subsidy opportunities matching farmer's profile"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor not found")

    propriedades = db.query(Propriedade).filter(
        Propriedade.agricultor_id == agricultor_id
    ).all()

    if not propriedades:
        raise HTTPException(status_code=404, detail="No properties found")

    # Collect municipios and culturas
    municipios = set([p.municipio for p in propriedades if p.municipio])
    culturas = set()

    # Get opportunities
    opportunities = db.query(OportunidadeSubsidio).filter(
        OportunidadeSubsidio.ativo == True,
        or_(
            OportunidadeSubsidio.data_fim == None,
            OportunidadeSubsidio.data_fim >= date.today()
        )
    ).all()

    matched = []

    for opp in opportunities:
        match_score = 0
        match_reasons = []

        # Check municipios
        if opp.municipios_validos:
            for municipio in municipios:
                if municipio in opp.municipios_validos:
                    match_score += 25
                    match_reasons.append(f"Disponível em {municipio}")
                    break

        # Check culturas
        if opp.culturas_validas:
            for cultura in culturas:
                if cultura in opp.culturas_validas:
                    match_score += 25
                    match_reasons.append(f"Para cultivo de {cultura}")
                    break
        else:
            # Sem restrição de cultura
            match_score += 15
            match_reasons.append("Sem restrição de cultivo")

        # Size check
        area_total = sum(p.area_total_hectares for p in propriedades)
        if (opp.valor_minimo is None or opp.valor_minimo > 0) and \
           (opp.valor_maximo is None or area_total < opp.valor_maximo):
            match_score += 20
            match_reasons.append("Compatível com tamanho da propriedade")

        # Add to matched if score > 0
        if match_score > 0:
            matched.append({
                "oportunidade_id": opp.id,
                "titulo": opp.titulo,
                "tipo": opp.tipo,
                "orgao": opp.orgao,
                "descricao": opp.descricao,
                "valor_minimo": opp.valor_minimo,
                "valor_maximo": opp.valor_maximo,
                "taxa_juros": opp.taxa_juros,
                "data_inicio": opp.data_inicio,
                "data_fim": opp.data_fim,
                "match_score": match_score,
                "razoes": match_reasons,
                "link_documentacao": opp.link_documentacao,
                "telefone_contato": opp.telefone_contato,
                "email_contato": opp.email_contato
            })

    # Sort by match score
    matched.sort(key=lambda x: x["match_score"], reverse=True)

    return matched

@router.post("/candidatura", response_model=CandidaturaSubsidioResponse)
def apply_for_subsidy(
    application: CandidaturaSubsidioCreate,
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Apply for a subsidy opportunity"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor not found")

    opp = db.query(OportunidadeSubsidio).filter(
        OportunidadeSubsidio.id == application.oportunidade_id
    ).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Check if already applied
    existing = db.query(CandidaturaSubsidio).filter(
        and_(
            CandidaturaSubsidio.agricultor_id == agricultor_id,
            CandidaturaSubsidio.oportunidade_id == application.oportunidade_id
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already applied for this opportunity")

    db_application = CandidaturaSubsidio(
        agricultor_id=agricultor_id,
        **application.dict()
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

@router.get("/candidatura/{agricultor_id}", response_model=List[dict])
def get_farmer_applications(
    agricultor_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all subsidy applications for a farmer"""
    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor not found")

    query = db.query(CandidaturaSubsidio).filter(
        CandidaturaSubsidio.agricultor_id == agricultor_id
    )

    if status:
        query = query.filter(CandidaturaSubsidio.status == status)

    applications = query.all()

    result = []
    for app in applications:
        opp = db.query(OportunidadeSubsidio).filter(
            OportunidadeSubsidio.id == app.oportunidade_id
        ).first()

        result.append({
            "candidatura_id": app.id,
            "titulo": opp.titulo if opp else "Unknown",
            "status": app.status,
            "data_candidatura": app.data_candidatura,
            "data_envio": app.data_envio,
            "data_resposta": app.data_resposta,
            "valor_solicitado": app.valor_solicitado,
            "valor_aprovado": app.valor_aprovado,
            "observacoes": app.observacoes
        })

    return result

@router.get("/statistics/{municipio}")
def get_subsidy_statistics(
    municipio: str,
    db: Session = Depends(get_db)
):
    """Get subsidy statistics for a municipio"""
    opportunities = db.query(OportunidadeSubsidio).filter(
        OportunidadeSubsidio.ativo == True,
        or_(
            OportunidadeSubsidio.data_fim == None,
            OportunidadeSubsidio.data_fim >= date.today()
        )
    ).all()

    municipio_opps = [o for o in opportunities if o.municipios_validos is None or municipio in o.municipios_validos]

    stats = {
        "municipio": municipio,
        "total_oportunidades": len(municipio_opps),
        "por_tipo": {},
        "por_orgao": {},
        "valor_total_disponivel": 0,
        "lista": []
    }

    for opp in municipio_opps:
        # By type
        tipo = opp.tipo
        if tipo not in stats["por_tipo"]:
            stats["por_tipo"][tipo] = 0
        stats["por_tipo"][tipo] += 1

        # By organization
        orgao = opp.orgao
        if orgao not in stats["por_orgao"]:
            stats["por_orgao"][orgao] = 0
        stats["por_orgao"][orgao] += 1

        # Total value
        if opp.valor_maximo:
            stats["valor_total_disponivel"] += opp.valor_maximo

        stats["lista"].append({
            "id": opp.id,
            "titulo": opp.titulo,
            "tipo": opp.tipo,
            "orgao": opp.orgao,
            "valor_maximo": opp.valor_maximo
        })

    return stats
