import React, { useState } from 'react'
import { DollarSign, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import Card from '../components/Card'

export default function SubsidiesOpportunities() {
  const [selectedTab, setSelectedTab] = useState('disponivel')
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      titulo: 'PRONAF - Programa Nacional de Fortalecimento da Agricultura Familiar',
      tipo: 'credito',
      orgao: 'Banco do Brasil',
      descricao: 'Crédito para custeio e investimento em propriedades familiares',
      valorMin: 2500,
      valorMax: 500000,
      taxa: 4.5,
      dataInicio: '2024-01-15',
      dataFim: '2024-12-31',
      status: 'disponivel',
      aprovacao: 85,
      linkDoc: 'https://example.com/pronaf'
    },
    {
      id: 2,
      titulo: 'Seguro Safra 2024',
      tipo: 'seguro',
      orgao: 'MAPA',
      descricao: 'Seguro para proteção contra riscos climáticos',
      valorMin: 5000,
      valorMax: 1000000,
      taxa: null,
      dataInicio: '2024-02-01',
      dataFim: '2024-09-30',
      status: 'disponivel',
      aprovacao: 92,
      linkDoc: 'https://example.com/safra'
    },
    {
      id: 3,
      titulo: 'Crédito Sustentável',
      tipo: 'credito',
      orgao: 'Caixa Econômica Federal',
      descricao: 'Crédito com juros reduzidos para práticas sustentáveis',
      valorMin: 10000,
      valorMax: 300000,
      taxa: 3.8,
      dataInicio: '2024-01-01',
      dataFim: '2025-06-30',
      status: 'disponivel',
      aprovacao: 78,
      linkDoc: 'https://example.com/sustentavel'
    }
  ])

  const [applications, setApplications] = useState([
    {
      id: 1,
      oportunidadeId: 1,
      titulo: 'PRONAF - Programa Nacional de Fortalecimento da Agricultura Familiar',
      status: 'aprovado',
      dataEnvio: '2024-01-20',
      dataResposta: '2024-02-05',
      valorSolicitado: 50000,
      valorAprovado: 50000
    }
  ])

  const getStatusColor = (status) => {
    const cores = {
      disponivel: 'bg-green-100 text-green-800',
      enviado: 'bg-yellow-100 text-yellow-800',
      aprovado: 'bg-green-100 text-green-800',
      rejeitado: 'bg-red-100 text-red-800'
    }
    return cores[status] || 'bg-gray-100 text-gray-800'
  }

  const getTipoIcon = (tipo) => {
    if (tipo === 'credito') return '💰'
    if (tipo === 'subvencao') return '🎁'
    if (tipo === 'seguro') return '🛡️'
    return '📋'
  }

  const handleApply = (opp) => {
    if (applications.find(a => a.oportunidadeId === opp.id)) {
      alert('Você já se candidatou para esta oportunidade')
      return
    }
    setApplications([
      {
        id: applications.length + 1,
        oportunidadeId: opp.id,
        titulo: opp.titulo,
        status: 'enviado',
        dataEnvio: new Date().toISOString().split('T')[0],
        dataResposta: null,
        valorSolicitado: opp.valorMin,
        valorAprovado: null
      },
      ...applications
    ])
    alert('Candidatura enviada com sucesso!')
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Oportunidades de Subsídios</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('disponivel')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            selectedTab === 'disponivel'
              ? 'border-farm-600 text-farm-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Oportunidades Disponíveis
        </button>
        <button
          onClick={() => setSelectedTab('aplicacoes')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            selectedTab === 'aplicacoes'
              ? 'border-farm-600 text-farm-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Minhas Candidaturas
        </button>
      </div>

      {/* Oportunidades */}
      {selectedTab === 'disponivel' && (
        <div className="space-y-4">
          {opportunities.map(opp => (
            <Card key={opp.id} className="bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getTipoIcon(opp.tipo)}</span>
                    <h3 className="text-lg font-bold text-gray-900">{opp.titulo}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(opp.status)}`}>
                      {opp.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{opp.descricao}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-600 text-xs">Órgão</p>
                      <p className="font-semibold">{opp.orgao}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Valor</p>
                      <p className="font-semibold">
                        R$ {(opp.valorMin / 1000).toFixed(0)}K - R$ {(opp.valorMax / 1000).toFixed(0)}K
                      </p>
                    </div>
                    {opp.taxa && (
                      <div>
                        <p className="text-gray-600 text-xs">Taxa de Juros</p>
                        <p className="font-semibold">{opp.taxa}% a.a.</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 text-xs">Taxa de Aprovação</p>
                      <p className="font-semibold text-green-600">{opp.aprovacao}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle size={16} />
                    <span>Válido até {opp.dataFim}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleApply(opp)}
                    className="bg-farm-600 text-white px-4 py-2 rounded-lg hover:bg-farm-700 font-semibold whitespace-nowrap"
                  >
                    Candidatar-se
                  </button>
                  <a
                    href={opp.linkDoc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-farm-600 text-farm-600 px-4 py-2 rounded-lg hover:bg-farm-50 text-sm"
                  >
                    <ExternalLink size={16} />
                    Documentação
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Candidaturas */}
      {selectedTab === 'aplicacoes' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="bg-farm-50 border border-farm-200 p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-farm-600 mb-4" />
              <p className="text-gray-700 mb-2">Nenhuma candidatura ainda</p>
              <p className="text-gray-600 text-sm">
                Volte à aba anterior e se candidate para alguma oportunidade
              </p>
            </Card>
          ) : (
            applications.map(app => (
              <Card key={app.id} className="bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle size={20} className={`${
                        app.status === 'aprovado' ? 'text-green-600' :
                        app.status === 'rejeitado' ? 'text-red-600' :
                        'text-yellow-600'
                      }`} />
                      <h3 className="text-lg font-bold text-gray-900">{app.titulo}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-gray-600 text-xs">Data de Envio</p>
                        <p className="font-semibold">{app.dataEnvio}</p>
                      </div>
                      {app.dataResposta && (
                        <div>
                          <p className="text-gray-600 text-xs">Data de Resposta</p>
                          <p className="font-semibold">{app.dataResposta}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600 text-xs">Valor Solicitado</p>
                        <p className="font-semibold">R$ {app.valorSolicitado?.toLocaleString()}</p>
                      </div>
                      {app.valorAprovado && (
                        <div>
                          <p className="text-gray-600 text-xs">Valor Aprovado</p>
                          <p className="font-semibold text-green-600">R$ {app.valorAprovado?.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
