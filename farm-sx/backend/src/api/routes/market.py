from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.data.collectors.ceasa_collector import CEASACollector
from src.models.price_forecaster import PriceForecaster
from typing import List, Optional

router = APIRouter(prefix="/api/v1/market", tags=["market"])

ceasa = CEASACollector()
price_forecaster = PriceForecaster()

@router.get("/precos/{cultura}/{municipio}")
def get_precos_historia(
    cultura: str,
    municipio: str,
    dias: int = 30,
    db: Session = Depends(get_db)
):
    """Obter histórico de preços"""
    precos = ceasa.obter_precos_cultura(cultura, municipio, dias)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'dias': dias,
        'quantidade_registros': len(precos),
        'precos': precos
    }

@router.get("/precos-atuais/{cultura}/{municipio}")
def get_preco_atual(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter preço atual de uma cultura"""
    preco = ceasa.obter_preco_atual(cultura, municipio)

    if not preco:
        raise HTTPException(status_code=404, detail="Dados não disponíveis")

    return preco

@router.get("/tendencia/{cultura}/{municipio}")
def get_tendencia_preco(
    cultura: str,
    municipio: str,
    dias: int = 30,
    db: Session = Depends(get_db)
):
    """Analisar tendência de preço"""
    tendencia = ceasa.obter_tendencia_preco(cultura, municipio, dias)
    return tendencia

@router.post("/treinar-forecast/{cultura}")
def treinar_modelo_forecast(
    cultura: str,
    db: Session = Depends(get_db)
):
    """Treinar modelo Prophet para previsão de preços"""

    dados_historicos = ceasa.obter_precos_cultura(cultura, '', dias=365)

    # Converter formato para o Prophet
    dados_prophet = [
        {'data': p['data'], 'preco': p['preco_medio']}
        for p in dados_historicos
    ]

    sucesso = price_forecaster.treinar_modelo(cultura, dados_prophet)

    if not sucesso:
        raise HTTPException(status_code=400, detail="Falha ao treinar modelo")

    info = price_forecaster.get_modelo_info(cultura)
    return {
        'cultura': cultura,
        'status': 'treinado',
        'informacoes': info
    }

@router.get("/previsao-preco/{cultura}/{municipio}")
def prever_precos(
    cultura: str,
    municipio: str,
    meses: int = 3,
    db: Session = Depends(get_db)
):
    """Prever preços para os próximos meses"""

    # Treinar modelo se não existir
    if cultura not in price_forecaster.models:
        treinar_modelo_forecast(cultura, db)

    previsoes = price_forecaster.prever_preco(cultura, municipio, meses)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'meses_previstos': meses,
        'quantidade': len(previsoes),
        'previsoes': [
            {
                'mes': p.mes_previsto,
                'ano': p.ano_previsto,
                'preco_previsto': round(p.preco_previsto, 2),
                'intervalo_inferior': round(p.intervalo_inferior, 2),
                'intervalo_superior': round(p.intervalo_superior, 2),
                'tendencia': p.tendencia,
                'sazonalidade': round(p.sazonalidade, 2)
            }
            for p in previsoes
        ]
    }

@router.get("/cenarios-receita/{cultura}/{municipio}")
def simular_cenarios_receita(
    cultura: str,
    municipio: str,
    area_hectares: float = 10,
    produtividade_ton_ha: float = 3.5,
    db: Session = Depends(get_db)
):
    """Simular cenários de receita baseado em previsões de preço"""

    if cultura not in price_forecaster.models:
        treinar_modelo_forecast(cultura, db)

    cenarios = price_forecaster.simular_cenarios(
        cultura, municipio, area_hectares, produtividade_ton_ha
    )

    return {
        'cultura': cultura,
        'municipio': municipio,
        'area_hectares': area_hectares,
        'produtividade': produtividade_ton_ha,
        'cenarios': cenarios
    }

@router.get("/culturas-disponiveis")
def listar_culturas_disponiveis(db: Session = Depends(get_db)):
    """Listar culturas com dados CEASA disponíveis"""
    return {
        'culturas': ceasa.listar_culturas_disponiveis()
    }

@router.get("/municipios")
def listar_municipios(db: Session = Depends(get_db)):
    """Listar municípios com dados CEASA"""
    return {
        'municipios': ceasa.listar_municipios()
    }

@router.get("/comparacao/{cultura}")
def comparar_precos_municipios(
    cultura: str,
    municipios: Optional[List[str]] = None,
    db: Session = Depends(get_db)
):
    """Comparar preços da mesma cultura em diferentes municípios"""

    if municipios is None:
        municipios = ceasa.listar_municipios()[:5]

    comparacao = ceasa.comparar_precos_municipios(cultura, municipios)

    return {
        'cultura': cultura,
        'municipios_comparados': len(comparacao),
        'comparacao': comparacao
    }
