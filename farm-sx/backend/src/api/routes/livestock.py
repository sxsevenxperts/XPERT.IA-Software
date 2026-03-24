from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.livestock_engine import LivestockAnalysisEngine, LivestockVariableSet
from src.models.database_models import Agricultor
from src.models.claude_ai import gerar_parecer_pecuaria, MODELOS_DISPONIVEIS, MODELO_PADRAO
from src.models import gemini_ai
from typing import Optional
from datetime import datetime
import json

router = APIRouter(prefix="/api/v1/livestock", tags=["livestock"])

livestock_engine = LivestockAnalysisEngine()


@router.get("/modelos-ia")
def listar_modelos_ia():
    """Listar modelos de IA disponíveis para análise (Claude e Gemini)"""
    return {
        "provedores": {
            "claude": {
                "nome": "Claude (Anthropic)",
                "modelos": list(MODELOS_DISPONIVEIS.keys()),
                "padrao": MODELO_PADRAO,
                "descricoes": {
                    "claude-opus-4-6": "Mais poderoso - análise mais profunda e detalhada",
                    "claude-sonnet-4-6": "Balanceado - boa qualidade com menor custo",
                    "claude-haiku-4-5": "Mais rápido - análise básica com alta velocidade",
                },
                "requer_chave": True
            },
            "gemini": {
                "nome": "Google Gemini (Grátis)",
                "modelos": list(gemini_ai.MODELOS_DISPONIVEIS.keys()),
                "padrao": gemini_ai.MODELO_PADRAO,
                "descricoes": {
                    "gemini-2.0-flash": "Rápido e preciso - completamente grátis",
                    "gemini-flash": "Rápido e preciso - completamente grátis",
                    "gemini-pro": "Mais poderoso - análise profunda (grátis)",
                },
                "requer_chave": True,
                "nota": "Usar GEMINI_API_KEY (obtém grátis em ai.google.dev)"
            }
        }
    }


