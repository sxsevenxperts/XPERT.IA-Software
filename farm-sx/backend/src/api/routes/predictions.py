from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.harvest_predictor import HarvestPredictor
from src.models.predictive_engine import PredictiveAnalysisEngine, VariableSet
from src.models.database_models import PlanoBuscaPlantio, Alerta
from src.models.claude_ai import gerar_parecer_agricultura, MODELOS_DISPONIVEIS, MODELO_PADRAO
from src.data.collectors.ceasa_collector import CEASACollector
from src.data.collectors.climate_collector import ClimateCollector
from src.data.collectors.economic_collector import EconomicCollector
from src.data.collectors.consumption_collector import ConsumptionCollector
from typing import Optional
from datetime import datetime, date
import json

router = APIRouter(prefix="/api/v1/predictions", tags=["predictions"])

harvest_predictor = HarvestPredictor()
predictive_engine = PredictiveAnalysisEngine()
ceasa_collector = CEASACollector()
climate_collector = ClimateCollector()
economic_collector = EconomicCollector()
consumption_collector = ConsumptionCollector()

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

@router.get("/modelos-ia")
def listar_modelos_ia():
    """Listar modelos Claude disponíveis para análise"""
    return {
        "modelos": list(MODELOS_DISPONIVEIS.keys()),
        "padrao": MODELO_PADRAO,
        "descricoes": {
            "claude-opus-4-6": "Mais poderoso - análise mais profunda e detalhada",
            "claude-sonnet-4-6": "Balanceado - boa qualidade com menor custo",
            "claude-haiku-4-5": "Mais rápido - análise básica com alta velocidade",
        }
    }


