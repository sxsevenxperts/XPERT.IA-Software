import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react'
import { fetchCasePrediction, analyzeCaseWithAI } from '../lib/supabase'

const riscoConfig = {
  baixo: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'Baixo Risco' },
  medio: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'Risco Médio' },
  alto: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'Alto Risco' },
  critico: { color: 'var(--red)', bg: 'rgba(239,68,68,0.2)', label: 'Risco Crítico' },
}

export default function CasePredictionCard({ casoId, caso, userId, onAnalyze }) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const loadPrediction = async () => {
      if (casoId) {
        const { data } = await fetchCasePrediction(casoId)
        setPrediction(data)
      }
    }
    loadPrediction()
  }, [casoId])

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const { data, error } = await analyzeCaseWithAI({
        caso_id: casoId,
        tipo: caso?.tipo,
        descricao: caso?.descricao,
        cliente: caso?.cliente,
        tribunal: caso?.tribunal,
      })

      if (!error && data) {
        setPrediction(data.prediction)
        onAnalyze?.()
      }
    } finally {
      setLoading(false)
    }
  }

  if (!prediction && !loading) {
    return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        transition: 'all 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        onClick={handleAnalyze}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={20} style={{ color: 'var(--purple)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Análise com IA Ainda Não Realizada</h3>
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: '4px 0 0 0' }}>Clique para analisar viabilidade do caso com inteligência artificial</p>
        </div>
        <div style={{ fontSize: 14, opacity: 0.5 }}>→</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 16, textAlign: 'center', color: 'var(--text3)'
      }}>
        <div style={{ fontSize: 24, animation: 'spin 2s linear infinite', marginBottom: 8 }}>🧠</div>
        <p style={{ margin: 0, fontSize: 12 }}>Analisando caso com IA...</p>
      </div>
    )
  }

  const riscoInfo = riscoConfig[prediction?.risco_nivel || 'medio']

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: 16, transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={20} style={{ color: 'var(--purple)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Análise de Viabilidade IA</h3>
          <p style={{ fontSize: 10, color: 'var(--text4)', margin: '4px 0 0 0' }}>Atualizado há {new Date(prediction?.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 18 }}>{expanded ? '▼' : '▶'}</div>
      </div>

      {/* Main Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
            {prediction?.viabilidade_percentual}%
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>Viabilidade</div>
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
            {prediction?.confianca_percentual}%
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>Confiança</div>
        </div>

        <div style={{ background: riscoInfo.bg, borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: riscoInfo.color, marginBottom: 4 }}>
            {riscoInfo.label}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>Risco</div>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div style={{ animation: 'fadeIn 0.2s ease-in' }}>
          {/* Fatores Positivos */}
          {prediction?.fatores_positivos?.length > 0 && (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Fatores Positivos</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: 'var(--text3)' }}>
                {prediction.fatores_positivos.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Fatores Negativos */}
          {prediction?.fatores_negativos?.length > 0 && (
            <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={14} style={{ color: 'var(--red)' }} />
                <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Fatores Negativos</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: 'var(--text3)' }}>
                {prediction.fatores_negativos.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          {prediction?.recomendacoes?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Zap size={14} style={{ color: 'var(--amber)' }} />
                <h4 style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Recomendações</h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: 'var(--text3)' }}>
                {prediction.recomendacoes.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Análise Completa */}
          {prediction?.analise_completa && (
            <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                {prediction.analise_completa}
              </p>
            </div>
          )}

          {/* Reanalisar */}
          <button onClick={handleAnalyze} disabled={loading}
            style={{
              width: '100%', padding: '8px', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.5 : 1
            }}>
            <RefreshCw size={14} />
            Reanalisar com IA
          </button>
        </div>
      )}
    </div>
  )
}