@router.post("/analise")
def analisar_rebanho(
    agricultor_id: int,
    tipo_rebanho: str,  # "gado_leite", "gado_corte", "ovino", "suíno"
    quantidade_animais: int,
    peso_medio_kg: float = 500.0,
    raca_predominante: str = "Holandesa",
    idade_media_meses: float = 36.0,

    # Produção
    producao_diaria: float = 15.0,  # L/dia ou kg/dia
    dias_produtivos_ano: int = 330,
    indice_fertilidade: float = 0.85,
    taxa_mortalidade_percent: float = 2.0,

    # Nutrição
    custos_alimentacao_dia_animal: float = 15.0,
    qualidade_pastagem: str = "media",
    suplementacao_tipo: str = "sal_mineral",
    agua_disponivel: str = "suficiente",
    saude_nutricional: str = "adequada",

    # Saúde
    vacinacao_atualizada: bool = True,
    historico_doencas_area: str = "baixa",
    mastite_incidencia_percent: float = 8.0,
    sanidade_geral: str = "boa",
    ultimo_tratamento_dias: int = 30,

    # Mercado
    preco_leite_litro: float = 1.50,
    preco_carne_kg: float = 20.0,
    tendencia_preco: str = "estavel",
    volatilidade_preco: float = 0.1,

    # Economia
    custos_infraestrutura_mes: float = 2000.0,
    custos_veterinarios_mes: float = 800.0,
    mao_obra_custos_mes: float = 3000.0,
    custo_credito_taxa_selic: float = 0.105,

    # Clima
    temperatura_media: float = 28.0,
    umidade_relativa: float = 70.0,
    precipitacao_mm: float = 80.0,
    qualidade_agua_pocos: str = "boa",

    # Manejo
    sistema_criacao: str = "semi_intensivo",
    frequencia_ordenha_dia: int = 2,
    genetica_melhorada: bool = False,
    participacao_programas_melhoramento: bool = False,

    # Claude AI
    modelo_ia: Optional[str] = None,
    provedor_ia: str = "claude",

    db: Session = Depends(get_db)
):
    """
    ⭐ ANÁLISE COMPLETA DE REBANHO

    Analisa produtividade, economia, saúde e sustentabilidade de rebanho.
    Retorna parecer com recomendações e oportunidades de melhoria.
    """

    try:
        # Criar VariableSet
        variaveis = LivestockVariableSet(
            tipo_rebanho=tipo_rebanho,
            quantidade_animais=quantidade_animais,
            peso_medio_kg=peso_medio_kg,
            raca_predominante=raca_predominante,
            idade_media_meses=idade_media_meses,

            producao_diaria=producao_diaria,
            dias_produtivos_ano=dias_produtivos_ano,
            indice_fertilidade=indice_fertilidade,
            taxa_mortalidade_percent=taxa_mortalidade_percent,

            custos_alimentacao_dia_animal=custos_alimentacao_dia_animal,
            qualidade_pastagem=qualidade_pastagem,
            suplementacao_tipo=suplementacao_tipo,
            agua_disponivel=agua_disponivel,
            saude_nutricional=saude_nutricional,

            vacinacao_atualizada=vacinacao_atualizada,
            historico_doencas_area=historico_doencas_area,
            mastite_incidencia_percent=mastite_incidencia_percent,
            sanidade_geral=sanidade_geral,
            ultimo_tratamento_dias=ultimo_tratamento_dias,

            preco_leite_litro=preco_leite_litro,
            preco_carne_kg=preco_carne_kg,
            tendencia_preco=tendencia_preco,
            volatilidade_preco=volatilidade_preco,

            custos_infraestrutura_mes=custos_infraestrutura_mes,
            custos_veterinarios_mes=custos_veterinarios_mes,
            mao_obra_custos_mes=mao_obra_custos_mes,
            custo_credito_taxa_selic=custo_credito_taxa_selic,

            temperatura_media=temperatura_media,
            umidade_relativa=umidade_relativa,
            precipitacao_mm=precipitacao_mm,
            qualidade_agua_pocos=qualidade_agua_pocos,

            sistema_criacao=sistema_criacao,
            frequencia_ordenha_dia=frequencia_ordenha_dia,
            genetica_melhorada=genetica_melhorada,
            participacao_programas_melhoramento=participacao_programas_melhoramento
        )

        # Executar análise
        analise = livestock_engine.analisar_rebanho(
            agricultor_id=agricultor_id,
            variaveis=variaveis
        )

        # Gerar parecer com IA (Claude ou Gemini)
        parecer_ia = None
        modelo_usado = None
        provedor_usado = provedor_ia.lower()
        try:
            dados_analise = {
                "receita_bruta_anual": analise.receita_bruta_anual,
                "custos_totais_anual": analise.custos_totais_anual,
                "lucro_liquido_anual": analise.lucro_liquido_anual,
                "margem_lucro_percent": analise.margem_lucro_percent,
                "roi_percent": analise.roi_percent,
                "producao_diaria_total": analise.producao_diaria_total,
                "producao_anual_total": analise.producao_anual_total,
                "margem_producao": analise.margem_producao,
                "probabilidade_doenca": analise.probabilidade_doenca,
                "mastite_risco": analise.mastite_risco if tipo_rebanho == "gado_leite" else "n/a",
                "sanidade_geral": sanidade_geral,
                "assertividade": analise.assertividade,
                "pontos_criticos": analise.pontos_criticos,
                "oportunidades": analise.oportunidades,
                "alertas": analise.alertas,
                "potencial_producao_otimizada": analise.potencial_producao_otimizada,
                "ganho_potencial_anual": analise.ganho_potencial_anual,
            }

            if provedor_usado == "gemini":
                parecer_ia = gemini_ai.gerar_parecer_pecuaria(
                    tipo_rebanho=tipo_rebanho,
                    quantidade_animais=quantidade_animais,
                    raca_predominante=raca_predominante,
                    analise=dados_analise,
                    modelo=modelo_ia,
                )
                modelo_usado = gemini_ai._resolver_modelo(modelo_ia)
            else:  # claude (padrão)
                parecer_ia = gerar_parecer_pecuaria(
                    tipo_rebanho=tipo_rebanho,
                    quantidade_animais=quantidade_animais,
                    raca_predominante=raca_predominante,
                    analise=dados_analise,
                    modelo=modelo_ia,
                )
                from src.models.claude_ai import _resolver_modelo
                modelo_usado = _resolver_modelo(modelo_ia)
        except Exception as e:
            print(f"Aviso: API de IA indisponível ({str(e)}). Usando parecer local.")
            parecer_ia = None

        # Preparar resposta estruturada
        resposta = {
            "status": "sucesso",
            "data_analise": analise.data_analise,
            "tipo_rebanho": tipo_rebanho,
            "quantidade_animais": quantidade_animais,
            "raca_predominante": raca_predominante,

            # Assertividade
            "assertividade_percentual": round(analise.assertividade, 1),
            "confianca_geral": round(analise.confianca_geral, 1),
            "variaveis_criticas": analise.variaveis_criticas,

            # Parecer Executivo
            "parecer_executivo": {
                "opiniao": analise.parecer_executivo,
                "nivel_assertividade": f"{analise.assertividade:.0f}%",
                "periodo_validade": analise.periodo_validade,
                "score_qualidade": round(analise.score_qualidade, 2)
            },

            # Parecer IA
            "parecer_ia": {
                "disponivel": parecer_ia is not None,
                "provedor": provedor_usado,
                "modelo_utilizado": modelo_usado,
                "parecer": parecer_ia,
            },

            # Produção
            "producao": {
                "producao_diaria_total": round(analise.producao_diaria_total, 1),
                "producao_anual_total": round(analise.producao_anual_total, 0),
                "producao_por_animal_ano": round(analise.producao_por_animal_ano, 0),
                "margem_producao_percent": round(analise.margem_producao, 1),
                "unidade": "litros/dia" if tipo_rebanho == "gado_leite" else "kg/dia"
            },

            # Economia
            "analise_economica": {
                "receita_bruta_anual": round(analise.receita_bruta_anual, 2),
                "custos_totais_anual": round(analise.custos_totais_anual, 2),
                "lucro_liquido_anual": round(analise.lucro_liquido_anual, 2),
                "margem_percentual": round(analise.margem_lucro_percent, 1),
                "roi_percentual": round(analise.roi_percent, 1),
                "ponto_equilibrio": round(analise.ponto_equilibrio_unidades, 0),
            },

            # Indicadores Zootécnicos
            "indicadores_zootecnicos": {
                "indice_conversao_alimentar": round(analise.indice_conversao_alimentar, 2),
                "ganho_peso_kg_dia": round(analise.ganho_peso_kg_dia, 3) if tipo_rebanho == "gado_corte" else None,
                "indice_fertilidade_real": round(indice_fertilidade, 2),
                "taxa_mortalidade": round(taxa_mortalidade_percent, 1)
            },

            # Saúde Animal
            "saude_animal": {
                "probabilidade_doenca": analise.probabilidade_doenca,
                "mastite_risco": analise.mastite_risco if tipo_rebanho == "gado_leite" else "n/a",
                "vacinacao_atualizada": vacinacao_atualizada,
                "sanidade_geral": sanidade_geral,
                "historico_doencas_area": historico_doencas_area
            },

            # Pontos Críticos
            "pontos_criticos": analise.pontos_criticos,

            # Recomendações
            "recomendacoes_manejo": analise.recomendacoes,

            # Alertas
            "alertas": analise.alertas,

            # Oportunidades
            "oportunidades": analise.oportunidades,

            # Investimentos Recomendados
            "investimentos_sugeridos": [
                {
                    "tipo": inv.get("tipo", ""),
                    "custo_investimento": inv.get("custo", 0),
                    "roi_meses": inv.get("roi_meses", 0),
                    "aumento_producao_percent": inv.get("aumento_producao_percent", 0),
                    "reducao_perdas_percent": inv.get("reducao_perdas_percent", 0)
                }
                for inv in analise.investimentos_recomendados
            ],

            # Projeção de Melhoria
            "projecao_otimizada": {
                "producao_atual": round(analise.producao_anual_total, 0),
                "producao_otimizada": round(analise.potencial_producao_otimizada, 0),
                "ganho_potencial_anual": round(analise.ganho_potencial_anual, 0),
                "percentual_melhoria": round((analise.ganho_potencial_anual / analise.producao_anual_total * 100) if analise.producao_anual_total > 0 else 0, 1)
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
                    "recomendacao": "Forneça dados de produção, saúde animal e manejo mais completos"
                }
            )
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao analisar rebanho: {str(e)}"
        )

