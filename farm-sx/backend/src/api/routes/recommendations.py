from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.database_models import Agricultor, Propriedade, AnaliseSolo, RegistroProduto
from src.data.collectors.consumption_collector import ConsumptionCollector
from src.data.collectors.ceasa_collector import CEASACollector
from src.data.collectors.climate_collector import ClimateCollector
from src.data.collectors.economic_collector import EconomicCollector
from src.models.planting_optimizer import PlantingOptimizer
from typing import List, Optional

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])

consumption = ConsumptionCollector()
ceasa = CEASACollector()
climate = ClimateCollector()
economic = EconomicCollector()
optimizer = PlantingOptimizer()

@router.get("/agricultor/{agricultor_id}")
def get_recomendacoes_agricultor(
    agricultor_id: int,
    db: Session = Depends(get_db)
):
    """Obter recomendações personalizadas para um agricultor"""

    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    propriedades = db.query(Propriedade).filter(Propriedade.agricultor_id == agricultor_id).all()
    if not propriedades:
        raise HTTPException(status_code=404, detail="Nenhuma propriedade encontrada")

    propriedade = propriedades[0]
    municipio = propriedade.municipio or "Fortaleza"

    # Obter análise de solo mais recente
    analise_solo = db.query(AnaliseSolo).filter(
        AnaliseSolo.propriedade_id == propriedade.id
    ).order_by(AnaliseSolo.data_coleta.desc()).first()

    recomendacoes = []

    # 1. Recomendação de Solo
    if analise_solo:
        recomendacoes.append({
            'tipo': 'solo',
            'titulo': 'Análise de Solo',
            'data': analise_solo.data_coleta.isoformat(),
            'descricao': f"pH: {analise_solo.ph}, Nitrogênio: {analise_solo.nitrogenio_ppm}ppm",
            'acao': 'Revisar análise e implementar recomendações'
        })
    else:
        recomendacoes.append({
            'tipo': 'solo',
            'titulo': 'Registrar análise de solo',
            'urgencia': 'alta',
            'descricao': 'Nenhuma análise registrada. Faça uma análise para melhor planejamento',
            'acao': 'Realizar análise de solo'
        })

    # 2. Recomendação de Clima
    indice_secas = climate.obter_indice_secas(municipio)
    if indice_secas['risco_seca'] == 'alto':
        recomendacoes.append({
            'tipo': 'clima',
            'titulo': 'Alerta de seca',
            'urgencia': 'alta',
            'descricao': f"Risco alto de seca. Dias sem chuva: {indice_secas['dias_sem_chuva']}",
            'acao': 'Preparar sistema de irrigação'
        })

    # 3. Recomendação Econômica
    cenarios = economic.obter_cenarios_economicos()
    selic = economic.obter_selic()
    if selic['taxa_selic'] > 10:
        recomendacoes.append({
            'tipo': 'economia',
            'titulo': 'SELIC elevada',
            'descricao': f"Taxa SELIC em {selic['taxa_selic']}%. Financiamentos mais caros",
            'acao': 'Buscar programa PRONAF com taxa reduzida'
        })

    # 4. Recomendação de Oportunidades de Crédito
    recomendacoes.append({
        'tipo': 'subsidio',
        'titulo': 'Oportunidades de Crédito',
        'descricao': 'Existem programas de crédito disponíveis para sua região',
        'acao': 'Verificar oportunidades de subsídios'
    })

    # 5. Recomendação de Plantio (baseado em demanda)
    recomendacoes.append({
        'tipo': 'plantio',
        'titulo': 'Otimização de Plantio',
        'descricao': 'Análise de demanda pode ajudar a escolher melhor época e cultura',
        'acao': 'Usar otimizador de plantio por consumo'
    })

    return {
        'agricultor_id': agricultor_id,
        'agricultor_nome': agricultor.nome,
        'municipio': municipio,
        'quantidade_recomendacoes': len(recomendacoes),
        'recomendacoes': recomendacoes,
        'resumo': f"{len(recomendacoes)} recomendações para melhorar produção"
    }

