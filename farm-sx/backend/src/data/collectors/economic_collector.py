from datetime import datetime, timedelta
from typing import Dict, List, Optional

class EconomicCollector:
    """Coletor de indicadores econômicos IBGE e BCB"""

    def __init__(self):
        self.cache = {}

    def obter_ipca(
        self,
        mes: Optional[int] = None,
        ano: Optional[int] = None
    ) -> Dict:
        """Obter IPCA (Índice de Preços ao Consumidor Amplo)"""
        if mes is None:
            mes = datetime.now().month - 1 or 12
        if ano is None:
            ano = datetime.now().year if mes != 12 else datetime.now().year - 1

        # Dados simulados (em produção seria API do IBGE real)
        return {
            'mes': mes,
            'ano': ano,
            'ipca_mensal': 0.62,
            'ipca_acumulado_ano': 4.52,
            'ipca_12_meses': 4.62,
            'alimentos': 1.45,
            'transporte': 0.32,
            'saude': 0.45,
            'educacao': 0.22
        }

    def obter_selic(self) -> Dict:
        """Obter taxa SELIC (Sistema Especial de Liquidação e Custódia)"""
        return {
            'data': datetime.now().strftime('%Y-%m-%d'),
            'taxa_selic': 10.50,
            'status': 'vigente',
            'proximo_ajuste': 'indefinido',
            'historico_12_meses': [
                {'mes': i, 'taxa': 8.5 + i * 0.2}
                for i in range(12)
            ]
        }

    def obter_desemprego(self) -> Dict:
        """Obter taxa de desemprego"""
        return {
            'mes': datetime.now().month,
            'ano': datetime.now().year,
            'taxa_desemprego': 7.8,
            'populacao_ocupada': 98.5,
            'populacao_subempregada': 8.2,
            'renda_media_nominal': 3250.00,
            'tendencia': 'estável'
        }

    def obter_inflacao_alimentos(self) -> Dict:
        """Obter inflação específica de alimentos"""
        return {
            'mes': datetime.now().month,
            'ano': datetime.now().year,
            'inflacao_alimentos_mes': 1.45,
            'inflacao_alimentos_acumulado': 8.2,
            'inflacao_alimentos_12_meses': 9.5,
            'alimentos_com_maior_inflacao': [
                {'item': 'arroz', 'variacao': 15.2},
                {'item': 'feijão', 'variacao': 12.8},
                {'item': 'tomate', 'variacao': 10.5},
                {'item': 'leite', 'variacao': 8.3}
            ]
        }

    def obter_taxa_cambio(self) -> Dict:
        """Obter taxa de câmbio USD/BRL"""
        return {
            'data': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'usd_brl': 5.25,
            'tendencia': 'estável',
            'minima_dia': 5.20,
            'maxima_dia': 5.30
        }

    def obter_cenarios_economicos(self) -> Dict:
        """Retornar cenários econômicos (pessimista, base, otimista)"""
        return {
            'pessimista': {
                'descricao': 'Seca prolongada + inflação',
                'ipca_previsto': 7.0,
                'selic_prevista': 12.0,
                'desemprego_previsto': 9.5,
                'impacto_agricultura': -25,
                'probabilidade': 0.25
            },
            'base': {
                'descricao': 'Situação atual',
                'ipca_previsto': 4.5,
                'selic_prevista': 10.5,
                'desemprego_previsto': 7.8,
                'impacto_agricultura': 0,
                'probabilidade': 0.50
            },
            'otimista': {
                'descricao': 'Chuvas normais + economia cresce',
                'ipca_previsto': 2.5,
                'selic_prevista': 8.5,
                'desemprego_previsto': 6.0,
                'impacto_agricultura': 20,
                'probabilidade': 0.25
            }
        }

    def calcular_impacto_inflacao(
        self,
        custo_producao: float,
        preco_venda: float
    ) -> Dict:
        """Calcular impacto da inflação na margem de lucro"""

        ipca = self.obter_ipca()
        inflacao_alimentos = self.obter_inflacao_alimentos()

        ipca_mensal = ipca['ipca_mensal'] / 100
        inflacao_alimentos_mes = inflacao_alimentos['inflacao_alimentos_mes'] / 100

        # Projetar 6 meses
        custo_futuro = custo_producao * ((1 + inflacao_alimentos_mes) ** 6)
        preco_futuro = preco_venda * ((1 + ipca_mensal) ** 6)

        margem_atual = ((preco_venda - custo_producao) / preco_venda * 100)
        margem_futura = ((preco_futuro - custo_futuro) / preco_futuro * 100)

        return {
            'custo_producao_atual': round(custo_producao, 2),
            'custo_producao_6_meses': round(custo_futuro, 2),
            'variacao_custo': round(((custo_futuro - custo_producao) / custo_producao * 100), 2),
            'preco_venda_atual': round(preco_venda, 2),
            'preco_venda_6_meses': round(preco_futuro, 2),
            'variacao_preco': round(((preco_futuro - preco_venda) / preco_venda * 100), 2),
            'margem_atual': round(margem_atual, 2),
            'margem_futura': round(margem_futura, 2),
            'alerta': 'Margem em declínio' if margem_futura < margem_atual else 'Margem estável/melhorando'
        }

    def obter_previsoes_safra(self) -> Dict:
        """Obter previsões de safra do IBGE"""
        return {
            'mes_atualizacao': datetime.now().strftime('%Y-%m'),
            'safra_atual': 'Safra 2024',
            'culturas': {
                'milho': {
                    'area_plantada_milhoes_ha': 18.5,
                    'producao_milhoes_ton': 63.5,
                    'produtividade': 3.43,
                    'comparacao_safra_anterior': -8.5
                },
                'feijão': {
                    'area_plantada_milhoes_ha': 2.8,
                    'producao_milhoes_ton': 2.9,
                    'produtividade': 1.03,
                    'comparacao_safra_anterior': 12.3
                },
                'soja': {
                    'area_plantada_milhoes_ha': 29.5,
                    'producao_milhoes_ton': 97.2,
                    'produtividade': 3.29,
                    'comparacao_safra_anterior': 5.2
                }
            }
        }

    def recomendacao_financiamento(
        self,
        area_hectares: float,
        custo_producao: float,
        renda_estimada: float
    ) -> Dict:
        """Recomendar opção de financiamento"""

        selic = self.obter_selic()
        taxa_selic = selic['taxa_selic'] / 100

        # Taxas simuladas de financiamento
        taxa_pronaf = taxa_selic * 0.45  # 45% da SELIC
        taxa_bb = taxa_selic * 0.60      # 60% da SELIC
        taxa_mercado = taxa_selic * 1.2  # 120% da SELIC

        custo_total = custo_producao * area_hectares

        return {
            'area_hectares': area_hectares,
            'custo_total': round(custo_total, 2),
            'opcoes': {
                'pronaf': {
                    'taxa_anual': round(taxa_pronaf * 100, 2),
                    'juros_totais_12_meses': round(custo_total * taxa_pronaf, 2),
                    'parcela_mensal': round((custo_total + custo_total * taxa_pronaf) / 12, 2),
                    'publico': 'Agricultores familiares',
                    'requisitos': 'Possui propriedade declarada'
                },
                'banco_do_brasil': {
                    'taxa_anual': round(taxa_bb * 100, 2),
                    'juros_totais_12_meses': round(custo_total * taxa_bb, 2),
                    'parcela_mensal': round((custo_total + custo_total * taxa_bb) / 12, 2),
                    'publico': 'Todos os agricultores',
                    'requisitos': 'Conta no BB'
                },
                'credito_mercado': {
                    'taxa_anual': round(taxa_mercado * 100, 2),
                    'juros_totais_12_meses': round(custo_total * taxa_mercado, 2),
                    'parcela_mensal': round((custo_total + custo_total * taxa_mercado) / 12, 2),
                    'publico': 'Mercado privado',
                    'requisitos': 'Análise de crédito'
                }
            },
            'renda_estimada': round(renda_estimada, 2),
            'capacidade_pagamento': round((renda_estimada * 0.3), 2),  # 30% da renda
            'recomendacao': 'PRONAF é a melhor opção' if renda_estimada > 0 else 'Consulte gerente de banco'
        }

    def obter_historico_economico(self, meses: int = 12) -> Dict:
        """Obter histórico de indicadores econômicos"""
        historico = {
            'periodo': f'Últimos {meses} meses',
            'data_atualizacao': datetime.now().strftime('%Y-%m-%d'),
            'ipca_mensal': [],
            'selic': [],
            'desemprego': []
        }

        for i in range(meses):
            mes = (datetime.now().month - i - 1) % 12 + 1
            ano = datetime.now().year - (1 if mes > datetime.now().month else 0)

            historico['ipca_mensal'].append({
                'mes_ano': f'{mes:02d}/{ano}',
                'valor': 0.5 + (i % 5) * 0.1
            })

            historico['selic'].append({
                'mes_ano': f'{mes:02d}/{ano}',
                'valor': 8.5 + (i % 6) * 0.3
            })

            historico['desemprego'].append({
                'mes_ano': f'{mes:02d}/{ano}',
                'valor': 7.0 + (i % 4) * 0.2
            })

        return historico
