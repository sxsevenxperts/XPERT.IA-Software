from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.data.collectors.consumption_collector import ConsumptionCollector
from src.models.planting_optimizer import PlantingOptimizer
from typing import List, Optional

router = APIRouter(prefix="/api/v1/consumption", tags=["consumption"])

consumption = ConsumptionCollector()
optimizer = PlantingOptimizer()

@router.get("/historico/{cultura}/{municipio}")
def get_consumo_historico(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter histórico de consumo de uma cultura"""
    historico = consumption.obter_consumo_historico(cultura, municipio)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'quantidade_registros': len(historico),
        'historico': historico
    }

@router.get("/previsao/{cultura}/{municipio}")
def get_previsao_consumo(
    cultura: str,
    municipio: str,
    meses: int = 6,
    db: Session = Depends(get_db)
):
    """Prever consumo para os próximos meses"""
    previsoes = consumption.previsao_consumo(cultura, municipio, meses)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'meses_previstos': meses,
        'previsoes': previsoes
    }

@router.get("/sazonalidade/{cultura}/{municipio}")
def get_sazonalidade(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Analisar padrão de sazonalidade"""
    sazonalidade = consumption.analisar_sazonalidade(cultura, municipio)

    meses_nome = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    return {
        'cultura': cultura,
        'municipio': municipio,
        'sazonalidade': [
            {'mes': meses_nome[mes], 'indice': round(indice, 2)}
            for mes, indice in sorted(sazonalidade.items())
        ]
    }

@router.get("/picos/{cultura}/{municipio}")
def get_picos_consumo(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Identificar períodos de pico de consumo"""
    picos = consumption.identificar_picos_consumo(cultura, municipio)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'quantidade_picos': len(picos),
        'picos': picos
    }

@router.get("/demanda-canal/{cultura}/{municipio}")
def get_demanda_por_canal(
    cultura: str,
    municipio: str,
    db: Session = Depends(get_db)
):
    """Estimar demanda por canal de distribuição"""
    demanda = consumption.calcular_demanda_por_canal(cultura, municipio)

    return {
        'cultura': cultura,
        'municipio': municipio,
        'canais': demanda
    }

@router.get("/comparacao-culturas/{municipio}")
def comparar_culturas_demanda(
    municipio: str,
    culturas: str = "milho,feijão,tomate,melancia,alface",
    db: Session = Depends(get_db)
):
    """Comparar demanda de diferentes culturas"""

    lista_culturas = culturas.split(',')
    comparacao = consumption.comparar_culturas_demanda(municipio, lista_culturas)

    return {
        'municipio': municipio,
        'culturas_analisadas': len(comparacao),
        'ranking': [
            {
                'ranking': idx,
                'cultura': cultura,
                'demanda_anual_kg': round(demanda, 0)
            }
            for idx, (cultura, demanda) in enumerate(comparacao, 1)
        ]
    }

@router.post("/risco-superprodução")
def calcular_risco_superprodução(
    cultura: str,
    municipio: str,
    area_hectares: float = 10,
    produtividade_media: float = 3.5,
    db: Session = Depends(get_db)
):
    """Calcular risco de superprodução"""
    risco = consumption.calcular_risco_superprodução(
        cultura, area_hectares, produtividade_media, municipio
    )

    return risco

@router.get("/sugestao-rotacao/{municipio}")
def sugerir_rotacao_culturas(
    municipio: str,
    culturas: str = "milho,feijão,tomate,melancia,alface",
    db: Session = Depends(get_db)
):
    """Sugerir rotação de culturas baseado em demanda"""

    lista_culturas = culturas.split(',')
    sugestoes = consumption.sugerir_rotacao_culturas(municipio, lista_culturas)

    return {
        'municipio': municipio,
        'sugestoes': sugestoes
    }

@router.post("/otimizar-plantio")
def otimizar_plantio(
    cultura: str,
    municipio: str,
    area_hectares: float,
    produtividade_media: float = 3.5,
    ph: float = 6.0,
    nitrogenio_ppm: float = 30,
    fosforo_ppm: float = 15,
    potassio_ppm: float = 60,
    materia_organica: float = 2.5,
    precipitacao: float = 80,
    temperatura: float = 28,
    db: Session = Depends(get_db)
):
    """
    Otimizar plantio para evitar perdas e maximizar lucro
    Baseado em previsões de consumo, preço e condições ambientais
    """

    # Obter previsões de consumo
    previsao_consumo = consumption.previsao_consumo(cultura, municipio, 12)

    # Converter para dict com mes como key
    previsao_consumo_dict = {
        p['mes']: {
            'quantidade': p['quantidade_prevista_kg'],
            'confianca': p['confianca']
        }
        for p in previsao_consumo.values()
    }

    # Previsão de preço (simulada)
    previsao_preco_dict = {
        mes: {'preco': 1000 + (mes % 3) * 100}
        for mes in range(1, 13)
    }

    # Otimizar
    plano = optimizer.otimizar_plantio(
        cultura=cultura,
        municipio=municipio,
        area_hectares=area_hectares,
        produtividade_media=produtividade_media,
        previsao_consumo=previsao_consumo_dict,
        previsao_preco=previsao_preco_dict,
        dados_clima={
            'precipitacao_media': precipitacao,
            'temperatura_media': temperatura
        },
        dados_solo={
            'ph': ph,
            'nitrogenio_ppm': nitrogenio_ppm,
            'fosforo_ppm': fosforo_ppm,
            'potassio_ppm': potassio_ppm,
            'materia_organica_percent': materia_organica
        }
    )

    return {
        'cultura': plano.cultura,
        'municipio': plano.municipio,
        'area_hectares': plano.area_hectares,
        'data_plantio_recomendada': plano.data_plantio_recomendada,
        'data_colheita_prevista': plano.data_colheita_prevista,
        'quantidade_a_plantar_kg': round(plano.quantidade_a_plantar_kg, 0),
        'produtividade_estimada': round(plano.produtividade_estimada, 2),
        'lucro_estimado': round(plano.lucro_estimado, 2),
        'risco': plano.risco,
        'canais_venda': plano.canais_venda,
        'demanda_pico_mes': plano.demanda_pico_mes,
        'recomendacoes': plano.recomendacoes
    }

@router.post("/comparar-culturas")
def comparar_culturas_otimizacao(
    municipio: str,
    area_hectares: float,
    culturas: str = "milho,feijão,tomate,melancia",
    ph: float = 6.0,
    precipitacao: float = 80,
    temperatura: float = 28,
    db: Session = Depends(get_db)
):
    """Comparar potencial de lucro de diferentes culturas"""

    lista_culturas = culturas.split(',')

    # Previsões base
    previsoes_consumo = {}
    previsoes_preco = {}
    for cult in lista_culturas:
        previsoes_consumo[cult] = {
            mes: {'quantidade': 50000} for mes in range(1, 13)
        }
        previsoes_preco[cult] = {
            mes: {'preco': 1000} for mes in range(1, 13)
        }

    # Comparar
    ranking = optimizer.comparar_culturas(
        municipio=municipio,
        area_hectares=area_hectares,
        previsoes_consumo=previsoes_consumo,
        previsoes_preco=previsoes_preco,
        dados_clima={'precipitacao_media': precipitacao, 'temperatura_media': temperatura},
        dados_solo={'ph': ph},
        culturas=lista_culturas
    )

    return {
        'municipio': municipio,
        'area_hectares': area_hectares,
        'ranking': [
            {
                'ranking': idx,
                'cultura': cultura,
                'lucro_estimado': round(lucro, 2)
            }
            for idx, (cultura, lucro) in enumerate(ranking, 1)
        ]
    }