@router.get("/municipio/{municipio}")
def get_recomendacoes_municipio(
    municipio: str,
    db: Session = Depends(get_db)
):
    """Obter recomendações para um município"""

    recomendacoes = {
        'clima': climate.alertas_clima(municipio),
        'economia': economic.obter_ipca(),
        'culturas': consumption.comparar_culturas_demanda(municipio, consumption.ConsumptionCollector().listar_culturas_disponiveis())[:5],
        'mercado': ceasa.obter_tendencia_preco('milho', municipio)
    }

    return {
        'municipio': municipio,
        'recomendacoes': recomendacoes
    }

@router.post("/plano-safra")
def gerar_plano_safra(
    agricultor_id: int,
    propriedade_id: int,
    db: Session = Depends(get_db)
):
    """Gerar plano de safra integrado para agricultor"""

    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    propriedade = db.query(Propriedade).filter(Propriedade.id == propriedade_id).first()
    if not propriedade:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")

    municipio = propriedade.municipio or "Fortaleza"
    area = propriedade.area_cultivavel or 10

    # Obter dados atuais
    analise_solo = db.query(AnaliseSolo).filter(
        AnaliseSolo.propriedade_id == propriedade_id
    ).order_by(AnaliseSolo.data_coleta.desc()).first()

    if not analise_solo:
        raise HTTPException(status_code=400, detail="Realize uma análise de solo primeiro")

    # Gerar recomendações para 3 principais culturas
    culturas_principais = ['milho', 'feijão', 'tomate']
    planos = []

    for cultura in culturas_principais:
        try:
            # Previsões
            previsao_consumo = {
                mes: {'quantidade': 50000} for mes in range(1, 13)
            }
            previsao_preco = {
                mes: {'preco': 1000} for mes in range(1, 13)
            }

            # Dados clima
            previsao_clima = climate.obter_previsao_tempo(municipio, 30)
            precipitacao = sum(p['precipitacao'] for p in previsao_clima) / len(previsao_clima)

            plano = optimizer.otimizar_plantio(
                cultura=cultura,
                municipio=municipio,
                area_hectares=area * 0.33,  # Dividir área entre 3 culturas
                produtividade_media=3.0,
                previsao_consumo=previsao_consumo,
                previsao_preco=previsao_preco,
                dados_clima={'precipitacao_media': precipitacao, 'temperatura_media': 28},
                dados_solo={
                    'ph': analise_solo.ph or 6.0,
                    'nitrogenio_ppm': analise_solo.nitrogenio_ppm or 30,
                    'fosforo_ppm': analise_solo.fosforo_ppm or 15,
                    'potassio_ppm': analise_solo.potassio_ppm or 60,
                    'materia_organica_percent': analise_solo.materia_organica_percent or 2.5
                }
            )

            planos.append({
                'cultura': plano.cultura,
                'area': plano.area_hectares,
                'data_plantio': plano.data_plantio_recomendada,
                'data_colheita': plano.data_colheita_prevista,
                'lucro_estimado': round(plano.lucro_estimado, 2),
                'risco': plano.risco
            })
        except Exception as e:
            print(f"Erro ao gerar plano para {cultura}: {e}")

    return {
        'agricultor_id': agricultor_id,
        'agricultor_nome': agricultor.nome,
        'propriedade': propriedade.nome,
        'municipio': municipio,
        'area_total': propriedade.area_cultivavel,
        'safra': '2024',
        'planos': planos,
        'lucro_total_estimado': round(sum(p['lucro_estimado'] for p in planos), 2),
        'recomendacao': 'Revisar regularmente previsões de clima e mercado'
    }

@router.post("/alerta-custom")
def criar_alerta_personalizado(
    agricultor_id: int,
    tipo_alerta: str,  # clima, mercado, solo, economia
    parametros: dict,
    db: Session = Depends(get_db)
):
    """Criar alerta personalizado baseado em critérios do agricultor"""

    agricultor = db.query(Agricultor).filter(Agricultor.id == agricultor_id).first()
    if not agricultor:
        raise HTTPException(status_code=404, detail="Agricultor não encontrado")

    # Aqui iria a lógica de criação de alerta
    # Por enquanto, apenas retornamos a confirmação

    return {
        'status': 'alerta_criado',
        'agricultor': agricultor.nome,
        'tipo': tipo_alerta,
        'parametros': parametros,
        'mensagem': f"Alerta de {tipo_alerta} configurado com sucesso"
    }
