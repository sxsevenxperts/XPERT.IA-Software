from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.data.collectors.economic_collector import EconomicCollector
from typing import Optional

router = APIRouter(prefix="/api/v1/economics", tags=["economics"])

economic = EconomicCollector()

@router.get("/ipca")
def get_ipca(
    mes: Optional[int] = None,
    ano: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Obter IPCA (Índice de Preços ao Consumidor Amplo)"""
    ipca = economic.obter_ipca(mes, ano)
    return ipca

@router.get("/selic")
def get_selic(db: Session = Depends(get_db)):
    """Obter taxa SELIC"""
    return economic.obter_selic()

@router.get("/desemprego")
def get_desemprego(db: Session = Depends(get_db)):
    """Obter taxa de desemprego"""
    return economic.obter_desemprego()

@router.get("/inflacao-alimentos")
def get_inflacao_alimentos(db: Session = Depends(get_db)):
    """Obter inflação específica de alimentos"""
    return economic.obter_inflacao_alimentos()

@router.get("/cambio")
def get_taxa_cambio(db: Session = Depends(get_db)):
    """Obter taxa de câmbio USD/BRL"""
    return economic.obter_taxa_cambio()

@router.get("/cenarios")
def get_cenarios_economicos(db: Session = Depends(get_db)):
    """Obter cenários econômicos"""
    return economic.obter_cenarios_economicos()

@router.post("/impacto-inflacao")
def calcular_impacto_inflacao(
    custo_producao: float,
    preco_venda: float,
    db: Session = Depends(get_db)
):
    """Calcular impacto da inflação na margem de lucro"""
    return economic.calcular_impacto_inflacao(custo_producao, preco_venda)

@router.get("/previsoes-safra")
def get_previsoes_safra(db: Session = Depends(get_db)):
    """Obter previsões de safra"""
    return economic.obter_previsoes_safra()

@router.post("/recomendacao-financiamento")
def get_recomendacao_financiamento(
    area_hectares: float,
    custo_producao: float,
    renda_estimada: float,
    db: Session = Depends(get_db)
):
    """Recomendar opção de financiamento"""
    return economic.recomendacao_financiamento(
        area_hectares, custo_producao, renda_estimada
    )

@router.get("/historico-indicadores")
def get_historico_indicadores(
    meses: int = 12,
    db: Session = Depends(get_db)
):
    """Obter histórico de indicadores econômicos"""
    return economic.obter_historico_economico(meses)

@router.get("/dashboard-economia")
def get_dashboard_economia(db: Session = Depends(get_db)):
    """Painel completo de indicadores econômicos"""

    ipca = economic.obter_ipca()
    selic = economic.obter_selic()
    desemprego = economic.obter_desemprego()
    inflacao_alim = economic.obter_inflacao_alimentos()
    cambio = economic.obter_taxa_cambio()
    cenarios = economic.obter_cenarios_economicos()

    return {
        'data_atualizacao': economic.obter_ipca()['mes'],
        'indicadores': {
            'ipca': ipca,
            'selic': selic,
            'desemprego': desemprego,
            'inflacao_alimentos': inflacao_alim,
            'cambio': cambio
        },
        'cenarios': cenarios,
        'alertas': [
            {
                'tipo': 'info',
                'mensagem': f"IPCA acumulado em 12 meses: {ipca['ipca_12_meses']}%",
                'urgencia': 'media'
            } if ipca['ipca_12_meses'] > 5 else None,
            {
                'tipo': 'aviso',
                'mensagem': f"Taxa SELIC em {selic['taxa_selic']}%. Financiamentos mais caros",
                'urgencia': 'media'
            } if selic['taxa_selic'] > 10 else None,
            {
                'tipo': 'info',
                'mensagem': f"Inflação de alimentos: {inflacao_alim['inflacao_alimentos_12_meses']}% em 12 meses",
                'urgencia': 'media'
            }
        ]
    }

@router.get("/analise-competitividade")
def analise_competitividade(
    cultura: str,
    area_hectares: float = 10,
    produtividade: float = 3.5,
    preco_venda: float = 1000,
    db: Session = Depends(get_db)
):
    """Analisar competitividade da cultura no mercado atual"""

    ipca = economic.obter_ipca()
    selic = economic.obter_selic()
    inflacao_alim = economic.obter_inflacao_alimentos()

    # Calcular custos ajustados
    custo_base = area_hectares * 1500  # Custo médio por hectare

    # Ajustar por inflação
    inflacao_mes = ipca['ipca_mensal'] / 100
    custo_ajustado = custo_base * (1 + inflacao_mes * 6)  # Próximos 6 meses

    # Estimar receita
    quantidade_produzida = area_hectares * produtividade * 1000  # kg
    receita_estimada = quantidade_produzida * (preco_venda / 1000)

    # Lucro
    lucro = receita_estimada - custo_ajustado

    # Análise
    roi = (lucro / custo_ajustado * 100) if custo_ajustado > 0 else 0

    competitividade = 'alta' if roi > 30 else 'media' if roi > 10 else 'baixa'

    return {
        'cultura': cultura,
        'area_hectares': area_hectares,
        'competitividade': competitividade,
        'analise': {
            'custo_producao_estimado': round(custo_ajustado, 2),
            'receita_estimada': round(receita_estimada, 2),
            'lucro_estimado': round(lucro, 2),
            'roi': round(roi, 2),
            'ponto_equilibrio_kg': round(custo_ajustado * 1000 / preco_venda, 0) if preco_venda > 0 else 0
        },
        'context_economico': {
            'inflacao_alimentos': f"{inflacao_alim['inflacao_alimentos_mes']}% mês",
            'selic': f"{selic['taxa_selic']}%",
            'ambiente': 'Desfavorável' if inflacao_alim['inflacao_alimentos_12_meses'] > 8 else 'Neutro' if inflacao_alim['inflacao_alimentos_12_meses'] > 5 else 'Favorável'
        }
    }
