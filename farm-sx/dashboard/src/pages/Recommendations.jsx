import React, { useState } from 'react'
import { Lightbulb, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Card from '../components/Card'

export default function Recommendations() {
  const [recommendations] = useState([
    {
      id: 1,
      tipo: 'solo',
      titulo: 'Análise de Solo Vencida',
      urgencia: 'alta',
      descricao: 'Última análise foi há 10 meses. Faça uma nova para melhor planejamento',
      acao: 'Realizar análise de solo',
      data: '2024-02-15',
      impacto: 'Melhora 20% na precisão das previsões'
    },
    {
      id: 2,
      tipo: 'clima',
      titulo: 'Alerta de Seca',
      urgencia: 'alta',
      descricao': 'Risco alto de seca previsto para os próximos 30 dias',
      acao: 'Preparar sistema de irrigação',
      data: '2024-02-20',
      impacto: 'Proteja sua colheita de perdas de até 30%'
    },
    {
      id: 3,
      tipo: 'economia',
      titulo: 'PRONAF com Taxa Reduzida',
      urgencia: 'media',
      descricao: 'Taxa SELIC em 10.5%. Programa PRONAF está com 4.5% a.a.',
      acao: 'Consultar sobre financiamento',
      data: '2024-02-22',
      impacto: 'Economia de até 6% em juros'
    },
    {
      id: 4,
      tipo: 'plantio',
      titulo': 'Otimizar Data de Plantio',
      urgencia: 'media',
      descricao: 'Análise de demanda indica pico de consumo em junho',
      acao: 'Usar otimizador de plantio',
      data: '2024-02-25',
      impacto: 'Aumente venda em 40% no pico'
    },
    {
      id: 5,
      tipo: 'subsidio',
      titulo: 'Nova Oportunidade: Seguro Safra',
      urgencia: 'media',
      descricao: 'Aberto inscrições para Seguro Safra 2024 com cobertura de até 90%',
      acao': 'Verificar elegibilidade',
      data: '2024-02-28',
      impacto: 'Proteção total contra riscos climáticos'
    },
    {
      id: 6,
      tipo: 'produtos',
      titulo': 'Atualizar Registro de Produtos',
      urgencia: 'baixa',
      descricao: 'Sem registros de produtos nos últimos 3 meses',
      acao: 'Registrar insumos utilizados',
      data': '2024-03-01',
      impacto: 'Melhor análise de eficiência'
    }
  ])

  const getIcon = (tipo) => {
    switch(tipo) {
      case 'solo': return '🌱'
      case 'clima': return '⛅'
      case 'economia': return '💰'
      case 'plantio': return '🌾'
      case 'subsidio': return '📋'
      case 'produtos': return '📦'
      default: return '✨'
    }
  }

  const getColor = (urgencia) => {
    switch(urgencia) {
      case 'alta': return 'bg-red-50 border-red-300'
      case 'media': return 'bg-yellow-50 border-yellow-300'
      case 'baixa': return 'bg-blue-50 border-blue-300'
      default: return 'bg-gray-50'
    }
  }

  const getUrgencyBadge = (urgencia) => {
    switch(urgencia) {
      case 'alta':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">Urgente</span>
      case 'media':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Importante</span>
      case 'baixa':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Sugestão</span>
      default:
        return null
    }
  }

  const urgentCount = recommendations.filter(r => r.urgencia === 'alta').length

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Recomendações Integradas</h1>
        <Lightbulb size={32} className="text-farm-600" />
      </div>

      {/* Resumo */}
      {urgentCount > 0 && (
        <Card className="mb-8 bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <h3 className="font-bold text-red-900">
                {urgentCount} {urgentCount === 1 ? 'recomendação urgente' : 'recomendações urgentes'}
              </h3>
              <p className="text-sm text-red-800">Ações imediatas podem melhorar sua produção</p>
            </div>
          </div>
        </Card>
      )}

      {/* Recomendações por Categoria */}
      <div className="space-y-4">
        {recommendations.map(rec => (
          <Card key={rec.id} className={`border-2 ${getColor(rec.urgencia)}`}>
            <div className="flex items-start gap-4">
              <div className="text-3xl">{getIcon(rec.tipo)}</div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{rec.titulo}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rec.descricao}</p>
                  </div>
                  {getUrgencyBadge(rec.urgencia)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-600">Ação Recomendada</p>
                    <p className="font-semibold text-gray-900">{rec.acao}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Data Limite</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={14} /> {rec.data}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Impacto Esperado</p>
                    <p className="font-semibold text-farm-600">{rec.impacto}</p>
                  </div>
                </div>

                <button className="mt-4 px-4 py-2 bg-farm-600 text-white rounded hover:bg-farm-700 text-sm font-semibold">
                  Ir para {rec.tipo === 'solo' ? 'Análise de Solo' :
                           rec.tipo === 'clima' ? 'Dados Climáticos' :
                           rec.tipo === 'economia' ? 'Economia' :
                           rec.tipo === 'subsidio' ? 'Subsídios' :
                           'Ação'}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Próximos Passos */}
      <Card className="mt-8 bg-farm-50 border border-farm-300">
        <h3 className="text-lg font-bold text-farm-900 mb-4">Plano de Ação Recomendado</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Semana 1</p>
              <p className="text-sm text-gray-700">Realizar análise de solo + preparar irrigação</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Semana 2</p>
              <p className="text-sm text-gray-700">Consultar sobre PRONAF e Seguro Safra</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lightbulb className="text-farm-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Semana 3</p>
              <p className="text-sm text-gray-700">Usar otimizador de plantio e registrar produtos</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
