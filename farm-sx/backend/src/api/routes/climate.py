from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.data.collectors.climate_collector import ClimateCollector
from typing import List, Optional

router = APIRouter(prefix="/api/v1/climate", tags=["climate"])

climate = ClimateCollector()

@router.get("/previsao/{municipio}")
def get_previsao_tempo(
    municipio: str,
    dias: int = 15,
    db: Session = Depends(get_db)
):
    """Obter previsão de tempo para os próximos dias"""
    previsao = climate.obter_previsao_tempo(municipio, dias)

    return {
        'municipio': municipio,
        'dias': dias,
        'quantidade_registros': len(previsao),
        'previsao': previsao
    }

@router.get("/indice-secas/{municipio}")
def get_indice_secas(
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter índice de secas do município"""
    return climate.obter_indice_secas(municipio)

@router.get("/historico/{municipio}/{mes}/{ano}")
def get_dados_historicos(
    municipio: str,
    mes: int,
    ano: int,
    db: Session = Depends(get_db)
):
    """Obter dados climáticos históricos"""

    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês inválido")

    dados = climate.obter_dados_historicos(municipio, mes, ano)
    return dados

@router.get("/alertas/{municipio}")
def get_alertas_clima(
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter alertas climáticos ativos"""
    alertas = climate.alertas_clima(municipio)

    return {
        'municipio': municipio,
        'quantidade_alertas': len(alertas),
        'alertas': alertas
    }

@router.get("/radiacao-solar/{municipio}")
def get_radiacao_solar(
    municipio: str,
    data: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obter dados de radiação solar"""
    return climate.obter_radiacao_solar(municipio, data)

@router.get("/umidade/{municipio}")
def get_umidade_relativa(
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter umidade relativa do ar"""
    return climate.obter_umidade_relativa(municipio)

@router.get("/risco-pragas/{municipio}/{cultura}")
def get_risco_pragas(
    municipio: str,
    cultura: str,
    db: Session = Depends(get_db)
):
    """Avaliar risco de pragas e doenças"""
    return climate.risco_pragas_doencas(municipio, cultura)

@router.get("/comparacao-municipios")
def comparar_clima_municipios(
    municipios: str = "Fortaleza,Caucaia,Pacajus",
    dias: int = 7,
    db: Session = Depends(get_db)
):
    """Comparar clima entre múltiplos municípios"""

    lista_municipios = municipios.split(',')
    comparacao = climate.comparacao_municipios(lista_municipios, dias)

    return {
        'municipios': lista_municipios,
        'quantidade': len(comparacao),
        'comparacao': comparacao
    }

@router.get("/demanda-agua/{cultura}/{municipio}")
def calcular_demanda_agua(
    cultura: str,
    municipio: str,
    area_hectares: float = 10,
    db: Session = Depends(get_db)
):
    """Calcular demanda de água baseado em previsão climática"""

    demanda = climate.previsao_demanda_agua(cultura, municipio, area_hectares)
    return demanda

@router.get("/recomendacoes-plantio/{cultura}/{municipio}")
def get_recomendacoes_plantio(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter recomendações de plantio baseado no clima"""

    indice_secas = climate.obter_indice_secas(municipio)
    previsao = climate.obter_previsao_tempo(municipio, 30)

    total_precip = sum(p['precipitacao'] for p in previsao)
    dias_sem_chuva = indice_secas['dias_sem_chuva']

    recomendacoes = []

    if dias_sem_chuva > 20:
        recomendacoes.append({
            'tipo': 'alerta',
            'mensagem': 'Possível seca. Prepare irrigação',
            'urgencia': 'alta'
        })

    if total_precip > 150:
        recomendacoes.append({
            'tipo': 'aviso',
            'mensagem': 'Chuva esperada. Bom período para plantar',
            'urgencia': 'media'
        })

    if indice_secas['risco_seca'] == 'alto':
        recomendacoes.append({
            'tipo': 'recomendacao',
            'mensagem': 'Considere culturas resistentes à seca',
            'urgencia': 'media'
        })

    return {
        'cultura': cultura,
        'municipio': municipio,
        'recomendacoes': recomendacoes,
        'condicoes_clima': {
            'risco_seca': indice_secas['risco_seca'],
            'precipitacao_prevista': round(total_precip, 1),
            'dias_sem_chuva': dias_sem_chuva
        }
    }
