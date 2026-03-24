import React, { useState, useEffect } from 'react'
import { AlertCircle, Leaf, Droplets, Zap } from 'lucide-react'
import Card from '../components/Card'

export default function Dashboard() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      tipo: 'solo',
      titulo: 'Análise de solo recomendada',
      mensagem: 'Última análise foi há 8 meses. Faça uma nova análise.',
      urgencia: 'media'
    },
    {
      id: 2,
      tipo: 'subsidio',
      titulo: 'Nova oportunidade de crédito',
      mensagem: 'Programa PRONAF com taxa reduzida está disponível',
      urgencia: 'alta'
    }
  ])

  const [stats, setStats] = useState([
    { label: 'Propriedades', valor: '2', icon: Leaf },
    { label: 'Análises de Solo', valor: '3', icon: Droplets },
    { label: 'Oportunidades Ativas', valor: '5', icon: Zap }
  ])

  const getUrgencyColor = (urgencia) => {
    const cores = {
      baixa: 'bg-blue-50 border-blue-200',
      media: 'bg-yellow-50 border-yellow-200',
      alta: 'bg-red-50 border-red-200',
      critica: 'bg-red-100 border-red-300'
    }
    return cores[urgencia] || cores.media
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-farm-700">{stat.valor}</p>
                </div>
                <Icon size={48} className="text-farm-200" />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Alerts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Alertas Importantes</h2>
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-lg ${getUrgencyColor(alert.urgencia)}`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{alert.titulo}</h3>
                  <p className="text-gray-700 text-sm mt-1">{alert.mensagem}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 bg-farm-50 rounded-lg p-6 border border-farm-200">
        <h3 className="font-bold text-farm-900 mb-4">Próximos Passos</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✓ Registrar nova análise de solo</li>
          <li>✓ Atualizar produtos utilizados</li>
          <li>✓ Verificar oportunidades de subsídios</li>
        </ul>
      </div>
    </div>
  )
}