@router.post("/parecer")
def gerar_parecer_ia(
    cultura: str,
    municipio: str,
    agricultor_id: Optional[int] = None,
    area_hectares: float = 10.0,
    modelo_ia: Optional[str] = None,
    # Solo
    ph: float = 6.0,
    nitrogenio_ppm: float = 30,
    fosforo_ppm: float = 15,
    potassio_ppm: float = 60,
    materia_organica: float = 2.5,
    # NOVOS: Variedade/Genética
    variedade_cultura: str = "padrão",
    taxa_germinacao_semente: float = 0.85,
    pureza_semente: float = 0.90,
    # NOVOS: Manejo de Água
    manejo_agua_tipo: str = "chuva",
    profundidade_lencol_freatico: float = 150.0,
    # NOVOS: Saúde do Solo
    compactacao_solo: str = "baixa",
    cobertura_anterior: str = "pousio",
    # NOVOS: Histórico
    historico_pragas_area: str = "media",
    historico_doencas_area: str = "media",
    # NOVOS: Manejo
    ultimo_defensivo_dias: int = 0,
    risco_tolerance_agricultor: str = "moderado",
    db: Session = Depends(get_db)
):
    """
    ⭐ CORE - Gerar parecer AI integrado com análise multidimensional

    Busca dados de 4 fontes (CEASA, clima, economia, consumo), analisa,
    cruza as variáveis e retorna um parecer/orientação estruturado com
    assertividade >90%, recomendações econômicas e oportunidades.
    """

    try:
        # Buscar dados de todas as fontes
        print(f"Buscando dados para análise: {cultura} em {municipio}")

        # 1. Dados de mercado (CEASA)
        try:
            preco_data = ceasa_collector.obter_preco_atual(cultura)
            preco_atual = preco_data.get('preco', 2.5)
            tendencia_data = ceasa_collector.obter_tendencia_preco(cultura)
            tendencia_preco = tendencia_data.get('tendencia', 0.0)
            volatilidade = tendencia_data.get('volatilidade', 0.1)
        except:
            preco_atual, tendencia_preco, volatilidade = 2.5, 0.0, 0.1

        # 2. Dados climáticos
        try:
            clima_data = climate_collector.obter_previsao_tempo(municipio)
            precipitacao = clima_data.get('precipitacao', 80)
            temperatura = clima_data.get('temperatura_media', 28)
            umidade = climate_collector.obter_umidade_relativa(municipio).get('umidade', 70)
            indice_data = climate_collector.obter_indice_secas(municipio)
            indice_secas = indice_data.get('indice', 0.3)
        except:
            precipitacao, temperatura, umidade, indice_secas = 80, 28, 70, 0.3

        # 3. Dados econômicos
        try:
            ipca_data = economic_collector.obter_ipca()
            selic_data = economic_collector.obter_selic()
            inflacao_data = economic_collector.obter_inflacao_alimentos()
            desemprego_data = economic_collector.obter_desemprego()

            ipca = ipca_data.get('valor', 0.045) / 100
            selic = selic_data.get('valor', 10.5) / 100
            inflacao_alimentos = inflacao_data.get('valor', 8.0) / 100
            desemprego = desemprego_data.get('valor', 7.0) / 100
        except:
            ipca, selic, inflacao_alimentos, desemprego = 0.045, 0.105, 0.08, 0.07

        # 4. Dados de consumo
        try:
            consumo_data = consumption_collector.obter_consumo_historico(cultura)
            consumo_medio = consumo_data.get('consumo_medio', 1000)
            previsao_data = consumption_collector.previsao_consumo(cultura)
            consumo_previsto = previsao_data.get('previsao_6m', 1200)
            sazonalidade_data = consumption_collector.analisar_sazonalidade(cultura)
            sazonalidade = sazonalidade_data.get('sazonalidade_media', 1.0)
            picos_data = consumption_collector.identificar_picos_consumo(cultura)
            picos_demanda = picos_data.get('meses_pico', [6, 7])
        except:
            consumo_medio, consumo_previsto, sazonalidade, picos_demanda = 1000, 1200, 1.0, [6, 7]

        # Construir VariableSet com TODAS as variáveis (24+ campos)
        variables = VariableSet(
            # Solo (5 variáveis)
            ph=ph,
            nitrogenio_ppm=nitrogenio_ppm,
            fosforo_ppm=fosforo_ppm,
            potassio_ppm=potassio_ppm,
            materia_organica=materia_organica,

            # Clima (5 variáveis)
            precipitacao=precipitacao,
            temperatura=temperatura,
            umidade=umidade,
            dias_sem_chuva=0 if precipitacao > 50 else int(30 * (1 - precipitacao/80)),
            indice_seca="baixo" if indice_secas < 0.3 else "medio" if indice_secas < 0.6 else "alto",

            # Mercado (3 variáveis)
            preco_atual=preco_atual,
            tendencia_preco="alta" if tendencia_preco > 0 else "baixa" if tendencia_preco < 0 else "estável",
            volatilidade_preco=volatilidade,

            # Consumo/Demanda (4 variáveis)
            consumo_historico_media=consumo_medio,
            consumo_previsto_prox_6m=consumo_previsto,
            sazonalidade_mes=sazonalidade,
            pico_demanda_mes=picos_demanda[0] if isinstance(picos_demanda, list) and len(picos_demanda) > 0 else 6,

            # Economia (4 variáveis)
            ipca=ipca,
            selic=selic,
            inflacao_alimentos=inflacao_alimentos,
            desemprego=desemprego,

            # Produção (3 variáveis)
            produtividade_historica=4.5,  # tons/ha
            area_hectares=area_hectares,
            custo_producao_ha=3000.0,  # R$/hectare

            # NOVOS: Variedade/Genética (3)
            variedade_cultura=variedade_cultura,
            taxa_germinacao_semente=taxa_germinacao_semente,
            pureza_semente=pureza_semente,

            # NOVOS: Manejo de Água (2)
            manejo_agua_tipo=manejo_agua_tipo,
            profundidade_lencol_freatico=profundidade_lencol_freatico,

            # NOVOS: Saúde do Solo (2)
            compactacao_solo=compactacao_solo,
            cobertura_anterior=cobertura_anterior,

            # NOVOS: Histórico (2)
            historico_pragas_area=historico_pragas_area,
            historico_doencas_area=historico_doencas_area,

            # NOVOS: Manejo (1)
            ultimo_defensivo_dias=ultimo_defensivo_dias,

            # NOVOS: Preferências (1)
            risco_tolerance_agricultor=risco_tolerance_agricultor
        )

        # Executar análise
        agricultor_id_to_use = agricultor_id if agricultor_id else 0
        analise = predictive_engine.analisar_plantio(
            agricultor_id=agricultor_id_to_use,
            cultura=cultura,
            municipio=municipio,
            variaveis=variables
        )

        # Salvar análise no banco de dados se agricultor_id fornecido
        if agricultor_id:
            try:
                # Criar registro de plano de plantio
                plano = PlanoBuscaPlantio(
                    agricultor_id=agricultor_id,
                    cultura=cultura,
                    municipio=municipio,
                    area_hectares=area_hectares,
                    produtividade_media=analise.produtividade_prevista,
                    data_plantio_recomendada=datetime.strptime(analise.data_plantio_recomendada, "%Y-%m-%d").date(),
                    data_colheita_prevista=datetime.strptime(analise.data_colheita_prevista, "%Y-%m-%d").date(),
                    quantidade_a_plantar_kg=analise.quantidade_colheita_prevista,
                    lucro_estimado=analise.lucro_previsto,
                    risco=analise.risco_geral,
                    canais_venda={"recomendados": ["CEASA"]},
                    demanda_pico_mes=analise.mes_melhor_venda,
                    recomendacoes=json.dumps(analise.recomendacoes, ensure_ascii=False)
                )
                db.add(plano)
                db.commit()
                plano_id = plano.id

                # Criar alertas associados
                for alerta_dados in analise.alertas:
                    alerta = Alerta(
                        agricultor_id=agricultor_id,
                        tipo="analise_ia",
                        titulo=alerta_dados.get("mensagem", "Alerta da análise"),
                        mensagem=alerta_dados.get("acao_sugerida", ""),
                        urgencia=alerta_dados.get("severidade", "media"),
                        link_acao=f"/previsoes/{plano_id}"
                    )
                    db.add(alerta)
                db.commit()

            except Exception as e:
                print(f"Erro ao salvar análise: {str(e)}")
                # Não falha a resposta se não conseguir salvar

        # Gerar parecer com Claude AI
        parecer_claude = None
        modelo_usado = None
        try:
            dados_analise = {
                "receita_prevista": analise.receita_prevista,
                "lucro_previsto": analise.lucro_previsto,
                "margem_lucro": analise.margem_lucro,
                "roi_esperado": analise.roi_esperado,
                "produtividade_prevista": analise.produtividade_prevista,
                "quantidade_colheita_prevista": analise.quantidade_colheita_prevista,
                "perda_climatica_percent": analise.perda_climatica_percent,
                "perda_pragas_percent": analise.perda_pragas_percent,
                "perda_doencas_percent": analise.perda_doencas_percent,
                "perda_total_esperada_percent": analise.perda_total_esperada_percent,
                "risco_clima": analise.risco_clima,
                "risco_mercado": analise.risco_mercado,
                "risco_economia": analise.risco_economia,
                "risco_geral": analise.risco_geral,
                "assertividade": analise.assertividade,
                "data_plantio_recomendada": analise.data_plantio_recomendada,
                "data_colheita_prevista": analise.data_colheita_prevista,
                "mes_melhor_venda": analise.mes_melhor_venda,
                "pragas_esperadas": analise.pragas_esperadas,
                "doencas_esperadas": analise.doencas_esperadas,
                "oportunidades": analise.oportunidades,
                "alertas": analise.alertas,
            }
            parecer_claude = gerar_parecer_agricultura(
                cultura=cultura,
                municipio=municipio,
                area_hectares=area_hectares,
                analise=dados_analise,
                modelo=modelo_ia,
            )
            from src.models.claude_ai import _resolver_modelo
            modelo_usado = _resolver_modelo(modelo_ia)
        except Exception as e:
            print(f"Aviso: Claude API indisponível ({str(e)}). Usando parecer local.")
            parecer_claude = None

        # Preparar resposta estruturada
        resposta = {
            "status": "sucesso",
            "data_analise": analise.data_analise,
            "cultura": cultura,
            "municipio": municipio,
            "area_hectares": area_hectares,

            # Assertividade
            "assertividade_percentual": round(analise.assertividade, 1),
            "confianca_geral": round(analise.confianca_geral, 1),
            "assertividade_validacao": "✅ ANÁLISE CONFIÁVEL" if analise.assertividade >= 90 else "⚠️ ANÁLISE COM RESSALVAS",
            "variaveis_criticas": analise.variaveis_criticas,

            # Parecer Executivo
            "parecer_executivo": {
                "opiniao": analise.parecer_executivo,
                "nivel_assertividade": f"{analise.assertividade:.0f}%",
                "periodo_validade": analise.periodo_validade,
                "score_qualidade": round(analise.score_qualidade, 2)
            },

            # Parecer Claude AI
            "parecer_claude_ai": {
                "disponivel": parecer_claude is not None,
                "modelo_utilizado": modelo_usado,
                "parecer": parecer_claude,
            },

            # Previsões
            "previsoes": {
                "produtividade_estimada_ton_ha": round(analise.produtividade_prevista, 2),
                "quantidade_prevista_kg": round(analise.quantidade_colheita_prevista, 0),
                "preco_previsto_kg": round(analise.preco_previsto_colheita, 2),
            },

            # Economia
            "analise_economica": {
                "receita_total_estimada": round(analise.receita_prevista, 2),
                "custos_totais": round(analise.custo_total, 2),
                "lucro_liquido_estimado": round(analise.lucro_previsto, 2),
                "margem_percentual": round(analise.margem_lucro, 1),
                "roi_percentual": round(analise.roi_esperado, 1),
                "ponto_equilibrio_kg": round(analise.ponto_equilibrio_kg, 0),
                "break_even_dias": analise.break_even_dias,
            },

            # Timing de Plantio
            "recomendacao_plantio": {
                "data_plantio_recomendada": analise.data_plantio_recomendada,
                "data_colheita_prevista": analise.data_colheita_prevista,
                "mes_melhor_venda": analise.mes_melhor_venda,
                "racional": "Sincronizado com pico de demanda para melhor preço"
            },

            # Riscos
            "analise_riscos": {
                "risco_climatico": analise.risco_clima,
                "risco_mercado": analise.risco_mercado,
                "risco_economico": analise.risco_economia,
                "risco_geral": analise.risco_geral,
            },

            # NOVOS: Análise de Perdas Esperadas
            "analise_perdas": {
                "perda_total_esperada_percent": round(analise.perda_total_esperada_percent, 1),
                "detalhamento": {
                    "perda_climatica_percent": round(analise.perda_climatica_percent, 1),
                    "perda_pragas_percent": round(analise.perda_pragas_percent, 1),
                    "perda_doencas_percent": round(analise.perda_doencas_percent, 1),
                    "perda_colheita_percent": round(analise.perda_colheita_percent, 1),
                },
                "quantidade_esperada_com_perdas_kg": round(analise.quantidade_esperada_com_perdas, 0),
                "recomendacao": f"Semear com factor de segurança {round(analise.factor_reserva_sementes, 2)}x para compensar perdas"
            },

            # NOVOS: Densidade de Plantio e Sementes
            "plantio_recomendado": {
                "densidade_plantio_plantas_ha": round(analise.densidade_plantio_recomendada, 0),
                "sementes_kg_por_hectare": round(analise.sementes_kg_hectare, 2),
                "sementes_totais_a_comprar_kg": round(analise.sementes_totais_kg, 1),
                "variedade_recomendada": variedade_cultura,
                "taxa_germinacao_esperada": f"{taxa_germinacao_semente*100:.0f}%",
                "pureza_semente_esperada": f"{pureza_semente*100:.0f}%"
            },

            # NOVOS: Pragas e Doenças Esperadas
            "pragas_doencas_esperadas": {
                "pragas": analise.pragas_esperadas,
                "doencas": analise.doencas_esperadas,
                "periodo_pico_pressao": analise.periodo_pico_pragas,
                "recomendacoes_defensivos": analise.recomendacoes_defensivos,
                "alerta": f"⚠️ Monitorar semanalmente a partir da emergência das plantas"
            },

            # NOVOS: Recomendações de Manejo
            "recomendacoes_manejo": {
                "agua": analise.recomendacoes_agua,
                "nutricao": analise.recomendacoes_nutricao,
                "solo": analise.recomendacoes_solo,
                "colheita": analise.recomendacoes_colheita,
            },

            # Recomendações gerais
            "recomendacoes_acao": analise.recomendacoes,

            # Alertas
            "alertas_ativos": analise.alertas,

            # Oportunidades
            "oportunidades_identificadas": analise.oportunidades,

            # Comparação com outras culturas
            "comparacao_culturas": {
                "cultura_analisada": cultura,
                "lucro_estimado_r$": round(analise.lucro_previsto, 2),
                "alternativas_rentaveis": analise.comparacao_outras_culturas
            }
        }

        return resposta

    except ValueError as e:
        if "assertividade" in str(e).lower():
            raise HTTPException(
                status_code=422,
                detail={
                    "erro": "Assertividade insuficiente",
                    "mensagem": str(e),
                    "recomendacao": "Forneça dados mais completos: análise de solo recente, histórico de clima local, dados de produção anterior",
                    "dados_necessarios": {
                        "solo": "pH, NPK, matéria orgânica completos",
                        "clima": "Previsão de 15+ dias",
                        "consumo": "Histórico de 12+ meses",
                        "economia": "Indicadores atualizados"
                    }
                }
            )
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar análise AI: {str(e)}"
        )