@router.get("/benchmarks/{tipo_rebanho}")
def obter_benchmarks(tipo_rebanho: str):
    """
    Obter benchmarks de produção por tipo de rebanho
    """
    benchmarks = {
        "gado_leite": {
            "producao_litros_dia": 15,
            "custo_alimentacao_dia": 15.0,
            "preco_litro_medio": 1.50,
            "margem_esperada_percent": 35,
            "roi_esperado_percent": 45,
            "mastite_incidencia_media": 10.0
        },
        "gado_corte": {
            "ganho_peso_dia_kg": 1.2,
            "custo_alimentacao_dia": 18.0,
            "preco_carne_kg": 20.0,
            "margem_esperada_percent": 25,
            "roi_esperado_percent": 30,
            "ciclo_dias": 450
        },
        "ovino": {
            "producao_leite_dia": 1.5,
            "custo_alimentacao_dia": 3.0,
            "preco_leite_litro": 2.5,
            "margem_esperada_percent": 30,
            "roi_esperado_percent": 40
        },
        "suíno": {
            "ganho_peso_dia_kg": 0.7,
            "custo_alimentacao_dia": 5.0,
            "preco_carne_kg": 12.0,
            "margem_esperada_percent": 20,
            "roi_esperado_percent": 35,
            "ciclo_dias": 150
        }
    }

    return benchmarks.get(tipo_rebanho.lower(), {})

