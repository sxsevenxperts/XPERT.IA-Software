import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json

@dataclass
class LivestockVariableSet:
    """Conjunto de variáveis para análise de pecuária"""

    # Rebanho (5)
    tipo_rebanho: str  # "gado_leite", "gado_corte", "ovino", "suíno"
    quantidade_animais: int
    peso_medio_kg: float
    raca_predominante: str  # "Holandesa", "Nelore", "Angus"
    idade_media_meses: float

    # Produção (4)
    producao_diaria: float  # L/dia (leite) ou kg/dia (ganho peso carne)
    dias_produtivos_ano: int  # 365, 330, etc
    indice_fertilidade: float  # 0.70-0.95
    taxa_mortalidade_percent: float  # % de perda ao ano

    # Nutrição (5)
    custos_alimentacao_dia_animal: float  # R$/animal/dia
    qualidade_pastagem: str  # "baixa", "media", "alta"
    suplementacao_tipo: str  # "nenhuma", "sal_mineral", "concentrado", "completa"
    agua_disponivel: str  # "suficiente", "precaria"
    saude_nutricional: str  # "deficiente", "adequada", "excelente"

    # Saúde Animal (5)
    vacinacao_atualizada: bool
    historico_doencas_area: str  # "baixa", "media", "alta"
    mastite_incidencia_percent: float  # % animais acometidos (leite)
    sanidade_geral: str  # "boa", "media", "ruim"
    ultimo_tratamento_dias: int

    # Mercado (4)
    preco_leite_litro: float = 1.50  # R$/L
    preco_carne_kg: float = 20.0  # R$/kg
    tendencia_preco: str = "estavel"  # "alta", "estavel", "baixa"
    volatilidade_preco: float = 0.1

    # Economia (4)
    custos_infraestrutura_mes: float  # Ordenha, energia, agua
    custos_veterinarios_mes: float  # Vacina, medicamentos
    mao_obra_custos_mes: float  # Salários/familiar
    custo_credito_taxa_selic: float = 0.105  # % ao ano

    # Clima (4)
    temperatura_media: float  # °C
    umidade_relativa: float  # %
    precipitacao_mm: float
    qualidade_agua_pocos: str  # "boa", "media", "ruim"

    # Manejo (4)
    sistema_criacao: str  # "extensivo", "semi_intensivo", "intensivo"
    frequencia_ordenha_dia: int = 2  # 1, 2 ou 3 (leite)
    genetica_melhorada: bool = False
    participacao_programas_melhoramento: bool = False

@dataclass
class LivestockAnalysis:
    """Resultado da análise de pecuária integrada"""
    tipo_rebanho: str
    quantidade_animais: int

    # Assertividade
    assertividade: float  # 0-100%
    confianca_geral: float
    variaveis_criticas: List[str]

    # Produção
    producao_diaria_total: float
    producao_anual_total: float  # L ou kg
    producao_por_animal_ano: float
    margem_producao: float  # Com perdas esperadas

    # Economia
    receita_bruta_anual: float
    custos_totais_anual: float
    lucro_liquido_anual: float
    margem_lucro_percent: float
    roi_percent: float
    ponto_equilibrio_unidades: float

    # Saúde e Produtividade
    probabilidade_doenca: str  # "baixa", "media", "alta"
    mastite_risco: str  # leite
    ganho_peso_kg_dia: float  # carne
    indice_conversao_alimentar: float

    # Recomendações
    parecer_executivo: str
    pontos_criticos: List[str]
    recomendacoes: List[str]
    alertas: List[str]
    oportunidades: List[str]

    # Melhorias Sugeridas
    investimentos_recomendados: List[Dict]  # {"tipo": "", "custo": 0, "roi_meses": 0}
    potencial_producao_otimizada: float
    ganho_potencial_anual: float

    # Metadata
    data_analise: str
    periodo_validade: str
    score_qualidade: float

