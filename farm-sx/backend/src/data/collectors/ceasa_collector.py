import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

class CEASACollector:
    """Coletor de dados de preços CEASA (Centrais de Abastecimento)"""

    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://api.ceasa.gov.br/api"  # URL exemplo
        self.api_key = api_key
        self.cached_data = {}
        self.cache_expiry = {}

    def obter_precos_cultura(
        self,
        cultura: str,
        municipio: str,
        dias: int = 30
    ) -> List[Dict]:
        """
        Obter histórico de preços de uma cultura

        Args:
            cultura: Nome da cultura (milho, feijão, etc)
            municipio: Município (Fortaleza, etc)
            dias: Dias de histórico

        Returns:
            Lista de dicts com {data, preco_minimo, preco_maximo, preco_medio, volume}
        """

        # Tentar cache primeiro
        cache_key = f"{cultura}_{municipio}"
        if cache_key in self.cached_data:
            if self.cache_expiry.get(cache_key, datetime.now()) > datetime.now():
                return self.cached_data[cache_key]

        # Dados simulados (em produção, seria uma API real)
        precos = self._gerar_dados_simulados(cultura, dias)

        # Armazenar em cache
        self.cached_data[cache_key] = precos
        self.cache_expiry[cache_key] = datetime.now() + timedelta(hours=6)

        return precos

    def obter_preco_atual(
        self,
        cultura: str,
        municipio: str
    ) -> Optional[Dict]:
        """Obter preço atual de uma cultura"""
        precos = self.obter_precos_cultura(cultura, municipio, dias=1)
        return precos[-1] if precos else None

    def listar_culturas_disponiveis(self) -> List[str]:
        """Listar culturas com preços disponíveis"""
        return [
            'milho', 'feijão', 'mandioca', 'tomate', 'melancia',
            'melão', 'cebola', 'alface', 'cebolinha', 'abacaxi',
            'banana', 'maçã', 'laranja', 'batata', 'cenoura'
        ]

    def listar_municipios(self) -> List[str]:
        """Listar municípios com dados CEASA"""
        return [
            'Fortaleza', 'Caucaia', 'Maracanaú', 'Pacajus',
            'Maranguape', 'Aquiraz', 'Eusébio', 'Horizonte',
            'São Gonçalo do Amarante', 'Itaitinga'
        ]

    def obter_tendencia_preco(
        self,
        cultura: str,
        municipio: str,
        dias: int = 30
    ) -> Dict:
        """
        Analisar tendência de preço

        Returns:
            Dict com {tendencia, variacao_percentual, preco_medio, volatilidade}
        """
        precos = self.obter_precos_cultura(cultura, municipio, dias)

        if not precos or len(precos) < 2:
            return {
                'tendencia': 'insuficiente',
                'variacao_percentual': 0,
                'preco_medio': 0,
                'volatilidade': 0
            }

        precos_medios = [p['preco_medio'] for p in precos]
        preco_inicial = precos_medios[0]
        preco_final = precos_medios[-1]
        variacao = ((preco_final - preco_inicial) / preco_inicial * 100) if preco_inicial > 0 else 0

        # Calcular volatilidade (desvio padrão)
        import numpy as np
        volatilidade = np.std(precos_medios)

        return {
            'tendencia': 'alta' if variacao > 5 else 'baixa' if variacao < -5 else 'estável',
            'variacao_percentual': round(variacao, 2),
            'preco_medio': round(sum(precos_medios) / len(precos_medios), 2),
            'volatilidade': round(volatilidade, 2),
            'preco_minimo': round(min(precos_medios), 2),
            'preco_maximo': round(max(precos_medios), 2)
        }

    def comparar_precos_municipios(
        self,
        cultura: str,
        municipios: List[str]
    ) -> Dict[str, Dict]:
        """Comparar preços da mesma cultura em diferentes municípios"""
        comparacao = {}

        for municipio in municipios:
            preco_atual = self.obter_preco_atual(cultura, municipio)
            if preco_atual:
                comparacao[municipio] = {
                    'preco_medio': preco_atual['preco_medio'],
                    'preco_minimo': preco_atual['preco_minimo'],
                    'preco_maximo': preco_atual['preco_maximo'],
                    'volume': preco_atual.get('volume', 0)
                }

        return comparacao

    def _gerar_dados_simulados(self, cultura: str, dias: int) -> List[Dict]:
        """Gerar dados simulados para teste"""
        precos_base = {
            'milho': 600,
            'feijão': 3500,
            'mandioca': 800,
            'tomate': 2000,
            'melancia': 800,
            'melão': 1500,
            'cebola': 2500,
            'alface': 3000,
            'cebolinha': 4000,
            'abacaxi': 2500,
            'banana': 1500,
            'maçã': 4000,
            'laranja': 1200,
            'batata': 3000,
            'cenoura': 2000
        }

        preco_base = precos_base.get(cultura.lower(), 1500)

        preços = []
        for i in range(dias):
            data = datetime.now() - timedelta(days=dias - i - 1)
            # Adicionar variação aleatória
            variacao = (hash(data.date().isoformat() + cultura) % 20 - 10) / 100
            preco_variado = preco_base * (1 + variacao)

            preços.append({
                'data': data.strftime('%Y-%m-%d'),
                'preco_minimo': round(preco_variado * 0.95, 2),
                'preco_maximo': round(preco_variado * 1.05, 2),
                'preco_medio': round(preco_variado, 2),
                'volume': hash(data.date().isoformat()) % 1000 + 500,
                'unidade': 'R$/kg'
            })

        return preços

    def exportar_csv(
        self,
        cultura: str,
        municipio: str,
        arquivo_saida: str,
        dias: int = 30
    ) -> bool:
        """Exportar dados para CSV"""
        import csv

        precos = self.obter_precos_cultura(cultura, municipio, dias)

        try:
            with open(arquivo_saida, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=precos[0].keys())
                writer.writeheader()
                writer.writerows(precos)
            return True
        except Exception as e:
            print(f"Erro ao exportar: {e}")
            return False
