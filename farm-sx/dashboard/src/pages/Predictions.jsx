import React, { useState } from 'react'
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import Card from '../components/Card'

export default function Predictions() {
  const [predictions] = useState([
    {
      id: 1,
      cultura: 'Milho',
      municipio: 'Fortaleza',
      area: 10,
      produtividade: 3.5,
      quantidade: 35000,
      dataColheita: '2024-06-20',
      confianca: 82,
      cenarios: [
        { tipo: 'Otimista', produtividade: 4.2 },
        { tipo: 'Base', produtividade: 3.5 },
        { tipo: 'Pessimista', produtividade: 2.8 }
      ]
    },
    {
      id: 2,
      cultura: 'Feijão',
      municipio: 'Fortaleza',
      area: 5,
      produtividade: 2.0,
      quantidade: 10000,
      dataColheita: '2024-05-15',
      confianca: 75,
      cenarios: [
        { tipo: 'Otimista', produtividade: 2.5 },
        { tipo: 'Base', produtividade: 2.0 },
        { tipo: 'Pessimista', produtividade: 1.5 }
      ]
    }
  ])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Previsões de Colheita</h1>
        <TrendingUp size={32} className="text-farm-600" />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-farm-100 to-farm-50">
          <h3 className="text-farm-900 font-semibold mb-2">Plantios Analisados</h3>
          <p className="text-3xl font-bold text-farm-700">{predictions.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50">
          <h3 className="text-yellow-900 font-semibold mb-2">Confiança Média</h3>
          <p className="text-3xl font-bold text-yellow-700">
            {Math.round(predictions.reduce((sum, p) => sum + p.confianca, 0) / predictions.length)}%
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-green-100 to-green-50">
          <h3 className="text-green-900 font-semibold mb-2">Quantidade Total</h3>
          <p className="text-3xl font-bold text-green-700">
            {(predictions.reduce((sum, p) => sum + p.quantidade, 0) / 1000).toFixed(0)}K kg
          </p>
        </Card>
      </div>

      {/* Detalhes */}
      <div className="space-y-6">
        {predictions.map(pred => (
          <Card key={pred.id} className="bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{pred.cultura}</h2>
                <p className="text-gray-600">{pred.municipio} • {pred.area} hectares</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Confiança</p>
                <p className="text-2xl font-bold text-farm-600">{pred.confianca}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600 text-xs">Produtividade</p>
                <p className="text-lg font-semibold">{pred.produtividade} t/ha</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600 text-xs">Quantidade</p>
                <p className="text-lg font-semibold">{(pred.quantidade / 1000).toFixed(0)}K kg</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600 text-xs">Data Colheita</p>
                <p className="text-lg font-semibold">{pred.dataColheita}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600 text-xs">Status</p>
                <p className="text-lg font-semibold text-farm-600">✓ Ótimo</p>
              </div>
            </div>

            {/* Cenários */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Cenários</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pred.cenarios.map((cenario, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-3">
                    <p className="text-sm text-gray-600">{cenario.tipo}</p>
                    <p className="text-lg font-bold text-gray-900">{cenario.produtividade} t/ha</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(cenario.produtividade * pred.area * 1000).toFixed(0)} kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dica */}
      <Card className="mt-8 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Dica</h3>
            <p className="text-sm text-blue-800">
              Atualize sua análise de solo regularmente para melhorar a precisão das previsões.
              Dados mais recentes = previsões mais confiáveis.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
