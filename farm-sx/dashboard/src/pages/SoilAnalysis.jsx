import React, { useState } from 'react'
import { Plus, Droplets } from 'lucide-react'
import Card from '../components/Card'

export default function SoilAnalysis() {
  const [showForm, setShowForm] = useState(false)
  const [analyses, setAnalyses] = useState([
    {
      id: 1,
      data: '2024-02-15',
      ph: 6.2,
      nitrogenio: 35,
      fosforo: 18,
      potassio: 75,
      materiaOrganica: 3.2,
      score: 82
    },
    {
      id: 2,
      data: '2023-08-20',
      ph: 5.8,
      nitrogenio: 28,
      fosforo: 14,
      potassio: 60,
      materiaOrganica: 2.8,
      score: 72
    }
  ])

  const [formData, setFormData] = useState({
    data: '',
    ph: '',
    nitrogenio: '',
    fosforo: '',
    potassio: '',
    materiaOrganica: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newAnalysis = {
      id: analyses.length + 1,
      ...formData,
      score: Math.random() * 30 + 70
    }
    setAnalyses([newAnalysis, ...analyses])
    setFormData({
      data: '',
      ph: '',
      nitrogenio: '',
      fosforo: '',
      potassio: '',
      materiaOrganica: ''
    })
    setShowForm(false)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Análise de Solo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-farm-600 text-white px-4 py-2 rounded-lg hover:bg-farm-700"
        >
          <Plus size={20} />
          Nova Análise
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-8 bg-white">
          <h2 className="text-xl font-bold mb-4">Registrar Nova Análise</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="pH"
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Nitrogênio (ppm)"
                value={formData.nitrogenio}
                onChange={(e) => setFormData({ ...formData, nitrogenio: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Fósforo (ppm)"
                value={formData.fosforo}
                onChange={(e) => setFormData({ ...formData, fosforo: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Potássio (ppm)"
                value={formData.potassio}
                onChange={(e) => setFormData({ ...formData, potassio: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Matéria Orgânica (%)"
                value={formData.materiaOrganica}
                onChange={(e) => setFormData({ ...formData, materiaOrganica: e.target.value })}
                className="border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-farm-600 text-white px-4 py-2 rounded hover:bg-farm-700">
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Analyses List */}
      <div className="space-y-4">
        {analyses.map(analysis => (
          <Card key={analysis.id} className="bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets size={20} className="text-farm-600" />
                  <h3 className="text-lg font-semibold">Análise de {analysis.data}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">pH</p>
                    <p className="text-lg font-semibold">{analysis.ph}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">N (ppm)</p>
                    <p className="text-lg font-semibold">{analysis.nitrogenio}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">P (ppm)</p>
                    <p className="text-lg font-semibold">{analysis.fosforo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">K (ppm)</p>
                    <p className="text-lg font-semibold">{analysis.potassio}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">MO (%)</p>
                    <p className="text-lg font-semibold">{analysis.materiaOrganica}%</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm mb-2">Score de Saúde</p>
                <p className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                  {Math.round(analysis.score)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
