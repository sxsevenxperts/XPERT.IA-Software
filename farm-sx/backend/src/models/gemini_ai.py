"""
Google Gemini AI Integration - Geração de Pareceres Inteligentes (Grátis)
Módulo compartilhado para Agricultura e Pecuária
"""
import os
import google.generativeai as genai
from typing import Optional

MODELOS_DISPONIVEIS = {
    "gemini": "gemini-2.0-flash",
    "gemini-flash": "gemini-2.0-flash",
    "gemini-pro": "gemini-1.5-pro",
}

MODELO_PADRAO = "gemini-2.0-flash"  # Gratuito e muito rápido


def _get_cliente() -> genai.GenerativeModel:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY não configurada no ambiente.")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name=MODELO_PADRAO)


def _resolver_modelo(modelo: Optional[str]) -> str:
    if not modelo:
        return MODELO_PADRAO
    return MODELOS_DISPONIVEIS.get(modelo.lower(), MODELO_PADRAO)


def gerar_parecer_agricultura(
    cultura: str,
    municipio: str,
    area_hectares: float,
    analise: dict,
    modelo: Optional[str] = None,
) -> str:
    """
    Gera parecer executivo com Gemini para análise agrícola.
    """
    modelo_id = _resolver_modelo(modelo)
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    cliente = genai.GenerativeModel(model_name=modelo_id)

    prompt = f"""Você é um especialista em agricultura brasileira e análise preditiva agrícola.
Com base nos dados de análise abaixo, gere um PARECER EXECUTIVO profissional, detalhado e acionável em português.

## DADOS DA ANÁLISE

**Cultura:** {cultura}
**Município:** {municipio}
**Área:** {area_hectares} hectares

**Indicadores Econômicos:**
- Receita estimada: R$ {analise.get('receita_prevista', 0):,.2f}
- Lucro líquido: R$ {analise.get('lucro_previsto', 0):,.2f}
- Margem: {analise.get('margem_lucro', 0):.1f}%
- ROI: {analise.get('roi_esperado', 0):.1f}%

**Produção:**
- Produtividade estimada: {analise.get('produtividade_prevista', 0):.2f} ton/ha
- Quantidade prevista: {analise.get('quantidade_colheita_prevista', 0):,.0f} kg

**Perdas Esperadas:**
- Climática: {analise.get('perda_climatica_percent', 0):.1f}%
- Pragas: {analise.get('perda_pragas_percent', 0):.1f}%
- Doenças: {analise.get('perda_doencas_percent', 0):.1f}%
- Total: {analise.get('perda_total_esperada_percent', 0):.1f}%

**Riscos:**
- Risco climático: {analise.get('risco_clima', 'medio')}
- Risco de mercado: {analise.get('risco_mercado', 'medio')}
- Risco econômico: {analise.get('risco_economia', 'medio')}
- Risco geral: {analise.get('risco_geral', 'medio')}

**Assertividade da análise:** {analise.get('assertividade', 90):.1f}%

**Datas Recomendadas:**
- Plantio: {analise.get('data_plantio_recomendada', 'N/A')}
- Colheita: {analise.get('data_colheita_prevista', 'N/A')}
- Melhor mês de venda: {analise.get('mes_melhor_venda', 6)}

**Pragas esperadas:** {', '.join(analise.get('pragas_esperadas', [])[:3])}
**Doenças esperadas:** {', '.join(analise.get('doencas_esperadas', [])[:3])}

**Oportunidades identificadas:** {len(analise.get('oportunidades', []))} oportunidades
**Alertas ativos:** {len(analise.get('alertas', []))} alertas

## FORMATO DO PARECER

Estruture o parecer com estas seções:

1. **CONCLUSÃO EXECUTIVA** (2-3 frases diretas sobre viabilidade)
2. **ANÁLISE DE VIABILIDADE** (econômica e produtiva)
3. **PRINCIPAIS RISCOS** (top 3 com ações preventivas)
4. **OPORTUNIDADES IDENTIFICADAS** (top 3 com potencial de ganho)
5. **PLANO DE AÇÃO PRIORITÁRIO** (próximos 30-60-90 dias)
6. **RECOMENDAÇÃO FINAL** (plantar ou não plantar, com justificativa)

Seja direto, específico e orientado a ação. Use linguagem técnica mas acessível ao agricultor."""

    try:
        resposta = cliente.generate_content(prompt, stream=False)
        return resposta.text.strip()
    except Exception as e:
        raise ValueError(f"Erro ao gerar parecer com Gemini: {str(e)}")


