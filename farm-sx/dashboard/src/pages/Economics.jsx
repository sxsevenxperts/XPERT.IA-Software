import React, { useState } from 'react'
import { BarChart3, TrendingDown, AlertCircle } from 'lucide-react'
import Card from '../components/Card'

export default function Economics() {
  const [indicators] = useState({
    ipca: 4.52,
    selic: 10.50,
    desemprego: 7.8,
    inflacao_alimentos: 8.2,
    cambio: 5.25
  })

  const [cenarios] = useState({
    pessimista: {
      titulo: 'Seca + Inflação',
      probabilidade: 25,
      ipca: 7.0,
      selic: 12.0,
      impacto: -25
    },
    base: {
      titulo: 'Situação Atual',
      probabilidade: 50,
      ipca: 4.5,
      selic: 10.5,
      impacto: 0
    },
    otimista: {
      titulo: 'Chuvas + Crescimento',
      probabilidade: 25,
      ipca: 2.5,
      selic: 8.5,
      impacto: 20
    }
  })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Análise Econômica</h1>
        <BarChart3 size={32} className="text-farm-600" />
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-white border-2 border-red-200">
          <p className="text-gray-600 text-sm">IPCA</p>
          <p className="text-2xl font-bold text-gray-900">{indicators.ipca}%</p>
          <p className="text-xs text-red-600 mt-2">↑ Inflação acelerando</p>
        </Card>
        <Card className="bg-white border-2 border-orange-200">
          <p className="text-gray-600 text-sm">SELIC</p>
          <p className="text-2xl font-bold text-gray-900">{indicators.selic}%</p>
          <p className="text-xs text-orange-600 mt-2">↑ Juros elevados</p>
        </Card>
        <Card className="bg-white border-2 border-yellow-200">
          <p className="text-gray-600 text-sm">Desemprego</p>
          <p className="text-2xl font-bold text-gray-900">{indicators.desemprego}%</p>
          <p className="text-xs text-yellow-600 mt-2">Estável</p>
        </Card>
        <Card className="bg-white border-2 border-red-200">
          <p className="text-gray-600 text-sm">Inflação Alimentos</p>
          <p className="text-2xl font-bold text-gray-900">{indicators.inflacao_alimentos}%</p>
          <p className="text-xs text-red-600 mt-2">↑ Custos altos</p>
        </Card>
        <Card className="bg-white border-2 border-blue-200">
          <p className="text-gray-600 text-sm">Câmbio USD/BRL</p>
          <p className="text-2xl font-bold text-gray-900">{indicators.cambio.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-2">Estável</p>
        </Card>
      </div>

      {/* Cenários */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cenários Econômicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(cenarios).map(([key, cenario]) => (
            <Card key={key} className={`${
              key === 'pessimista' ? 'border-2 border-red-300 bg-red-50' :
              key === 'otimista' ? 'border-2 border-green-300 bg-green-50' :
              'border-2 border-gray-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{cenario.titulo}</h3>
                <span className="text-sm font-bold text-gray-600">{cenario.probabilidade}%</span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">IPCA previsto</p>
                  <p className="font-semibold">{cenario.ipca}%</p>
                </div>
                <div>
                  <p className="text-gray-600">SELIC prevista</p>
                  <p className="font-semibold">{cenario.selic}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Impacto na agricultura</p>
                  <p className={`font-semibold ${
                    cenario.impacto > 0 ? 'text-green-600' :
                    cenario.impacto < 0 ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {cenario.impacto > 0 ? '+' : ''}{cenario.impacto}%
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Análise de Impacto */}
      <Card className="bg-white mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Impacto na Sua Produção</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2">Custo de Produção Estimado</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900">R$ 15.000</p>
              <p className="text-red-600 font-semibold mb-1">↑ +8% em 6 meses</p>
            </div>
          </div>

          <div>
            <p className="text-gray-600 mb-2">Receita Estimada</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900">R$ 35.000</p>
              <p className="text-green-600 font-semibold mb-1">↑ +5% em 6 meses</p>
            </div>
          </div>

          <div>
            <p className="text-gray-600 mb-2">Margem de Lucro</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-farm-600">57%</p>
              <p className="text-yellow-600 font-semibold mb-1">↓ -3% em 6 meses</p>
            </div>
          </div>

          <div>
            <p className="text-gray-600 mb-2">ROI Estimado</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-gray-900">133%</p>
              <p className="text-green-600 font-semibold mb-1">Aceitável</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recomendações */}
      <Card className="bg-yellow-50 border border-yellow-200">
        <div className="flex gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-900 mb-2">Recomendações</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• SELIC alta: busque PRONAF com taxa reduzida</li>
              <li>• Inflação em alimentos: monitore custos de insumos</li>
              <li>• Margem reduzindo: aumente produtividade ou área</li>
              <li>• Câmbio favorável: considere exportação</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
