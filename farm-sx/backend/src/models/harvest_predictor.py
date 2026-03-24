import xgboost as xgb
import numpy as np
import pandas as pd
from typing import Optional, Dict, List
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class HarvestPrediction:
    cultura: str
    municipio: str
    area_hectares: float
    produtividade_estimada: float
    quantidade_prevista_kg: float
    data_colheita_prevista: str
    confianca: float
    variables_importance: Dict[str, float]

class HarvestPredictor:
    """Preditor de colheita usando XGBoost"""

    def __init__(self):
        self.model = None
        self.feature_names = [
            'area_hectares', 'mes_plantio', 'precipitacao_media',
            'temperatura_media', 'dias_para_colheita', 'ph_solo',
            'nitrogenio_ppm', 'fosforo_ppm', 'potassio_ppm',
            'materia_organica_percent', 'historico_produtividade'
        ]
        self._initialize_model()

    def _initialize_model(self):
        """Inicializa modelo com parâmetros padrão"""
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            objective='reg:squarederror'
        )

    def prever_colheita(
        self,
        cultura: str,
        municipio: str,
        area_hectares: float,
        data_plantio: str,
        dados_solo: Dict,
        dados_clima: Dict,
        historico_produtividade: Optional[float] = None
    ) -> HarvestPrediction:
        """
        Predizer colheita baseado em características do plantio

        Args:
            cultura: Nome da cultura
            municipio: Município
            area_hectares: Área plantada
            data_plantio: Data de plantio (YYYY-MM-DD)
            dados_solo: Dict com pH, NPK, materia_organica
            dados_clima: Dict com precipitação, temperatura
            historico_produtividade: Produtividade média histórica

        Returns:
            HarvestPrediction com previsões
        """

        # Preparar features
        data_plantio_dt = datetime.strptime(data_plantio, '%Y-%m-%d')
        dias_para_colheita = self._get_dias_colheita(cultura)

        features = np.array([[
            area_hectares,
            data_plantio_dt.month,
            dados_clima.get('precipitacao_media', 80),
            dados_clima.get('temperatura_media', 28),
            dias_para_colheita,
            dados_solo.get('ph', 6.0),
            dados_solo.get('nitrogenio_ppm', 30),
            dados_solo.get('fosforo_ppm', 15),
            dados_solo.get('potassio_ppm', 60),
            dados_solo.get('materia_organica_percent', 2.5),
            historico_produtividade or 3.5
        ]])

        # Predizer produtividade
        produtividade_pred = self.model.predict(features)[0]

        # Ajustes baseado em cultura
        produtividade_pred = self._aplicar_fatores_cultura(
            cultura, produtividade_pred, dados_clima
        )

        # Quantidade prevista
        quantidade_prevista = produtividade_pred * area_hectares * 1000  # em kg

        # Data de colheita
        data_colheita = data_plantio_dt + timedelta(days=dias_para_colheita)

        # Confiança baseada em dados
        confianca = self._calcular_confianca(dados_solo, dados_clima)

        # Importância das features
        importance = dict(zip(self.feature_names, self.model.feature_importances_))

        return HarvestPrediction(
            cultura=cultura,
            municipio=municipio,
            area_hectares=area_hectares,
            produtividade_estimada=produtividade_pred,
            quantidade_prevista_kg=quantidade_prevista,
            data_colheita_prevista=data_colheita.strftime('%Y-%m-%d'),
            confianca=confianca,
            variables_importance=importance
        )

    def _get_dias_colheita(self, cultura: str) -> int:
        """Retorna dias estimados até colheita por cultura"""
        ciclos = {
            'milho': 120,
            'feijão': 90,
            'mandioca': 240,
            'caju': 180,
            'melancia': 75,
            'melão': 80,
            'tomate': 100,
            'cebolinha': 60,
            'alface': 45
        }
        return ciclos.get(cultura.lower(), 120)

    def _aplicar_fatores_cultura(
        self,
        cultura: str,
        produtividade: float,
        dados_clima: Dict
    ) -> float:
        """Aplica fatores específicos por cultura"""

        # Fator precipitação (colheitas secas sofrem)
        precip = dados_clima.get('precipitacao_media', 80)
        if precip < 50:
            produtividade *= 0.7  # -30% em seca
        elif precip > 150:
            produtividade *= 0.8  # -20% em chuva excessiva

        # Fator temperatura
        temp = dados_clima.get('temperatura_media', 28)
        if temp < 20 or temp > 35:
            produtividade *= 0.85

        # Limites por cultura
        limites = {
            'milho': (3.0, 8.0),
            'feijão': (1.5, 3.5),
            'mandioca': (15.0, 30.0),
            'caju': (0.5, 2.0),
            'melancia': (10.0, 25.0),
            'melão': (15.0, 30.0),
            'tomate': (20.0, 50.0),
            'cebolinha': (10.0, 20.0),
            'alface': (25.0, 45.0)
        }

        min_prod, max_prod = limites.get(cultura.lower(), (0.5, 10.0))
        return max(min_prod, min(max_prod, produtividade))

    def _calcular_confianca(self, dados_solo: Dict, dados_clima: Dict) -> float:
        """Calcula nível de confiança da previsão (0-100%)"""
        confianca = 75.0

        # Reduz se dados de solo incompletos
        dados_solo_completo = all(k in dados_solo for k in ['ph', 'nitrogenio_ppm', 'fosforo_ppm'])
        if not dados_solo_completo:
            confianca -= 15

        # Reduz se dados de clima incompletos
        dados_clima_completo = all(k in dados_clima for k in ['precipitacao_media', 'temperatura_media'])
        if not dados_clima_completo:
            confianca -= 10

        # Aumenta se dados muito bons
        if dados_solo_completo and dados_clima_completo:
            confianca += 5

        return min(100, max(0, confianca))

    def train_model(self, X_train: np.ndarray, y_train: np.ndarray):
        """Treinar modelo com dados históricos"""
        self.model.fit(X_train, y_train)

    def get_feature_importance(self) -> Dict[str, float]:
        """Retornar importância das features"""
        return dict(zip(self.feature_names, self.model.feature_importances_))
