from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.harvest_predictor import HarvestPredictor
from typing import Optional

router = APIRouter(prefix="/api/v1/predictions", tags=["predictions"])

harvest_predictor = HarvestPredictor()

@router.post("/harvest")
def predict_harvest(
    cultura: str,
    municipio: str,
    area_hectares: float,
    data_plantio: str,
    ph: float = 6.0,
    nitrogenio_ppm: float = 30,
    fosforo_ppm: float = 15,
    potassio_ppm: float = 60,
    materia_organica: float = 2.5,
    precipitacao: float = 80,
    temperatura: float = 28,
    produtividade_historica: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Prever colheita baseado em características"""

    prediction = harvest_predictor.prever_colheita(
        cultura=cultura,
        municipio=municipio,
        area_hectares=area_hectares,
        data_plantio=data_plantio,
        dados_solo={
            'ph': ph,
            'nitrogenio_ppm': nitrogenio_ppm,
            'fosforo_ppm': fosforo_ppm,
            'potassio_ppm': potassio_ppm,
            'materia_organica_percent': materia_organica
        },
        dados_clima={
            'precipitacao_media': precipitacao,
            'temperatura_media': temperatura
        },
        historico_produtividade=produtividade_historica
    )

    return {
        'cultura': prediction.cultura,
        'municipio': prediction.municipio,
        'area_hectares': prediction.area_hectares,
        'produtividade_estimada': round(prediction.produtividade_estimada, 2),
        'quantidade_prevista_kg': round(prediction.quantidade_prevista_kg, 0),
        'data_colheita_prevista': prediction.data_colheita_prevista,
        'confianca': round(prediction.confianca, 1),
        'variables_importance': {k: round(v, 4) for k, v in prediction.variables_importance.items()}
    }

@router.get("/harvest/{cultura}/{municipio}")
def get_harvest_scenarios(
    cultura: str,
    municipio: str,
    area_hectares: float = 10,
    db: Session = Depends(get_db)
):
    """Obter cenários de colheita com diferentes condições"""

    cenarios = []

    # Cenário 1: Otimista
    pred_otimista = harvest_predictor.prever_colheita(
        cultura=cultura, municipio=municipio, area_hectares=area_hectares,
        data_plantio='2024-03-01',
        dados_solo={'ph': 6.5, 'nitrogenio_ppm': 50, 'fosforo_ppm': 25, 'potassio_ppm': 80, 'materia_organica_percent': 3.5},
        dados_clima={'precipitacao_media': 120, 'temperatura_media': 27}
    )
    cenarios.append({'cenario': 'Otimista', 'produtividade': round(pred_otimista.produtividade_estimada, 2)})

    # Cenário 2: Base
    pred_base = harvest_predictor.prever_colheita(
        cultura=cultura, municipio=municipio, area_hectares=area_hectares,
        data_plantio='2024-03-15',
        dados_solo={'ph': 6.0, 'nitrogenio_ppm': 30, 'fosforo_ppm': 15, 'potassio_ppm': 60, 'materia_organica_percent': 2.5},
        dados_clima={'precipitacao_media': 80, 'temperatura_media': 28}
    )
    cenarios.append({'cenario': 'Base', 'produtividade': round(pred_base.produtividade_estimada, 2)})

    # Cenário 3: Pessimista
    pred_pessimista = harvest_predictor.prever_colheita(
        cultura=cultura, municipio=municipio, area_hectares=area_hectares,
        data_plantio='2024-04-01',
        dados_solo={'ph': 5.5, 'nitrogenio_ppm': 15, 'fosforo_ppm': 8, 'potassio_ppm': 40, 'materia_organica_percent': 1.8},
        dados_clima={'precipitacao_media': 40, 'temperatura_media': 31}
    )
    cenarios.append({'cenario': 'Pessimista', 'produtividade': round(pred_pessimista.produtividade_estimada, 2)})

    return {
        'cultura': cultura,
        'municipio': municipio,
        'area_hectares': area_hectares,
        'cenarios': cenarios,
        'recomendacao': f"Cenário mais provável: {cenarios[1]['cenario']}"
    }

@router.get("/feature-importance")
def get_feature_importance():
    """Obter importância das features no modelo"""
    importance = harvest_predictor.get_feature_importance()
    return {
        'features': sorted(importance.items(), key=lambda x: x[1], reverse=True),
        'total_features': len(importance)
    }