@router.get("/guia/{tipo_rebanho}")
def guia_producao(tipo_rebanho: str):
    """
    Guia de boas práticas por tipo de rebanho
    """
    guias = {
        "gado_leite": {
            "recomendacoes": [
                "Ordenha 2-3x ao dia (mínimo 2x)",
                "Manter mastite <5% em rebanho",
                "Pastagem de qualidade com leguminosas",
                "Sal mineral com iodo e enxofre",
                "Vacinação contra brucelose e tuberculose",
                "Genética melhorada (HolaNelore ou Holandesa pura)",
                "Manejo reprodutivo com IA ou monta",
                "Descarte de matrizes improdutivas"
            ],
            "investimentos_criticos": [
                {"tipo": "Sistema de ordenha", "prioridade": "alta"},
                {"tipo": "Resfriador de leite", "prioridade": "alta"},
                {"tipo": "Pastagem melhorada", "prioridade": "media"},
                {"tipo": "Cocho para suplementação", "prioridade": "media"}
            ]
        },
        "gado_corte": {
            "recomendacoes": [
                "Raça rústica adaptada (Nelore, Braford)",
                "Pastagem nativa ou cultivada",
                "Sal mineral com fósforo e enxofre",
                "Manejo de pragas (berne, carrapato)",
                "Vacinação contra febre aftosa",
                "Desverminação periódica",
                "Suplementação proteica na seca",
                "Seleção de touros melhoradores"
            ],
            "investimentos_criticos": [
                {"tipo": "Pastagem cultivada", "prioridade": "alta"},
                {"tipo": "Infraestrutura (curral, balança)", "prioridade": "media"},
                {"tipo": "Sala de medicação", "prioridade": "media"}
            ]
        }
    }

    return guias.get(tipo_rebanho.lower(), {"recomendacoes": [], "investimentos_criticos": []})

@router.post("/calculadora-custo")
def calcular_custo_producao(
    tipo_rebanho: str,
    quantidade_animais: int,
    dias_producao_ano: int = 330,
    custo_alimentacao_dia: float = 15.0,
    custo_infraestrutura_mes: float = 2000.0,
    custo_veterinario_mes: float = 800.0,
    custo_mao_obra_mes: float = 3000.0
):
    """
    Calculadora de custos de produção
    """

    custo_alimentacao_anual = (custo_alimentacao_dia * quantidade_animais * dias_producao_ano)
    custo_infraestrutura_anual = custo_infraestrutura_mes * 12
    custo_veterinario_anual = custo_veterinario_mes * 12
    custo_mao_obra_anual = custo_mao_obra_mes * 12

    custo_total_anual = (
        custo_alimentacao_anual +
        custo_infraestrutura_anual +
        custo_veterinario_anual +
        custo_mao_obra_anual
    )

    custo_por_animal_dia = (custo_total_anual / quantidade_animais / dias_producao_ano) if quantidade_animais > 0 else 0

    return {
        "custo_alimentacao_anual": round(custo_alimentacao_anual, 2),
        "custo_infraestrutura_anual": round(custo_infraestrutura_anual, 2),
        "custo_veterinario_anual": round(custo_veterinario_anual, 2),
        "custo_mao_obra_anual": round(custo_mao_obra_anual, 2),
        "custo_total_anual": round(custo_total_anual, 2),
        "custo_por_animal_dia": round(custo_por_animal_dia, 2),
        "custo_unitario_producao": round(custo_total_anual / quantidade_animais / dias_producao_ano if quantidade_animais > 0 else 0, 4)
    }
