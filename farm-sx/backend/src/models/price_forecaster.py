from prophet import Prophet
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

@dataclass
class PriceForecast:
    cultura: str
    municipio: str
    mes_previsto: int
    ano_previsto: int
    preco_previsto: float
    intervalo_inferior: float
    intervalo_superior: float
    tendencia: str
    sazonalidade: float

class PriceForecaster:
    """Preditor de preços usando Prophet"""

    def __init__(self):
        self.models = {}  # Dict cultura -> modelo Prophet

    def treinar_modelo(
        self,
        cultura: str,
        dados_historicos: List[Dict]
    ) -> bool:
        """
        Treinar modelo Prophet para uma cultura

        Args:
            cultura: Nome da cultura
            dados_historicos: Lista com {'data': str, 'preco': float}

        Returns:
            True se treinamento bem-sucedido
        """
        if len(dados_historicos) < 14:  # Mínimo de 2 semanas
            return False

        # Preparar DataFrame para Prophet
        df = pd.DataFrame([
            {
                'ds': pd.to_datetime(d['data']),
                'y': float(d['preco'])
            }
            for d in dados_historicos
        ]).sort_values('ds')

        try:
            # Criar e treinar modelo
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                interval_width=0.95,
                changepoint_prior_scale=0.05
            )
            model.fit(df)
            self.models[cultura] = {
                'model': model,
                'historico': df,
                'treino_date': datetime.now()
            }
            return True
        except Exception as e:
            print(f"Erro ao treinar modelo para {cultura}: {e}")
            return False

    def prever_preco(
        self,
        cultura: str,
        municipio: str,
        meses_adiante: int = 3
    ) -> List[PriceForecast]:
        """
        Prever preços para os próximos N meses

        Args:
            cultura: Nome da cultura
            municipio: Município
            meses_adiante: Quantos meses prever

        Returns:
            Lista de PriceForecast
        """
        if cultura not in self.models:
            return []

        model_data = self.models[cultura]
        model = model_data['model']

        # Criar dataframe com datas futuras
        future = model.make_future_dataframe(periods=meses_adiante, freq='M')

        # Fazer previsão
        forecast = model.predict(future)

        # Pegar últimas N previsões (futuras)
        future_forecast = forecast.tail(meses_adiante).copy()

        # Converter em PriceForecast
        previsoes = []
        data_atual = datetime.now()

        for idx, row in future_forecast.iterrows():
            data_pred = pd.to_datetime(row['ds'])
            mes = data_pred.month
            ano = data_pred.year

            # Calcular tendência
            historico = model_data['historico'].tail(12)
            if len(historico) >= 2:
                preco_media_antigo = historico.head(6)['y'].mean()
                preco_media_novo = historico.tail(6)['y'].mean()
                tendencia_valor = preco_media_novo - preco_media_antigo
                tendencia = "alta" if tendencia_valor > 0 else "baixa" if tendencia_valor < 0 else "estável"
            else:
                tendencia = "estável"

            # Calcular sazonalidade
            sazonalidade = self._calcular_sazonalidade(cultura, mes, model_data['historico'])

            previsoes.append(PriceForecast(
                cultura=cultura,
                municipio=municipio,
                mes_previsto=mes,
                ano_previsto=ano,
                preco_previsto=max(0, float(row['yhat'])),
                intervalo_inferior=max(0, float(row['yhat_lower'])),
                intervalo_superior=float(row['yhat_upper']),
                tendencia=tendencia,
                sazonalidade=sazonalidade
            ))

        return previsoes

    def _calcular_sazonalidade(
        self,
        cultura: str,
        mes: int,
        historico: pd.DataFrame
    ) -> float:
        """Calcular fator de sazonalidade para o mês"""

        # Padrões de sazonalidade por cultura (média de preço relativa)
        padroes = {
            'milho': {1: 1.1, 2: 1.15, 3: 1.2, 4: 1.0, 5: 0.95, 6: 0.9,
                     7: 0.85, 8: 0.8, 9: 0.85, 10: 0.95, 11: 1.05, 12: 1.1},
            'feijão': {1: 1.3, 2: 1.4, 3: 1.35, 4: 1.1, 5: 0.9, 6: 0.8,
                      7: 0.75, 8: 0.8, 9: 0.9, 10: 1.1, 11: 1.25, 12: 1.3},
            'tomate': {1: 0.8, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.05, 6: 1.1,
                      7: 1.15, 8: 1.2, 9: 1.1, 10: 0.95, 11: 0.85, 12: 0.8},
            'melancia': {1: 1.3, 2: 1.35, 3: 1.2, 4: 1.0, 5: 0.8, 6: 0.75,
                        7: 0.7, 8: 0.75, 9: 0.85, 10: 1.05, 11: 1.2, 12: 1.3},
            'melão': {1: 1.25, 2: 1.3, 3: 1.15, 4: 0.95, 5: 0.8, 6: 0.75,
                     7: 0.75, 8: 0.8, 9: 0.9, 10: 1.1, 11: 1.2, 12: 1.25},
        }

        if cultura.lower() in padroes:
            return padroes[cultura.lower()].get(mes, 1.0)

        # Se não tiver padrão, calcular do histórico
        if len(historico) > 0:
            mes_historico = historico[historico['ds'].dt.month == mes]
            if len(mes_historico) > 0:
                preco_mes = mes_historico['y'].mean()
                preco_geral = historico['y'].mean()
                return preco_mes / preco_geral if preco_geral > 0 else 1.0

        return 1.0

    def simular_cenarios(
        self,
        cultura: str,
        municipio: str,
        area_hectares: float,
        produtividade_estimada: float
    ) -> Dict:
        """
        Simular cenários de receita baseado em previsões

        Args:
            cultura: Nome da cultura
            municipio: Município
            area_hectares: Área
            produtividade_estimada: Produtividade em t/ha

        Returns:
            Dict com cenários (otimista, provável, pessimista)
        """
        previsoes = self.prever_preco(cultura, municipio, meses_adiante=6)

        if not previsoes:
            return {}

        quantidade_total_kg = produtividade_estimada * area_hectares * 1000

        cenarios = {
            'otimista': {},
            'provavel': {},
            'pessimista': {}
        }

        for previsao in previsoes:
            mes_ano = f"{previsao.mes_previsto:02d}/{previsao.ano_previsto}"

            # Cenário Pessimista (preço mínimo)
            preco_pessimista = previsao.intervalo_inferior
            receita_pessimista = quantidade_total_kg * (preco_pessimista / 1000)

            # Cenário Provável (preço esperado)
            preco_provavel = previsao.preco_previsto
            receita_provavel = quantidade_total_kg * (preco_provavel / 1000)

            # Cenário Otimista (preço máximo)
            preco_otimista = previsao.intervalo_superior
            receita_otimista = quantidade_total_kg * (preco_otimista / 1000)

            cenarios['pessimista'][mes_ano] = {
                'preco': preco_pessimista,
                'receita': receita_pessimista
            }
            cenarios['provavel'][mes_ano] = {
                'preco': preco_provavel,
                'receita': receita_provavel
            }
            cenarios['otimista'][mes_ano] = {
                'preco': preco_otimista,
                'receita': receita_otimista
            }

        return cenarios

    def get_modelo_info(self, cultura: str) -> Dict:
        """Retornar informações sobre o modelo treinado"""
        if cultura not in self.models:
            return {}

        model_data = self.models[cultura]
        return {
            'cultura': cultura,
            'treino_date': model_data['treino_date'].isoformat(),
            'registros': len(model_data['historico']),
            'preco_medio': float(model_data['historico']['y'].mean()),
            'preco_min': float(model_data['historico']['y'].min()),
            'preco_max': float(model_data['historico']['y'].max()),
            'volatilidade': float(model_data['historico']['y'].std())
        }
