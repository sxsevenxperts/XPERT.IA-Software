"""
Rotas para Qualidade, Benchmarking e Tecnologias
Estudos de qualidade, fornecedores, preços e novas tecnologias
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.models.quality_and_market_engine import QualityAndMarketEngine
from typing import List, Optional

router = APIRouter(prefix="/api/v1/qualidade-mercado", tags=["quality-market"])

quality_engine = QualityAndMarketEngine()


@router.get("/estudos-qualidade/{tipo_atividade}")
def listar_estudos_qualidade(tipo_atividade: str):
    """
    Lista estudos sobre o que melhora qualidade

    Tipo de atividade: "agricultura" ou "pecuária"
    """

    if tipo_atividade == "agricultura":
        estudos = quality_engine.estudos_agricultura
    elif tipo_atividade == "pecuária":
        estudos = quality_engine.estudos_pecuaria
    else:
        raise HTTPException(status_code=400, detail="Tipo de atividade inválido")

    return {
        "tipo_atividade": tipo_atividade,
        "total_estudos": len(estudos),
        "estudos": [
            {
                "titulo": e.titulo,
                "descricao": e.descricao,
                "produto": e.produto,
                "categoria": e.categoria,
                "melhoria_percentual": e.melhoria_percentual,
                "tempo_implementacao_dias": e.tempo_implementacao_dias,
                "custo_implementacao": e.custo_implementacao,
                "roi_meses": e.roi_meses,
                "passos": e.passos_implementacao,
                "referencias": e.referencias,
                "pesquisas_relacionadas": e.pesquisas_relacionadas
            }
            for e in estudos
        ]
    }


@router.get("/fornecedores/{tipo_insumo}")
def listar_fornecedores(tipo_insumo: Optional[str] = None, regiao: Optional[str] = None):
    """
    Lista fornecedores de insumos com links de compra

    Tipos de insumo: sementes, fertilizantes, defensivos, medicamentos, rações
    Regiões: Nordeste, Norte, Centro-Oeste, Sudeste, Sul
    """

    fornecedores = quality_engine.fornecedores

    if tipo_insumo:
        fornecedores = [f for f in fornecedores if f.tipo_insumo == tipo_insumo]

    if regiao:
        fornecedores = [f for f in fornecedores if f.regiao == regiao]

    return {
        "total_fornecedores": len(fornecedores),
        "filtros": {
            "tipo_insumo": tipo_insumo,
            "regiao": regiao
        },
        "fornecedores": [
            {
                "nome": f.nome,
                "tipo_insumo": f.tipo_insumo,
                "produtos": f.produtos,
                "contato": {
                    "telefone": f.telefone,
                    "email": f.email,
                    "whatsapp": f.whatsapp,
                    "website": f.website
                },
                "localizacao": {
                    "cidade": f.cidade,
                    "estado": f.estado,
                    "regiao": f.regiao
                },
                "avaliacao": f.avaliacao,
                "reviews": f.reviews,
                "tempo_entrega_dias": f.tempo_entrega_dias,
                "links": {
                    "catalogo": f.link_catalogo,
                    "compra": f.link_compra,
                    "whatsapp": f.link_whatsapp
                }
            }
            for f in fornecedores
        ]
    }


@router.get("/benchmarks/{produto}")
def obter_benchmark_preco(produto: Optional[str] = None):
    """
    Benchmarking de preços por região com links de melhores fornecedores

    Exemplos de produtos:
    - "Sementes Milho (saca 60kg)"
    - "Leite Tipo A (litro)"
    - "NPK 20-05-20 (ton)"
    """

    benchmarks = quality_engine.benchmarks

    if produto:
        benchmarks = [b for b in benchmarks if b.produto.lower() == produto.lower()]

    if not benchmarks:
        raise HTTPException(status_code=404, detail="Nenhum benchmark encontrado para este produto")

    return {
        "total_benchmarks": len(benchmarks),
        "benchmarks": [
            {
                "produto": b.produto,
                "unidade": b.unidade,
                "precos_por_regiao": {
                    "nordeste": b.preco_nordeste,
                    "norte": b.preco_norte,
                    "centro_oeste": b.preco_centro_oeste,
                    "sudeste": b.preco_sudeste,
                    "sul": b.preco_sul
                },
                "preco_medio_brasil": b.preco_medio_brasil,
                "variacao_percentual": b.variacao_percentual,
                "tendencia": b.tendencia,
                "mudanca_ultimos_30_dias_percent": b.mudanca_ultimos_30_dias,
                "melhores_fornecedores": b.melhores_fornecedores,
                "data_atualizacao": b.data_atualizacao,
                "fonte": b.fonte
            }
            for b in benchmarks
        ]
    }


@router.get("/tecnologias/{tipo_atividade}")
def listar_tecnologias(tipo_atividade: str, categoria: Optional[str] = None):
    """
    Lista tecnologias disponíveis com estudos de caso e fornecedores

    Tipo de atividade: "agricultura" ou "pecuária"
    Categorias: irrigação, drones, iot, genética, manejo, automação
    """

    if tipo_atividade not in ["agricultura", "pecuária"]:
        raise HTTPException(status_code=400, detail="Tipo de atividade inválido")

    tecnologias = [t for t in quality_engine.tecnologias if t.tipo_atividade == tipo_atividade]

    if categoria:
        tecnologias = [t for t in tecnologias if t.categoria == categoria]

    return {
        "tipo_atividade": tipo_atividade,
        "categoria_filtrada": categoria,
        "total_tecnologias": len(tecnologias),
        "tecnologias": [
            {
                "nome": t.nome,
                "categoria": t.categoria,
                "descricao": t.descricao,
                "beneficios": t.beneficios,
                "impactos": {
                    "aumento_produtividade_percent": t.aumento_produtividade_percent,
                    "reducao_custos_percent": t.reducao_custos_percent,
                    "melhoria_qualidade_percent": t.melhoria_qualidade_percent
                },
                "investimento": {
                    "custo_inicial": t.custo_inicial,
                    "custo_manutencao_anual": t.custo_manutencao_anual,
                    "tempo_instalacao_dias": t.tempo_instalacao_dias,
                    "roi_meses": t.roi_meses
                },
                "requisitos_minimos": t.requisitos_minimos,
                "compatibilidade": t.compatibilidade,
                "fornecedores": t.fornecedores,
                "estudos_caso": t.estudos_caso,
                "avaliacao": t.avaliacao,
                "reviews": t.reviews
            }
            for t in tecnologias
        ]
    }


@router.post("/recomendacoes-personalizadas")
def obter_recomendacoes_personalizadas(
    agricultor_id: int,
    tipo_atividade: str,
    problemas: List[str],
    orcamento_disponivel: float,
    area_hectares: Optional[float] = None,
    quantidade_animais: Optional[int] = None
):
    """
    Gera recomendações personalizadas de:
    - Estudos de qualidade relevantes
    - Fornecedores de insumos recomendados
    - Benchmarks de preços comparativos
    - Tecnologias adequadas
    - Plano de ação com cronograma

    Exemplo de problemas:
    - ["Alta incidência de lagarta-do-cartucho", "Baixa qualidade de milho"]
    - ["Mastite recorrente", "Baixa produção de leite"]
    """

    recomendacoes = quality_engine.gerar_recomendacoes(
        agricultor_id=agricultor_id,
        tipo_atividade=tipo_atividade,
        problemas_identificados=problemas,
        orcamento_disponivel=orcamento_disponivel,
        area_hectares=area_hectares,
        quantidade_animais=quantidade_animais
    )

    return {
        "agricultor_id": agricultor_id,
        "tipo_atividade": tipo_atividade,
        "problemas_identificados": recomendacoes.problemas,

        # Estudos de Qualidade
        "estudos_qualidade_recomendados": [
            {
                "titulo": e.titulo,
                "descricao": e.descricao,
                "melhoria_percentual": e.melhoria_percentual,
                "tempo_implementacao_dias": e.tempo_implementacao_dias,
                "custo_implementacao": e.custo_implementacao,
                "roi_meses": e.roi_meses,
                "passos": e.passos_implementacao
            }
            for e in recomendacoes.estudos_qualidade
        ],

        # Insumos/Fornecedores
        "fornecedores_recomendados": [
            {
                "nome": f.nome,
                "tipo_insumo": f.tipo_insumo,
                "contato": {
                    "telefone": f.telefone,
                    "email": f.email,
                    "whatsapp": f.whatsapp
                },
                "links": {
                    "catalogo": f.link_catalogo,
                    "compra": f.link_compra,
                    "whatsapp": f.link_whatsapp
                },
                "avaliacao": f.avaliacao
            }
            for f in recomendacoes.insumos_recomendados
        ],

        # Tecnologias
        "tecnologias_recomendadas": [
            {
                "nome": t.nome,
                "categoria": t.categoria,
                "beneficios": t.beneficios,
                "impactos": {
                    "aumento_produtividade_percent": t.aumento_produtividade_percent,
                    "reducao_custos_percent": t.reducao_custos_percent,
                    "melhoria_qualidade_percent": t.melhoria_qualidade_percent
                },
                "investimento": {
                    "custo_inicial": t.custo_inicial,
                    "roi_meses": t.roi_meses
                },
                "fornecedores": t.fornecedores,
                "estudos_caso": t.estudos_caso
            }
            for t in recomendacoes.tecnologias_recomendadas
        ],

        # Benchmarks
        "benchmarks_mercado": [
            {
                "produto": b.produto,
                "preco_medio_brasil": b.preco_medio_brasil,
                "tendencia": b.tendencia,
                "melhores_fornecedores": b.melhores_fornecedores
            }
            for b in recomendacoes.benchmarks_relevantes
        ],

        # Plano de Ação
        "plano_acao": recomendacoes.plano_acao,

        # Resumo
        "prioridade_geral": recomendacoes.prioridade_geral,
        "urgencia": recomendacoes.urgencia
    }


@router.get("/indicadores-qualidade/{tipo_atividade}")
def obter_indicadores_qualidade(tipo_atividade: str):
    """
    Retorna indicadores e métricas de qualidade por tipo de atividade
    """

    if tipo_atividade == "agricultura":
        indicadores = {
            "produto": "Grãos/Hortaliças",
            "metricas_qualidade": [
                {
                    "metrica": "Pureza Varietalvar",
                    "alvo": "≥98%",
                    "importancia": "Crítica",
                    "impacto_preco": "+5% premium"
                },
                {
                    "metrica": "Umidade",
                    "alvo": "12-14%",
                    "importancia": "Crítica",
                    "impacto_preco": "-2% por %acima"
                },
                {
                    "metrica": "Matérias Estranhas",
                    "alvo": "<1%",
                    "importancia": "Alta",
                    "impacto_preco": "-3% por %"
                },
                {
                    "metrica": "Germinação",
                    "alvo": "≥85%",
                    "importancia": "Alta",
                    "impacto_preco": "+2% por 5%acima"
                },
                {
                    "metrica": "Tamanho/Formato Uniforme",
                    "alvo": ">90%",
                    "importancia": "Média",
                    "impacto_preco": "+3% premium"
                }
            ],
            "fatores_melhora": [
                {"fator": "Adubação balanceada", "impacto": "+15% qualidade", "custo": "R$ 2.500"},
                {"fator": "Controle fitossanitário", "impacto": "+20% qualidade", "custo": "R$ 3.000"},
                {"fator": "Irrigação de precisão", "impacto": "+18% qualidade", "custo": "R$ 8.000"},
                {"fator": "Variedades premium", "impacto": "+12% qualidade", "custo": "R$ 1.500"}
            ]
        }
    else:  # pecuária
        indicadores = {
            "produto": "Leite/Carne",
            "metricas_qualidade": [
                {
                    "metrica": "CCS (Contagem de Células Somáticas)",
                    "alvo": "<250 mil cel/mL",
                    "importancia": "Crítica",
                    "impacto_preco": "+8% premium vs -15% penalidade"
                },
                {
                    "metrica": "CBT (Contagem Bacteriana Total)",
                    "alvo": "<30 mil UFC/mL",
                    "importancia": "Crítica",
                    "impacto_preco": "+10% premium"
                },
                {
                    "metrica": "Composição (Gordura/Proteína)",
                    "alvo": ">3.6% gordura, >3.2% proteína",
                    "importancia": "Alta",
                    "impacto_preco": "+5-15% premium"
                },
                {
                    "metrica": "Marmorização (carne)",
                    "alvo": "Score ≥4",
                    "importancia": "Alta",
                    "impacto_preco": "+20-40% premium"
                },
                {
                    "metrica": "Maciez (carne)",
                    "alvo": "<50 kgf",
                    "importancia": "Média",
                    "impacto_preco": "+15% premium"
                }
            ],
            "fatores_melhora": [
                {"fator": "Nutrição balanceada", "impacto": "+15% CCS", "custo": "R$ 4.000"},
                {"fator": "Prevenção de mastite", "impacto": "+35% qualidade", "custo": "R$ 5.000"},
                {"fator": "Genética melhorada", "impacto": "+22% composição", "custo": "R$ 15.000"},
                {"fator": "Monitoramento sanitário", "impacto": "+25% qualidade", "custo": "R$ 2.000"}
            ]
        }

    return indicadores


@router.get("/melhores-praticas/{tipo_atividade}")
def obter_melhores_praticas(tipo_atividade: str):
    """
    Retorna melhores práticas para melhorar qualidade e reduzir perdas
    """

    if tipo_atividade == "agricultura":
        praticas = {
            "tema": "Redução de Perdas Agrícolas",
            "perdas_tipicas": {
                "clima": "5-6.5%",
                "pragas": "5-11%",
                "doencas": "3-6%",
                "colheita": "1-3%",
                "total_esperado": "14-26.5%"
            },
            "praticas_essenciais": [
                {
                    "pratica": "Monitoramento Integrado de Pragas (MIP)",
                    "descricao": "Identificar pragas em tempo real para aplicação eficiente",
                    "reducao_perda": "Até 8%",
                    "custo": "R$ 2.000-3.000/safra",
                    "tecnologias": ["Armadilhas luminosas", "Scouts semanais", "Apps de identificação"]
                },
                {
                    "pratica": "Manejo Integrado de Doenças (MID)",
                    "descricao": "Rotação, variedades resistentes e fungicidas preventivos",
                    "reducao_perda": "Até 6%",
                    "custo": "R$ 3.000-4.000/safra",
                    "tecnologias": ["Forecasting", "Variedades BRS", "Drones para aplicação"]
                },
                {
                    "pratica": "Colheita Otimizada no Ponto Ideal",
                    "descricao": "Colher no melhor estágio de maturação minimiza perdas",
                    "reducao_perda": "Até 3%",
                    "custo": "R$ 1.000-1.500/safra",
                    "tecnologias": ["Amostragem de umidade", "Calendário MIP", "Máquinas calibradas"]
                }
            ]
        }
    else:  # pecuária
        praticas = {
            "tema": "Melhoria de Qualidade e Produção",
            "indicadores_atuais": {
                "mastite_incidencia": "8-10%",
                "mortalidade": "2-3%",
                "infertilidade": "15-20%"
            },
            "praticas_essenciais": [
                {
                    "pratica": "Protocolo Rigoroso de Higiene na Ordenha",
                    "descricao": "DeLaval/Eticur para reduzir CCS drasticamente",
                    "melhoria": "CCS < 250 mil cel/mL",
                    "custo": "R$ 5.000/implantação",
                    "resultado_preco": "+8% no preço do leite"
                },
                {
                    "pratica": "Nutrição Balanceada com Ômega-3",
                    "descricao": "Aumentar gordura e proteína do leite",
                    "melhoria": "+0.3% gordura, +0.2% proteína",
                    "custo": "R$ 4.000/ano",
                    "resultado_preco": "+12% no preço do leite"
                },
                {
                    "pratica": "Genética Melhorada com Inseminação",
                    "descricao": "Cruzamentos estratégicos para marmorização",
                    "melhoria": "Marmorização +0.5 pontos",
                    "custo": "R$ 15.000/ano",
                    "resultado_preco": "+25% no preço da carne"
                }
            ]
        }

    return praticas
