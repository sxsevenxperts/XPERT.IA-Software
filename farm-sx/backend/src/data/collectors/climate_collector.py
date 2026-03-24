import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

class ClimateCollector:
    """Coletor de dados climáticos FUNCEME (Fundação Cearense de Meteorologia)"""

    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://api.funceme.br"  # URL exemplo
        self.api_key = api_key

    def obter_previsao_tempo(
        self,
        municipio: str,
        dias: int = 15
    ) -> List[Dict]:
        """
        Obter previsão de tempo

        Returns:
            Lista com {data, temperatura_min, temperatura_max, precipitacao, umidade}
        """
        # Dados simulados (em produção seria API FUNCEME real)
        return self._gerar_previsao_simulada(municipio, dias)

    def obter_indice_secas(
        self,
        municipio: str
    ) -> Dict:
        """
        Obter índice de secas

        Returns:
            Dict com {risco_seca, precipitacao_acumulada, deficit_hidrico}
        """
        return {
            'municipio': municipio,
            'risco_seca': 'medio',  # baixo, medio, alto
            'precipitacao_acumulada_ano': 450,  # mm
            'precipitacao_media_esperada': 800,  # mm
            'deficit_hidrico': 350,  # mm
            'dias_sem_chuva': 15,
            'prox_sistema_chuva': '5-7 dias',
            'recomendacao': 'Irrigar culturas sensíveis'
        }

    def obter_dados_historicos(
        self,
        municipio: str,
        mes: int,
        ano: int
    ) -> Dict:
        """Obter dados climáticos históricos de um mês"""
        return {
            'municipio': municipio,
            'mes': mes,
            'ano': ano,
            'temperatura_media': 28.5,
            'temperatura_maxima': 35.2,
            'temperatura_minima': 21.3,
            'precipitacao_total': 85.4,  # mm
            'dias_com_chuva': 8,
            'umidade_media': 68,
            'velocidade_vento': 3.2  # m/s
        }

    def alertas_clima(
        self,
        municipio: str
    ) -> List[Dict]:
        """Obter alertas climáticos ativos"""
        return [
            {
                'tipo': 'aviso',
                'titulo': 'Possível chuva forte',
                'descricao': 'Previsão de chuva acima de 30mm nos próximos 3 dias',
                'data': datetime.now().isoformat(),
                'urgencia': 'media'
            }
        ]

    def obter_radiacao_solar(
        self,
        municipio: str,
        data: Optional[str] = None
    ) -> Dict:
        """Obter dados de radiação solar"""
        if data is None:
            data = datetime.now().strftime('%Y-%m-%d')

        return {
            'municipio': municipio,
            'data': data,
            'radiacao_solar': 22.5,  # MJ/m²
            'horas_brilho': 10.2,
            'indice_uv': 11
        }

    def obter_umidade_relativa(
        self,
        municipio: str
    ) -> Dict:
        """Obter umidade relativa do ar"""
        return {
            'municipio': municipio,
            'data': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'umidade_atual': 72,
            'umidade_minima': 45,
            'umidade_maxima': 89,
            'ponto_orvalho': 18.5
        }

    def risco_pragas_doencas(
        self,
        municipio: str,
        cultura: str
    ) -> Dict:
        """Avaliar risco de pragas e doenças baseado no clima"""
        return {
            'cultura': cultura,
            'municipio': municipio,
            'risco_ferrugem': 'baixo',
            'risco_oillo': 'medio',
            'risco_lagarta': 'alto',
            'recomendacao': 'Monitorar semanalmente'
        }

    def comparacao_municipios(
        self,
        municipios: List[str],
        dias: int = 7
    ) -> Dict[str, Dict]:
        """Comparar clima entre diferentes municípios"""
        comparacao = {}

        for municipio in municipios:
            previsao = self._gerar_previsao_simulada(municipio, dias)
            if previsao:
                temps = [p['temperatura_media'] for p in previsao]
                precips = [p['precipitacao'] for p in previsao]

                comparacao[municipio] = {
                    'temperatura_media': sum(temps) / len(temps),
                    'precipitacao_total': sum(precips),
                    'melhor_para_plantio': sum(precips) > 20
                }

        return comparacao

    def _gerar_previsao_simulada(
        self,
        municipio: str,
        dias: int
    ) -> List[Dict]:
        """Gerar previsão simulada para teste"""
        previsao = []
        temp_base = 28

        for i in range(dias):
            data = datetime.now() + timedelta(days=i)

            # Variação baseada no hash da data para simular padrão
            variacao = (hash(data.date().isoformat() + municipio) % 10 - 5)

            previsao.append({
                'data': data.strftime('%Y-%m-%d'),
                'temperatura_min': round(temp_base - 5 + variacao * 0.5, 1),
                'temperatura_max': round(temp_base + 5 + variacao * 0.5, 1),
                'temperatura_media': round(temp_base + variacao * 0.3, 1),
                'precipitacao': round((hash(data.date().isoformat()) % 50) + 5, 1),
                'umidade': round(60 + variacao * 2, 1),
                'vento': round(2 + variacao * 0.3, 1),
                'condicao': 'Nublado' if variacao > 2 else 'Ensolarado' if variacao < -2 else 'Variável'
            })

        return previsao

    def previsao_demanda_agua(
        self,
        cultura: str,
        municipio: str,
        area_hectares: float
    ) -> Dict:
        """Estimar demanda de água baseado no clima previsto"""

        previsao = self._gerar_previsao_simulada(municipio, 30)

        # ET0 (evapotranspiração)
        et0_media = sum(p['temperatura_media'] for p in previsao) / len(previsao) * 0.15

        # Coeficiente de cultivo por tipo
        kc_cultura = {
            'milho': 1.2,
            'feijão': 1.0,
            'tomate': 1.1,
            'melancia': 1.0,
            'alface': 0.8,
            'cebolinha': 0.9,
            'mandioca': 0.8,
            'caju': 0.6
        }

        kc = kc_cultura.get(cultura.lower(), 1.0)
        etc = et0_media * kc

        precipitacao_prevista = sum(p['precipitacao'] for p in previsao)
        demanda_irrigacao = max(0, (etc * 30 - precipitacao_prevista) * area_hectares)

        return {
            'cultura': cultura,
            'municipio': municipio,
            'area_hectares': area_hectares,
            'et0_media': round(et0_media, 2),
            'etc': round(etc, 2),
            'precipitacao_prevista': round(precipitacao_prevista, 2),
            'demanda_irrigacao_total': round(demanda_irrigacao, 0),
            'demanda_irrigacao_diaria': round(demanda_irrigacao / 30, 2),
            'unidade': 'm³'
        }
