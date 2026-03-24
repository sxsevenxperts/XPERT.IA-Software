from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.database_models import AnaliseSolo, Propriedade
from src.schemas.pydantic_models import AnaliseSoloCreate, AnaliseSoloResponse
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/api/v1/soil", tags=["soil_analysis"])

@router.post("/analysis", response_model=AnaliseSoloResponse)
def create_soil_analysis(
    analysis: AnaliseSoloCreate,
    db: Session = Depends(get_db)
):
    """Register soil analysis for a property"""
    # Verify property exists
    propriedade = db.query(Propriedade).filter(Propriedade.id == analysis.propriedade_id).first()
    if not propriedade:
        raise HTTPException(status_code=404, detail="Propriedade not found")

    db_analysis = AnaliseSolo(**analysis.dict())
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

@router.get("/analysis/{propriedade_id}", response_model=List[AnaliseSoloResponse])
def get_soil_analyses(
    propriedade_id: int,
    db: Session = Depends(get_db)
):
    """Get all soil analyses for a property"""
    analyses = db.query(AnaliseSolo).filter(AnaliseSolo.propriedade_id == propriedade_id).all()
    return analyses

@router.get("/analysis/{propriedade_id}/latest", response_model=AnaliseSoloResponse)
def get_latest_soil_analysis(
    propriedade_id: int,
    db: Session = Depends(get_db)
):
    """Get latest soil analysis for a property"""
    analysis = db.query(AnaliseSolo).filter(
        AnaliseSolo.propriedade_id == propriedade_id
    ).order_by(AnaliseSolo.data_coleta.desc()).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="No soil analyses found")
    return analysis

@router.post("/recommendations/{propriedade_id}")
def get_soil_recommendations(
    propriedade_id: int,
    db: Session = Depends(get_db)
):
    """Get soil improvement recommendations based on latest analysis"""
    analysis = db.query(AnaliseSolo).filter(
        AnaliseSolo.propriedade_id == propriedade_id
    ).order_by(AnaliseSolo.data_coleta.desc()).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="No soil analyses found")

    recommendations = []

    # pH recommendations
    if analysis.ph:
        if analysis.ph < 5.5:
            recommendations.append({
                "tipo": "pH",
                "problema": "Solo muito ácido",
                "recomendacao": "Aplicar calcário dolomítico (CaCO3)",
                "quantidade": f"{analysis.ph * 0.5:.1f} t/ha"
            })
        elif analysis.ph > 7.5:
            recommendations.append({
                "tipo": "pH",
                "problema": "Solo alcalino",
                "recomendacao": "Aplicar sulfato de alumínio ou enxofre elementar"
            })

    # Nutrient recommendations
    if analysis.nitrogenio_ppm and analysis.nitrogenio_ppm < 30:
        recommendations.append({
            "tipo": "Nutriente",
            "elemento": "Nitrogênio",
            "problema": "Deficiência",
            "recomendacao": "Aplicar ureia ou nitrato de amônio",
            "quantidade": "100-150 kg/ha"
        })

    if analysis.fosforo_ppm and analysis.fosforo_ppm < 15:
        recommendations.append({
            "tipo": "Nutriente",
            "elemento": "Fósforo",
            "problema": "Deficiência",
            "recomendacao": "Aplicar superfosfato simples ou triplo",
            "quantidade": "80-120 kg/ha"
        })

    if analysis.potassio_ppm and analysis.potassio_ppm < 60:
        recommendations.append({
            "tipo": "Nutriente",
            "elemento": "Potássio",
            "problema": "Deficiência",
            "recomendacao": "Aplicar cloreto de potássio",
            "quantidade": "60-100 kg/ha"
        })

    # Organic matter
    if analysis.materia_organica_percent and analysis.materia_organica_percent < 2.5:
        recommendations.append({
            "tipo": "Matéria Orgânica",
            "problema": "Baixo teor",
            "recomendacao": "Incorporar resíduos de cultura ou compostagem",
            "quantidade": "20-40 t/ha"
        })

    return {
        "propriedade_id": propriedade_id,
        "data_analise": analysis.data_coleta,
        "recomendacoes": recommendations,
        "proxima_analise_recomendada": (analysis.data_coleta + timedelta(days=365)).isoformat()
    }

@router.get("/health-check/{propriedade_id}")
def get_soil_health_check(
    propriedade_id: int,
    db: Session = Depends(get_db)
):
    """Get overall soil health score"""
    analysis = db.query(AnaliseSolo).filter(
        AnaliseSolo.propriedade_id == propriedade_id
    ).order_by(AnaliseSolo.data_coleta.desc()).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="No soil analyses found")

    score = 0
    max_score = 0
    details = {}

    # pH check (max 25 points)
    if analysis.ph:
        max_score += 25
        if 6.0 <= analysis.ph <= 7.0:
            score += 25
        elif 5.5 <= analysis.ph <= 7.5:
            score += 15
        else:
            score += 5
        details["pH"] = {"valor": analysis.ph, "status": "ótimo" if 6.0 <= analysis.ph <= 7.0 else "adequado" if 5.5 <= analysis.ph <= 7.5 else "crítico"}

    # Nutrients check (max 50 points)
    if analysis.nitrogenio_ppm and analysis.fosforo_ppm and analysis.potassio_ppm:
        max_score += 50
        nutrient_score = 0
        if analysis.nitrogenio_ppm >= 30: nutrient_score += 15
        if analysis.fosforo_ppm >= 15: nutrient_score += 15
        if analysis.potassio_ppm >= 60: nutrient_score += 20
        score += nutrient_score
        details["Nutrientes"] = {"score": nutrient_score, "status": "adequado" if nutrient_score >= 40 else "deficiente"}

    # Organic matter (max 25 points)
    if analysis.materia_organica_percent:
        max_score += 25
        if analysis.materia_organica_percent >= 3.0:
            score += 25
        elif analysis.materia_organica_percent >= 2.5:
            score += 15
        else:
            score += 5
        details["Matéria Orgânica"] = {"valor": f"{analysis.materia_organica_percent}%", "status": "bom" if analysis.materia_organica_percent >= 3.0 else "adequado" if analysis.materia_organica_percent >= 2.5 else "baixo"}

    saude_score = int((score / max_score * 100)) if max_score > 0 else 0

    return {
        "propriedade_id": propriedade_id,
        "saude_solo_score": saude_score,
        "max_score": max_score,
        "score_atual": score,
        "status": "Excelente" if saude_score >= 80 else "Bom" if saude_score >= 60 else "Adequado" if saude_score >= 40 else "Crítico",
        "detalhes": details
    }