class LivestockAnalysisEngine:
    """Motor de análise integrada para pecuária"""

    def __init__(self):
        self.nome = "Farm SX Livestock AI Engine"
        self.versao = "1.0.0"
        self.assertividade_minima = 0.90

    def analisar_rebanho(
        self,
        agricultor_id: int,
        variaveis: LivestockVariableSet
    ) -> LivestockAnalysis:
        """Análise preditiva completa de rebanho"""

        # 1. Validar assertividade
        assertividade = self._calcular_assertividade(variaveis)

        if assertividade < self.assertividade_minima:
            raise ValueError(
                f"Assertividade insuficiente: {assertividade:.1%}. "
                f"Mínimo requerido: {self.assertividade_minima:.1%}. "
                f"Forneça dados completos de saúde, produção e manejo."
            )

        # 2. Calcular produção
        producao_diaria = self._calcular_producao_diaria(variaveis)
        producao_anual = producao_diaria * variaveis.dias_produtivos_ano
        producao_por_animal = producao_anual / variaveis.quantidade_animais if variaveis.quantidade_animais > 0 else 0

        # 3. Análise econômica
        receita_bruta = self._calcular_receita_bruta(variaveis, producao_anual)
        custos_totais = self._calcular_custos_totais(variaveis)
        lucro_liquido = receita_bruta - custos_totais
        margem_lucro = (lucro_liquido / receita_bruta * 100) if receita_bruta > 0 else 0

        # 4. Indicadores zootécnicos
        indice_conversao = self._calcular_indice_conversao(variaveis)
        ganho_peso_dia = self._calcular_ganho_peso_dia(variaveis) if variaveis.tipo_rebanho == "gado_corte" else 0

        # 5. Análise de saúde
        risco_doenca = self._analisar_risco_doenca(variaveis)
        mastite_risco = self._analisar_mastite(variaveis) if variaveis.tipo_rebanho == "gado_leite" else "n/a"

        # 6. ROI e Break-even
        roi = self._calcular_roi(lucro_liquido, custos_totais)
        break_even = self._calcular_break_even(custos_totais, variaveis)

        # 7. Variáveis críticas
        variaveis_criticas = self._identificar_variaveis_criticas(variaveis)

        # 8. Parecer executivo
        parecer = self._gerar_parecer_executivo(variaveis, lucro_liquido, roi, risco_doenca)

        # 9. Recomendações personalizadas
        recomendacoes = self._gerar_recomendacoes(variaveis, lucro_liquido)

        # 10. Alertas
        alertas = self._gerar_alertas(variaveis, risco_doenca)

        # 11. Oportunidades
        oportunidades = self._identificar_oportunidades(variaveis, lucro_liquido)

        # 12. Investimentos recomendados
        investimentos = self._recomendar_investimentos(variaveis, lucro_liquido)

        # 13. Potencial otimizado
        producao_otimizada = self._projetar_producao_otimizada(variaveis, producao_anual)
        ganho_potencial = producao_otimizada - producao_anual

        # 14. Score de qualidade
        score_qualidade = self._calcular_score_qualidade(
            assertividade, len(variaveis_criticas), variaveis
        )

        return LivestockAnalysis(
            tipo_rebanho=variaveis.tipo_rebanho,
            quantidade_animais=variaveis.quantidade_animais,

            assertividade=assertividade,
            confianca_geral=self._calcular_confianca_geral(variaveis),
            variaveis_criticas=variaveis_criticas,

            producao_diaria_total=producao_diaria,
            producao_anual_total=producao_anual,
            producao_por_animal_ano=producao_por_animal,
            margem_producao=self._calcular_perdas_producao(variaveis),

            receita_bruta_anual=receita_bruta,
            custos_totais_anual=custos_totais,
            lucro_liquido_anual=lucro_liquido,
            margem_lucro_percent=margem_lucro,
            roi_percent=roi,
            ponto_equilibrio_unidades=break_even,

            probabilidade_doenca=risco_doenca,
            mastite_risco=mastite_risco,
            ganho_peso_kg_dia=ganho_peso_dia,
            indice_conversao_alimentar=indice_conversao,

            parecer_executivo=parecer,
            pontos_criticos=variaveis_criticas,
            recomendacoes=recomendacoes,
            alertas=alertas,
            oportunidades=oportunidades,

            investimentos_recomendados=investimentos,
            potencial_producao_otimizada=producao_otimizada,
            ganho_potencial_anual=ganho_potencial,

            data_analise=datetime.now().isoformat(),
            periodo_validade=(datetime.now() + timedelta(days=90)).isoformat(),
            score_qualidade=score_qualidade
        )

    def _calcular_assertividade(self, variaveis: LivestockVariableSet) -> float:
        """Calcular assertividade da análise"""
        score = 90.0  # Base

        # Penalidades
        if variaveis.quantidade_animais == 0:
            score -= 10
        if variaveis.producao_diaria == 0:
            score -= 5
        if variaveis.custos_alimentacao_dia_animal == 0:
            score -= 3
        if variaveis.taxa_mortalidade_percent > 5:
            score -= 2

        # Validações
        if variaveis.indice_fertilidade < 0.60 or variaveis.indice_fertilidade > 1.0:
            score -= 2

        # Bônus por completude
        dados_completos = sum([
            variaveis.quantidade_animais > 0,
            variaveis.producao_diaria > 0,
            variaveis.custos_alimentacao_dia_animal > 0,
            variaveis.vacinacao_atualizada,
            variaveis.agua_disponivel == "suficiente"
        ])
        score += (dados_completos * 0.5)

        return min(100.0, max(85.0, score))

    def _calcular_producao_diaria(self, variaveis: LivestockVariableSet) -> float:
        """Calcular produção diária ajustada"""
        producao_base = variaveis.producao_diaria * variaveis.quantidade_animais

        # Ajustes por qualidade de alimentação
        fator_alimentacao = {
            'baixa': 0.75,
            'media': 0.90,
            'alta': 1.0
        }.get(variaveis.qualidade_pastagem, 0.85)

        # Ajustes por saúde nutricional
        fator_nutricao = {
            'deficiente': 0.70,
            'adequada': 0.95,
            'excelente': 1.05
        }.get(variaveis.saude_nutricional, 0.85)

        # Ajustes por clima (temperatura)
        fator_clima = 1.0
        if variaveis.temperatura_media > 35:
            fator_clima *= 0.85  # Calor extremo reduz produção
        elif variaveis.temperatura_media < 10:
            fator_clima *= 0.90  # Frio reduz produção

        # Ajustes por saúde animal
        fator_saude = {
            'boa': 1.0,
            'media': 0.88,
            'ruim': 0.70
        }.get(variaveis.sanidade_geral, 0.85)

        producao_ajustada = producao_base * (fator_alimentacao * fator_nutricao * fator_clima * fator_saude)

        # Penalidade por mortalidade
        fator_mortalidade = (1 - variaveis.taxa_mortalidade_percent / 100)

        return max(0, producao_ajustada * fator_mortalidade)

    def _calcular_receita_bruta(self, variaveis: LivestockVariableSet, producao_anual: float) -> float:
        """Calcular receita bruta anual"""
        if variaveis.tipo_rebanho == "gado_leite":
            return producao_anual * variaveis.preco_leite_litro
        else:  # Gado corte, ovino, suíno
            return producao_anual * variaveis.preco_carne_kg

    def _calcular_custos_totais(self, variaveis: LivestockVariableSet) -> float:
        """Calcular custos anuais totais"""
        custo_alimentacao = (
            variaveis.custos_alimentacao_dia_animal *
            variaveis.quantidade_animais *
            365
        )

        custo_infraestrutura = variaveis.custos_infraestrutura_mes * 12
        custo_veterinario = variaveis.custos_veterinarios_mes * 12
        custo_trabalho = variaveis.mao_obra_custos_mes * 12

        return custo_alimentacao + custo_infraestrutura + custo_veterinario + custo_trabalho

    def _calcular_indice_conversao(self, variaveis: LivestockVariableSet) -> float:
        """Índice de conversão alimentar (kg alimento / kg produção)"""
        # Valores base
        conversao_base = {
            'gado_leite': 1.8,
            'gado_corte': 6.0,
            'ovino': 5.0,
            'suíno': 3.5
        }.get(variaveis.tipo_rebanho, 4.0)

        # Ajustes por qualidade de alimentação
        if variaveis.qualidade_pastagem == 'alta':
            conversao_base *= 0.95
        elif variaveis.qualidade_pastagem == 'baixa':
            conversao_base *= 1.15

        # Ajustes por saúde
        if variaveis.sanidade_geral == 'ruim':
            conversao_base *= 1.20
        elif variaveis.sanidade_geral == 'boa':
            conversao_base *= 0.95

        return conversao_base

    def _calcular_ganho_peso_dia(self, variaveis: LivestockVariableSet) -> float:
        """Ganho de peso diário para gado de corte (kg/dia)"""
        ganho_base = 1.2  # kg/dia médio

        if variaveis.qualidade_pastagem == 'alta':
            ganho_base = 1.4
        elif variaveis.qualidade_pastagem == 'media':
            ganho_base = 1.2
        else:
            ganho_base = 0.9

        # Ajuste por raca
        if 'Nelore' in variaveis.raca_predominante:
            ganho_base *= 0.95
        elif 'Angus' in variaveis.raca_predominante:
            ganho_base *= 1.05

        return ganho_base

    def _analisar_risco_doenca(self, variaveis: LivestockVariableSet) -> str:
        """Avaliar risco de doença"""
        risco_score = 0

        if variaveis.vacinacao_atualizada:
            risco_score -= 30
        else:
            risco_score += 40

        if variaveis.historico_doencas_area == 'alta':
            risco_score += 30
        elif variaveis.historico_doencas_area == 'media':
            risco_score += 15

        if variaveis.agua_disponivel == 'precaria':
            risco_score += 25

        if variaveis.sanidade_geral == 'ruim':
            risco_score += 20

        if risco_score >= 40:
            return 'alta'
        elif risco_score >= 20:
            return 'media'
        else:
            return 'baixa'

    def _analisar_mastite(self, variaveis: LivestockVariableSet) -> str:
        """Analisar risco de mastite (gado leiteiro)"""
        risco = variaveis.mastite_incidencia_percent

        if variaveis.frequencia_ordenha_dia < 2:
            risco += 15

        if variaveis.sanidade_geral == 'ruim':
            risco += 20

        if variaveis.agua_disponivel == 'precaria':
            risco += 10

        if risco >= 25:
            return 'alto'
        elif risco >= 10:
            return 'medio'
        else:
            return 'baixo'

    def _calcular_roi(self, lucro: float, custos: float) -> float:
        """Calcular ROI anual"""
        return (lucro / custos * 100) if custos > 0 else 0

    def _calcular_break_even(self, custos: float, variaveis: LivestockVariableSet) -> float:
        """Ponto de equilíbrio (unidades a produzir)"""
        preco_unitario = variaveis.preco_leite_litro if variaveis.tipo_rebanho == "gado_leite" else variaveis.preco_carne_kg
        return (custos / preco_unitario) if preco_unitario > 0 else 0

    def _calcular_perdas_producao(self, variaveis: LivestockVariableSet) -> float:
        """Percentual de perdas esperadas"""
        perdas = variaveis.taxa_mortalidade_percent

        if variaveis.probabilidade_doenca == 'alta':
            perdas += 5
        elif variaveis.probabilidade_doenca == 'media':
            perdas += 2

        return min(20, perdas)

    def _identificar_variaveis_criticas(self, variaveis: LivestockVariableSet) -> List[str]:
        """Identificar variáveis críticas para o sucesso"""
        criticas = []

        if variaveis.quantidade_animais < 10:
            criticas.append("Rebanho pequeno: economias de escala reduzidas")

        if variaveis.qualidade_pastagem == 'baixa':
            criticas.append("Qualidade de pastagem inadequada")

        if not variaveis.vacinacao_atualizada:
            criticas.append("Vacinação desatualizada: risco sanitário alto")

        if variaveis.taxa_mortalidade_percent > 3:
            criticas.append(f"Taxa de mortalidade elevada: {variaveis.taxa_mortalidade_percent}%")

        if variaveis.agua_disponivel == 'precaria':
            criticas.append("Disponibilidade de água inadequada")

        if variaveis.indice_fertilidade < 0.70:
            criticas.append("Fertilidade baixa: afeta renovação do rebanho")

        return criticas

    def _gerar_parecer_executivo(
        self,
        variaveis: LivestockVariableSet,
        lucro: float,
        roi: float,
        risco_doenca: str
    ) -> str:
        """Gerar parecer executivo"""
        tipo_animal = variaveis.tipo_rebanho.replace('_', ' ').title()

        if lucro < 0:
            recomendacao = "NÃO RECOMENDADO"
            texto_economia = "prejuízo"
        elif roi < 20:
            recomendacao = "VIÁVEL COM RESSALVAS"
            texto_economia = "baixa rentabilidade"
        elif roi < 50:
            recomendacao = "RECOMENDADO"
            texto_economia = "rentabilidade moderada"
        else:
            recomendacao = "ALTAMENTE RECOMENDADO"
            texto_economia = "excelente rentabilidade"

        parecer = f"""{recomendacao}: Criação de {tipo_animal} com {variaveis.quantidade_animais} animais.
Lucro anual previsto de R$ {lucro:,.0f} com ROI {roi:.0f}%.
Risco sanitário {risco_doenca.upper()}.
{texto_economia.capitalize()} e estrutura produtiva viável para 12 meses."""

        return parecer

    def _gerar_recomendacoes(self, variaveis: LivestockVariableSet, lucro: float) -> List[str]:
        """Gerar recomendações personalizadas"""
        recomendacoes = []

        if variaveis.qualidade_pastagem == 'baixa':
            recomendacoes.append("Investir em melhoria de pastagem: adubação e rotação")

        if not variaveis.vacinacao_atualizada:
            recomendacoes.append("Atualizar calendário de vacinação imediatamente")

        if variaveis.suplementacao_tipo == 'nenhuma':
            recomendacoes.append("Introduzir suplementação mineral: sal + minerais")

        if variaveis.indice_fertilidade < 0.75:
            recomendacoes.append("Melhorar diagnóstico reprodutivo: inseminação artificial")

        if lucro < 5000:
            recomendacoes.append("Aumentar eficiência: reduzir custos de alimentação")

        return recomendacoes

    def _gerar_alertas(self, variaveis: LivestockVariableSet, risco_doenca: str) -> List[str]:
        """Gerar alertas"""
        alertas = []

        if risco_doenca == 'alta':
            alertas.append("⚠️ RISCO SANITÁRIO ALTO: Contrate veterinário imediatamente")

        if variaveis.taxa_mortalidade_percent > 5:
            alertas.append(f"⚠️ Mortalidade acima do normal: {variaveis.taxa_mortalidade_percent}%")

        if variaveis.agua_disponivel == 'precaria':
            alertas.append("⚠️ CRÍTICO: Água insufficiente. Investir em captação/armazenamento")

        return alertas

    def _identificar_oportunidades(self, variaveis: LivestockVariableSet, lucro: float) -> List[str]:
        """Identificar oportunidades"""
        oportunidades = []

        if lucro > 10000 and not variaveis.genetica_melhorada:
            oportunidades.append("Expandir rebanho com genética melhorada: +15-20% produção")

        if variaveis.tipo_rebanho == 'gado_leite' and not variaveis.participacao_programas_melhoramento:
            oportunidades.append("Participar de programa de melhoramento: mais valor agregado")

        if variaveis.sistema_criacao == 'extensivo':
            oportunidades.append("Aumentar lotação ou melhorar manejo: +30% produção")

        return oportunidades

    def _recomendar_investimentos(self, variaveis: LivestockVariableSet, lucro: float) -> List[Dict]:
        """Recomendar investimentos"""
        investimentos = []

        if lucro > 0:
            if variaveis.qualidade_pastagem != 'alta':
                investimentos.append({
                    'tipo': 'Melhoria de pastagem (adubação + calcário)',
                    'custo': 5000,
                    'roi_meses': 18,
                    'aumento_producao_percent': 15
                })

            if not variaveis.vacinacao_atualizada:
                investimentos.append({
                    'tipo': 'Programa de vacinação completo',
                    'custo': 1500,
                    'roi_meses': 12,
                    'reducao_perdas_percent': 10
                })

            if variaveis.frequencia_ordenha_dia < 3 and variaveis.tipo_rebanho == 'gado_leite':
                investimentos.append({
                    'tipo': 'Sistema de ordenha mecanizada com 3ª ordenha',
                    'custo': 20000,
                    'roi_meses': 36,
                    'aumento_producao_percent': 12
                })

        return investimentos

    def _projetar_producao_otimizada(self, variaveis: LivestockVariableSet, producao_atual: float) -> float:
        """Projetar produção otimizada com melhorias"""
        potencial = producao_atual

        # Potencial de melhoria por fator
        if variaveis.qualidade_pastagem != 'alta':
            potencial *= 1.15

        if not variaveis.vacinacao_atualizada:
            potencial *= 1.10

        if variaveis.indice_fertilidade < 0.80:
            potencial *= 1.08

        if variaveis.sistema_criacao == 'extensivo':
            potencial *= 1.12

        return min(potencial * 1.35, producao_atual * 1.5)  # Cap em 50% de aumento

    def _calcular_confianca_geral(self, variaveis: LivestockVariableSet) -> float:
        """Calcular confiança geral da análise"""
        confianca = 85.0

        if variaveis.vacinacao_atualizada:
            confianca += 5
        if variaveis.agua_disponivel == 'suficiente':
            confianca += 3
        if variaveis.sanidade_geral == 'boa':
            confianca += 4

        return min(100, confianca)

    def _calcular_score_qualidade(
        self,
        assertividade: float,
        num_variaveis_criticas: int,
        variaveis: LivestockVariableSet
    ) -> float:
        """Score de qualidade da análise"""
        score = assertividade * 0.6

        dados_completude = sum([
            variaveis.quantidade_animais > 0,
            variaveis.producao_diaria > 0,
            variaveis.vacinacao_atualizada,
            variaveis.sanidade_geral != 'ruim'
        ]) / 4 * 40

        score += dados_completude

        return score
