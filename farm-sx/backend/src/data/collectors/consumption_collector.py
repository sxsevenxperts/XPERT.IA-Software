from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np

class ConsumptionCollector:
    """Coletor e analisador de dados de consumo/demanda"""

    def __init__(self):
        self.dados_consumo = {}

    def registrar_consumo(
        self,
        cultura: str,
        municipio: str,
        mes: int,
        quantidade_kg: float,
        fonte: str = "CEASA"
    ) -> bool:
        """Registrar dados de consumo histórico"""
        key = f"{cultura}_{municipio}"
        if key not in self.dados_consumo:
            self.dados_consumo[key] = []

        self.dados_consumo[key].append({
            'mes': mes,
            'quantidade': quantidade_kg,
            'fonte': fonte,
            'data_registro': datetime.now()
        })
        return True

    def obter_consumo_historico(
        self,
        cultura: str,
        municipio: str
    ) -> List[Dict]:
        """Obter histórico de consumo de uma cultura"""
        key = f"{cultura}_{municipio}"

        # Dados simulados
        consumo_simulado = []
        quantidade_base = self._get_quantidade_base_cultura(cultura)

        for mes in range(1, 13):
            # Padrão sazonal de consumo
            fator_sazonalidade = self._get_sazonalidade(cultura, mes)
            quantidade = quantidade_base * fator_sazonalidade * (0.9 + np.random.random() * 0.2)

            consumo_simulado.append({
                'mes': mes,
                'cultura': cultura,
                'municipio': municipio,
                'quantidade_consumida_kg': round(quantidade, 0),
                'preco_medio': 1000,  # R$ / unidade
                'fonte': 'CEASA'
            })

        return consumo_simulado

    def previsao_consumo(
        self,
        cultura: str,
        municipio: str,
        meses_adiante: int = 6
    ) -> Dict[int, Dict]:
        """
        Prever consumo para os próximos meses usando padrões sazonais

        Returns:
            Dict com mes -> {quantidade_prevista, intervalo_min, intervalo_max, confianca}
        """
        historico = self.obter_consumo_historico(cultura, municipio)

        previsoes = {}
        quantidade_media = np.mean([c['quantidade_consumida_kg'] for c in historico])
        desvio_padrao = np.std([c['quantidade_consumida_kg'] for c in historico])

        for i in range(meses_adiante):
            mes_futuro = ((datetime.now().month + i - 1) % 12) + 1

            # Usar padrão sazonal
            fator_sazonal = self._get_sazonalidade(cultura, mes_futuro)
            quantidade_prevista = quantidade_media * fator_sazonal

            previsoes[mes_futuro] = {
                'mes': mes_futuro,
                'quantidade_prevista_kg': round(quantidade_prevista, 0),
                'intervalo_minimo': round(quantidade_prevista - desvio_padrao, 0),
                'intervalo_maximo': round(quantidade_prevista + desvio_padrao, 0),
                'confianca': 0.75
            }

        return previsoes

    def analisar_sazonalidade(
        self,
        cultura: str,
        municipio: str
    ) -> Dict[int, float]:
        """Analisar padrão de sazonalidade (índices por mês)"""
        historico = self.obter_consumo_historico(cultura, municipio)

        consumo_por_mes = {}
        for consumo in historico:
            mes = consumo['mes']
            if mes not in consumo_por_mes:
                consumo_por_mes[mes] = []
            consumo_por_mes[mes].append(consumo['quantidade_consumida_kg'])

        # Calcular índice de sazonalidade
        sazonalidade = {}
        media_geral = np.mean([c['quantidade_consumida_kg'] for c in historico])

        for mes in range(1, 13):
            if mes in consumo_por_mes:
                media_mes = np.mean(consumo_por_mes[mes])
                sazonalidade[mes] = media_mes / media_geral if media_geral > 0 else 1.0
            else:
                sazonalidade[mes] = 1.0

        return sazonalidade

    def identificar_picos_consumo(
        self,
        cultura: str,
        municipio: str
    ) -> List[Dict]:
        """Identificar períodos de pico de consumo"""
        previsoes = self.previsao_consumo(cultura, municipio, 12)

        picos = []
        quantidades = sorted(
            previsoes.values(),
            key=lambda x: x['quantidade_prevista_kg'],
            reverse=True
        )

        # Top 3 meses
        for pico in quantidades[:3]:
            picos.append({
                'mes': pico['mes'],
                'quantidade': pico['quantidade_prevista_kg'],
                'confianca': pico['confianca'],
                'recomendacao': f"Plantar para colher em {self._mes_nome(pico['mes'])}"
            })

        return picos

    def calcular_demanda_por_canal(
        self,
        cultura: str,
        municipio: str
    ) -> Dict[str, Dict]:
        """Estimar demanda por canal de distribuição"""
        previsao_total = self.previsao_consumo(cultura, municipio)

        # Distribuição típica por canal
        distribuicao_canal = {
            'ceasa': 0.35,
            'varejo': 0.30,
            'industria': 0.20,
            'exportacao': 0.10,
            'direto_consumidor': 0.05
        }

        demanda_canal = {}
        quantidade_total = sum(p['quantidade_prevista_kg'] for p in previsao_total.values())

        for canal, percentual in distribuicao_canal.items():
            demanda_canal[canal] = {
                'percentual': percentual * 100,
                'quantidade_estimada': round(quantidade_total * percentual, 0),
                'recomendacao': self._recomendacao_canal(cultura, canal)
            }

        return demanda_canal

    def comparar_culturas_demanda(
        self,
        municipio: str,
        culturas: List[str]
    ) -> List[Tuple[str, float]]:
        """Comparar demanda de diferentes culturas"""
        comparacao = []

        for cultura in culturas:
            previsoes = self.previsao_consumo(cultura, municipio)
            quantidade_total = sum(p['quantidade_prevista_kg'] for p in previsoes.values())
            comparacao.append((cultura, quantidade_total))

        # Ordenar por demanda
        comparacao.sort(key=lambda x: x[1], reverse=True)
        return comparacao

    def calcular_risco_superprodução(
        self,
        cultura: str,
        area_hectares: float,
        produtividade_media: float,
        municipio: str
    ) -> Dict:
        """Calcular risco de superprodução"""
        quantidade_produzida = area_hectares * produtividade_media * 1000  # kg
        previsoes = self.previsao_consumo(cultura, municipio)
        quantidade_consumida = sum(p['quantidade_prevista_kg'] for p in previsoes.values())

        racio = quantidade_produzida / quantidade_consumida if quantidade_consumida > 0 else 0

        if racio > 1.5:
            risco = 'alto'
            recomendacao = 'Reduzir área plantada'
        elif racio > 1.2:
            risco = 'medio'
            recomendacao = 'Monitorar mercado closely'
        else:
            risco = 'baixo'
            recomendacao = 'Área adequada para demanda'

        return {
            'area_hectares': area_hectares,
            'quantidade_produzida_kg': round(quantidade_produzida, 0),
            'quantidade_consumida_kg': round(quantidade_consumida, 0),
            'racio': round(racio, 2),
            'risco': risco,
            'recomendacao': recomendacao,
            'excesso_producao': round(max(0, quantidade_produzida - quantidade_consumida), 0)
        }

    def sugerir_rotacao_culturas(
        self,
        municipio: str,
        culturas_disponiveis: List[str]
    ) -> List[Dict]:
        """Sugerir rotação de culturas baseado em demanda"""
        comparacao = self.comparar_culturas_demanda(municipio, culturas_disponiveis)

        sugestoes = []
        for idx, (cultura, demanda) in enumerate(comparacao, 1):
            picos = self.identificar_picos_consumo(cultura, municipio)
            mes_pico = picos[0]['mes'] if picos else 6

            sugestoes.append({
                'ranking': idx,
                'cultura': cultura,
                'demanda_anual': round(demanda, 0),
                'mes_pico': mes_pico,
                'mes_plantio_recomendado': self._calcular_mes_plantio(cultura, mes_pico),
                'potencial_lucro': 'alto' if idx <= 3 else 'medio' if idx <= 5 else 'baixo'
            })

        return sugestoes

    def _get_quantidade_base_cultura(self, cultura: str) -> float:
        """Quantidade base anual de consumo por cultura"""
        bases = {
            'milho': 500000,
            'feijão': 200000,
            'tomate': 300000,
            'melancia': 150000,
            'melão': 100000,
            'alface': 80000,
            'cebolinha': 50000,
            'cebola': 250000,
            'cenoura': 180000,
            'abacaxi': 120000
        }
        return bases.get(cultura.lower(), 100000)

    def _get_sazonalidade(self, cultura: str, mes: int) -> float:
        """Fator de sazonalidade por cultura e mês"""
        padroes = {
            'milho': {1: 1.1, 2: 1.15, 3: 1.2, 4: 1.0, 5: 0.9, 6: 0.85,
                     7: 0.8, 8: 0.75, 9: 0.8, 10: 0.95, 11: 1.05, 12: 1.1},
            'feijão': {1: 1.3, 2: 1.35, 3: 1.3, 4: 1.1, 5: 0.9, 6: 0.8,
                      7: 0.75, 8: 0.8, 9: 0.9, 10: 1.1, 11: 1.25, 12: 1.3},
            'tomate': {1: 0.85, 2: 0.9, 3: 1.0, 4: 1.05, 5: 1.1, 6: 1.15,
                      7: 1.2, 8: 1.15, 9: 1.0, 10: 0.9, 11: 0.85, 12: 0.8},
            'melancia': {1: 1.3, 2: 1.35, 3: 1.2, 4: 1.0, 5: 0.8, 6: 0.7,
                        7: 0.7, 8: 0.75, 9: 0.85, 10: 1.05, 11: 1.2, 12: 1.3},
        }

        if cultura.lower() in padroes:
            return padroes[cultura.lower()].get(mes, 1.0)
        return 1.0

    def _mes_nome(self, mes: int) -> str:
        """Retornar nome do mês"""
        nomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
        return nomes[mes] if 1 <= mes <= 12 else 'Desconhecido'

    def _calcular_mes_plantio(self, cultura: str, mes_pico: int) -> int:
        """Calcular mês recomendado de plantio"""
        ciclos = {
            'milho': 120,
            'feijão': 90,
            'tomate': 100,
            'melancia': 75,
            'melão': 80,
            'alface': 45,
            'cebolinha': 60,
            'cebola': 150,
            'cenoura': 90,
            'abacaxi': 480
        }

        dias_ciclo = ciclos.get(cultura.lower(), 120)
        meses_antes = max(1, dias_ciclo // 30)

        mes_plantio = mes_pico - meses_antes
        if mes_plantio <= 0:
            mes_plantio += 12

        return mes_plantio

    def _recomendacao_canal(self, cultura: str, canal: str) -> str:
        """Retornar recomendação para canal específico"""
        recomendacoes = {
            'ceasa': 'Melhor para volumes grandes',
            'varejo': 'Produtos frescos e embalados',
            'industria': 'Produtos com especificações técnicas',
            'exportacao': 'Produtos premium',
            'direto_consumidor': 'Venda em feiras/propriedade'
        }
        return recomendacoes.get(canal, 'Avaliar oportunidade')