@router.get("/pareceres/{agricultor_id}")
def listar_pareceres(
    agricultor_id: int,
    cultura: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Listar todos os pareceres IA gerados para um agricultor
    """
    query = db.query(PlanoBuscaPlantio).filter(
        PlanoBuscaPlantio.agricultor_id == agricultor_id
    )

    if cultura:
        query = query.filter(PlanoBuscaPlantio.cultura == cultura)

    planos = query.order_by(PlanoBuscaPlantio.data_criacao.desc()).all()

    return {
        "agricultor_id": agricultor_id,
        "total_pareceres": len(planos),
        "pareceres": [
            {
                "id": plano.id,
                "cultura": plano.cultura,
                "municipio": plano.municipio,
                "area_hectares": plano.area_hectares,
                "data_plantio_recomendada": plano.data_plantio_recomendada.isoformat(),
                "data_colheita_prevista": plano.data_colheita_prevista.isoformat(),
                "produtividade_media": plano.produtividade_media,
                "lucro_estimado": plano.lucro_estimado,
                "risco": plano.risco,
                "data_analise": plano.data_criacao.isoformat()
            }
            for plano in planos
        ]
    }

@router.get("/pareceres/{agricultor_id}/{plano_id}")
def obter_parecer_detalhado(
    agricultor_id: int,
    plano_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter detalhes completos de um parecer gerado
    """
    plano = db.query(PlanoBuscaPlantio).filter(
        PlanoBuscaPlantio.id == plano_id,
        PlanoBuscaPlantio.agricultor_id == agricultor_id
    ).first()

    if not plano:
        raise HTTPException(status_code=404, detail="Parecer não encontrado")

    # Buscar alertas associados
    alertas = db.query(Alerta).filter(
        Alerta.agricultor_id == agricultor_id,
        Alerta.link_acao == f"/previsoes/{plano_id}"
    ).all()

    return {
        "id": plano.id,
        "cultura": plano.cultura,
        "municipio": plano.municipio,
        "area_hectares": plano.area_hectares,
        "produtividade_media": plano.produtividade_media,
        "data_plantio_recomendada": plano.data_plantio_recomendada.isoformat(),
        "data_colheita_prevista": plano.data_colheita_prevista.isoformat(),
        "quantidade_a_plantar_kg": plano.quantidade_a_plantar_kg,
        "lucro_estimado": plano.lucro_estimado,
        "risco": plano.risco,
        "recomendacoes": json.loads(plano.recomendacoes) if plano.recomendacoes else [],
        "alertas": [
            {
                "id": a.id,
                "titulo": a.titulo,
                "mensagem": a.mensagem,
                "urgencia": a.urgencia,
                "lido": a.lido
            }
            for a in alertas
        ],
        "data_geracao": plano.data_criacao.isoformat()
    }
