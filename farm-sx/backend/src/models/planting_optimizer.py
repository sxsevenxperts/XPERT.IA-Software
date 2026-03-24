from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np

@dataclass
class PlanoPlantio:
    cultura: str
    municipio: str
    area_hectares: float
    data_plantio_recomendada: str
    data_colheita_prevista: str
    quantidade_a_plantar_kg: float
    produtividade_estimada: float
    lucro_estimado: float
    risco: str  # baixo, medio, alto
    canais_venda: List[str]
    demanda_pico_mes: int
    recomendacoes: str

class PlantingOptimizer:
    """Otimizador de plantio baseado em consumo e demanda"""

    def __init__(self):
        self.ciclos_cultura = {
            'milho': 120,
            'feijão': 90,
            'mandioca': 240,
            'caju': 180,
            'melancia': 75,
            'melão': 80,
            'tomate': 100,
            'cebolinha': 60,
            'alface': 45,
            'abacaxi': 480
        }

    def otimizar_plantio(
        self,
        cultura: str,
        municipio: str,
        area_hectares: float,
        produtividade_media: float,
        previsao_consumo: Dict,
        previsao_preco: Dict,
        dados_clima: Dict,
        dados_solo: Dict
    ) -> PlanoPlantio:
        """
        Otimizar plantio para evitar perdas e maximizar lucro

        Args:
            cultura: Nome da cultura
            municipio: Município
            area_hectares: Área disponível
            produtividade_media: Produtividade média histórica (t/ha)
            previsao_consumo: Dict com previsões de consumo por mês
            previsao_preco: Dict com previsões de preço por mês
            dados_clima: Dict com precipitação, temperatura
            dados_solo: Dict com pH, NPK, materia_organica

        Returns:
            PlanoPlantio com recomendações
        """

        # 1. Identificar pico de demanda
        mes_pico = self._identificar_pico_demanda(previsao_consumo)

        # 2. Calcular data de plantio baseado no pico
        ciclo_dias = self.ciclos_cultura.get(cultura.lower(), 120)
        data_plantio = self._calcular_data_plantio(mes_pico, ciclo_dias)
        data_colheita = self._calcular_data_colheita(data_plantio, ciclo_dias)

        # 3. Calcular quantidade a plantar
        demanda_pico = previsao_consumo.get(mes_pico, {}).get('quantidade', 1000)
        quantidade_plantar = self._calcular_quantidade_plantar(
            demanda_pico, area_hectares, produtividade_media
        )

        # 4. Calcular produtividade esperada
        produtividade_esperada = self._aplicar_fatores_ambiente(
            produtividade_media, dados_clima, dados_solo, cultura
        )

        # 5. Calcular lucro estimado
        quantidade_colhida = produtividade_esperada * area_hectares * 1000  # kg
        preco_medio = previsao_preco.get(mes_pico, {}).get('preco', 1000)
        receita = quantidade_colhida * (preco_medio / 1000)  # Convertendo preço
        custo_estimado = self._calcular_custo_producao(cultura, area_hectares)
        lucro = receita - custo_estimado

        # 6. Avaliar risco
        risco = self._avaliar_risco(
            dados_clima, dados_solo, previsao_consumo, mes_pico
        )

        # 7. Identificar canais de venda
        canais = self._identificar_canais_venda(cultura, municipio)

        # 8. Gerar recomendações
        recomendacoes = self._gerar_recomendacoes(
            cultura, mes_pico, risco, lucro, data_plantio
        )

        return PlanoPlantio(
            cultura=cultura,
            municipio=municipio,
            area_hectares=area_hectares,
            data_plantio_recomendada=data_plantio,
            data_colheita_prevista=data_colheita,
            quantidade_a_plantar_kg=quantidade_plantar,
            produtividade_estimada=produtividade_esperada,
            lucro_estimado=lucro,
            risco=risco,
            canais_venda=canais,
            demanda_pico_mes=mes_pico,
            recomendacoes=recomendacoes
        )

    def _identificar_pico_demanda(self, previsao_consumo: Dict) -> int:
        """Identificar mês com maior demanda"""
        demandas = {}
        for mes, dados in previsao_consumo.items():
            demandas[mes] = dados.get('quantidade', 0)

        return max(demandas, key=demandas.get) if demandas else 6

    def _calcular_data_plantio(self, mes_pico: int, ciclo_dias: int) -> str:
        """Calcular quando plantar para colher no pico"""
        data_pico = datetime(datetime.now().year, mes_pico, 15)
        data_plantio = data_pico - timedelta(days=ciclo_dias)

        # Ajustar para início do mês
        data_plantio = data_plantio.replace(day=1)

        return data_plantio.strftime('%Y-%m-%d')

    def _calcular_data_colheita(self, data_plantio: str, ciclo_dias: int) -> str:
        """Calcular data de colheita"""
        dt_plantio = datetime.strptime(data_plantio, '%Y-%m-%d')
        dt_colheita = dt_plantio + timedelta(days=ciclo_dias)
        return dt_colheita.strftime('%Y-%m-%d')

    def _calcular_quantidade_plantar(
        self,
        demanda_pico: float,
        area_hectares: float,
        produtividade_media: float
    ) -> float:
        """Calcular quantidade a plantar considerando perda de safra"""
        # Considerar 15% de perda normal
        quantidade_com_margem = demanda_pico * 1.15

        # Limite pela área e produtividade
        quantidade_maxima = produtividade_media * area_hectares * 1000  # kg

        return min(quantidade_com_margem, quantidade_maxima)

    def _aplicar_fatores_ambiente(
        self,
        produtividade_base: float,
        dados_clima: Dict,
        dados_solo: Dict,
        cultura: str
    ) -> float:
        """Ajustar produtividade com base em fatores ambientais"""
        produtividade = produtividade_base

        # Fator clima
        precip = dados_clima.get('precipitacao_media', 80)
        if precip < 50:
            produtividade *= 0.7
        elif precip > 150:
            produtividade *= 0.8

        temp = dados_clima.get('temperatura_media', 28)
        if temp < 20 or temp > 35:
            produtividade *= 0.85

        # Fator solo
        ph = dados_solo.get('ph', 6.0)
        if ph < 5.5 or ph > 7.5:
            produtividade *= 0.9

        nitrogenio = dados_solo.get('nitrogenio_ppm', 30)
        if nitrogenio < 20:
            produtividade *= 0.85

        # Fator matéria orgânica
        mo = dados_solo.get('materia_organica_percent', 2.5)
        if mo < 2.0:
            produtividade *= 0.9

        return max(0.5, produtividade)  # Mínimo 50% da base

    def _calcular_custo_producao(self, cultura: str, area_hectares: float) -> float:
        """Estimar custo de produção por hectare"""
        custos_por_hectare = {
            'milho': 1500,
            'feijão': 1200,
            'mandioca': 2000,
            'caju': 800,
            'melancia': 2500,
            'melão': 2800,
            'tomate': 4000,
            'cebolinha': 3000,
            'alface': 2500,
            'abacaxi': 5000
        }

        custo_ha = custos_por_hectare.get(cultura.lower(), 1500)
        return custo_ha * area_hectares

    def _avaliar_risco(
        self,
        dados_clima: Dict,
        dados_solo: Dict,
        previsao_consumo: Dict,
        mes_pico: int
    ) -> str:
        """Avaliar risco de plantio"""
        risco_score = 0

        # Risco clima
        precip = dados_clima.get('precipitacao_media', 80)
        if precip < 40:
            risco_score += 3  # Seca
        elif precip > 200:
            risco_score += 2  # Enchente

        # Risco solo
        ph = dados_solo.get('ph', 6.0)
        if ph < 5.0 or ph > 8.0:
            risco_score += 2

        # Risco mercado
        demandas = [d.get('quantidade', 0) for d in previsao_consumo.values()]
        if demandas:
            variacao = np.std(demandas) / np.mean(demandas) if np.mean(demandas) > 0 else 0
            if variacao > 0.5:
                risco_score += 2

        if risco_score >= 5:
            return 'alto'
        elif risco_score >= 3:
            return 'medio'
        else:
            return 'baixo'

    def _identificar_canais_venda(self, cultura: str, municipio: str) -> List[str]:
        """Identificar canais de venda mais viáveis"""
        canais = ['Comprador Local', 'CEASA']

        # Adicionar canais especializados
        if cultura.lower() in ['tomate', 'alface', 'cebolinha']:
            canais.append('Supermercados')
            canais.append('Feiras')

        if cultura.lower() in ['milho', 'feijão', 'mandioca']:
            canais.append('Cooperativa')
            canais.append('Indústria')

        if cultura.lower() in ['melancia', 'melão']:
            canais.append('Exportação')

        if cultura.lower() == 'caju':
            canais.append('Indústria de Processamento')

        return canais

    def _gerar_recomendacoes(
        self,
        cultura: str,
        mes_pico: int,
        risco: str,
        lucro: float,
        data_plantio: str
    ) -> str:
        """Gerar recomendações personalizadas"""
        recomendacoes = []

        # Recomendação de plantio
        recomendacoes.append(
            f"Plantar {cultura} em {data_plantio} para colher no pico de demanda (mês {mes_pico})"
        )

        # Recomendação de risco
        if risco == 'alto':
            recomendacoes.append("⚠️ RISCO ALTO: Considere usar seguro safra ou reduzir área")
        elif risco == 'medio':
            recomendacoes.append("Risco moderado. Implementar boas práticas de manejo")
        else:
            recomendacoes.append("✓ Condições favoráveis para plantio")

        # Recomendação de lucro
        if lucro < 0:
            recomendacoes.append("⚠️ Lucro estimado é negativo. Verifique possibilidades de otimização")
        elif lucro < 5000:
            recomendacoes.append("Lucro esperado baixo. Considere aumentar escala ou diversificar")
        else:
            recomendacoes.append(f"✓ Lucro estimado: R$ {lucro:,.0f}")

        # Recomendações específicas por cultura
        if cultura.lower() == 'milho':
            recomendacoes.append("Usar sementes híbridas de qualidade. Fazer adubação de cobertura")

        elif cultura.lower() == 'feijão':
            recomendacoes.append("Cuidado com doenças. Fazer rotação de culturas")

        elif cultura.lower() in ['tomate', 'melancia']:
            recomendacoes.append("Prepare bem a irrigação. Monitorar pragas regularmente")

        # Recomendação geral
        recomendacoes.append(
            "Atualizar análise de solo antes de plantar. Acompanhar previsões semanalmente"
        )

        return ". ".join(recomendacoes)

    def comparar_culturas(
        self,
        municipio: str,
        area_hectares: float,
        previsoes_consumo: Dict[str, Dict],
        previsoes_preco: Dict[str, Dict],
        dados_clima: Dict,
        dados_solo: Dict,
        culturas: List[str]
    ) -> List[Tuple[str, float]]:
        """Comparar culturas e retornar ranking por lucro"""

        resultados = []

        for cultura in culturas:
            try:
                plano = self.otimizar_plantio(
                    cultura=cultura,
                    municipio=municipio,
                    area_hectares=area_hectares,
                    produtividade_media=3.0,
                    previsao_consumo=previsoes_consumo.get(cultura, {}),
                    previsao_preco=previsoes_preco.get(cultura, {}),
                    dados_clima=dados_clima,
                    dados_solo=dados_solo
                )
                resultados.append((cultura, plano.lucro_estimado))
            except Exception as e:
                print(f"Erro ao analisar {cultura}: {e}")

        # Ordenar por lucro
        resultados.sort(key=lambda x: x[1], reverse=True)
        return resultados