def gerar_parecer_pecuaria(
    tipo_rebanho: str,
    quantidade_animais: int,
    raca_predominante: str,
    analise: dict,
    modelo: Optional[str] = None,
) -> str:
    """
    Gera parecer executivo com Gemini para análise de pecuária.
    """
    modelo_id = _resolver_modelo(modelo)
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    cliente = genai.GenerativeModel(model_name=modelo_id)

    prompt = f"""Você é um especialista em pecuária brasileira, zootecnia e análise econômica de rebanhos.
Com base nos dados de análise abaixo, gere um PARECER EXECUTIVO profissional, detalhado e acionável em português.

## DADOS DA ANÁLISE

**Tipo de rebanho:** {tipo_rebanho}
**Quantidade de animais:** {quantidade_animais}
**Raça predominante:** {raca_predominante}

**Indicadores Econômicos:**
- Receita bruta anual: R$ {analise.get('receita_bruta_anual', 0):,.2f}
- Custos totais anuais: R$ {analise.get('custos_totais_anual', 0):,.2f}
- Lucro líquido anual: R$ {analise.get('lucro_liquido_anual', 0):,.2f}
- Margem: {analise.get('margem_lucro_percent', 0):.1f}%
- ROI: {analise.get('roi_percent', 0):.1f}%

**Produção:**
- Produção diária total: {analise.get('producao_diaria_total', 0):.1f} unidades
- Produção anual total: {analise.get('producao_anual_total', 0):,.0f} unidades
- Margem de produção: {analise.get('margem_producao', 0):.1f}%

**Saúde Animal:**
- Probabilidade de doença: {analise.get('probabilidade_doenca', 'media')}
- Risco de mastite: {analise.get('mastite_risco', 'n/a')}
- Sanidade geral: {analise.get('sanidade_geral', 'boa')}

**Assertividade da análise:** {analise.get('assertividade', 90):.1f}%

**Pontos críticos:** {len(analise.get('pontos_criticos', []))} identificados
**Oportunidades:** {len(analise.get('oportunidades', []))} identificadas
**Alertas:** {len(analise.get('alertas', []))} ativos

**Projeção otimizada:**
- Produção atual: {analise.get('producao_anual_total', 0):,.0f}
- Produção otimizada possível: {analise.get('potencial_producao_otimizada', 0):,.0f}
- Ganho potencial: {analise.get('ganho_potencial_anual', 0):,.0f} unidades/ano

## FORMATO DO PARECER

Estruture o parecer com estas seções:

1. **CONCLUSÃO EXECUTIVA** (2-3 frases diretas sobre desempenho do rebanho)
2. **ANÁLISE ZOOTÉCNICA** (produtividade, eficiência e indicadores-chave)
3. **ANÁLISE ECONÔMICA** (rentabilidade, custos críticos, ROI)
4. **SAÚDE E SANIDADE** (riscos, prevenção, calendário sanitário)
5. **OPORTUNIDADES DE MELHORIA** (top 3 com ROI estimado)
6. **PLANO DE AÇÃO PRIORITÁRIO** (próximos 30-60-90 dias)
7. **RECOMENDAÇÃO FINAL** (manter, expandir ou reconverter o rebanho)

Seja direto, específico e orientado a resultados. Use linguagem técnica mas acessível ao pecuarista."""

    try:
        resposta = cliente.generate_content(prompt, stream=False)
        return resposta.text.strip()
    except Exception as e:
        raise ValueError(f"Erro ao gerar parecer com Gemini: {str(e)}")
