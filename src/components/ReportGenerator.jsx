import { useState } from 'react'
import { FileText, Download, Calendar, BarChart3, Zap } from 'lucide-react'

const REPORT_TYPES = [
  { id: 'prazos', label: 'Relatório de Prazos', icon: Calendar, descricao: 'Prazos críticos do mês', cor: 'var(--red)' },
  { id: 'casos', label: 'Análise de Casos', icon: BarChart3, descricao: 'Estatísticas e métricas', cor: 'var(--blue)' },
  { id: 'financeiro', label: 'Relatório Financeiro', icon: Zap, descricao: 'Honorários e receitas', cor: 'var(--green)' },
]

const FORMATOS = [
  { id: 'pdf', label: 'PDF', descricao: 'Documento portável (arquivo PDF)' },
  { id: 'excel', label: 'Excel', descricao: 'Planilha (arquivo XLSX)' },
  { id: 'email', label: 'Enviar por Email', descricao: 'Receber automaticamente' },
]

export default function ReportGenerator({ userId, onClose }) {
  const [selectedReport, setSelectedReport] = useState('prazos')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7))
  const [generating, setGenerating] = useState(false)

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      // Chamar Edge Function para gerar relatório
      const response = await fetch('/functions/v1/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          report_type: selectedReport,
          format: selectedFormat,
          month: selectedMonth,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        
        // Download do arquivo
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${selectedReport}-${selectedMonth}.${selectedFormat === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert('Relatório gerado com sucesso!')
      } else {
        alert('Erro ao gerar relatório')
      }
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const selectedReportInfo = REPORT_TYPES.find(r => r.id === selectedReport)

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Gerador de Relatórios</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>Crie relatórios em PDF ou Excel com as análises do seu escritório</p>
      </div>

      {/* Seleção de Tipo de Relatório */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Tipo de Relatório</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {REPORT_TYPES.map(report => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id

            return (
              <button key={report.id} onClick={() => setSelectedReport(report.id)}
                style={{
                  background: isSelected ? 'var(--bg3)' : 'var(--bg2)',
                  border: `2px solid ${isSelected ? report.cor : 'var(--border)'}`,
                  borderRadius: 12, padding: 14, textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg3)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'var(--bg2)')}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: report.cor + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={18} style={{ color: report.cor }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{report.label}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: '4px 0 0 0' }}>{report.descricao}</p>
                </div>
                {isSelected && <div style={{ fontSize: 18 }}>✓</div>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Período */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Período</h3>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 9, fontSize: 13, color: 'var(--text)'
          }} />
      </div>

      {/* Formato */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Formato de Saída</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {FORMATOS.map(formato => (
            <button key={formato.id} onClick={() => setSelectedFormat(formato.id)}
              style={{
                background: selectedFormat === formato.id ? 'var(--blue-dim)' : 'var(--bg2)',
                border: `1px solid ${selectedFormat === formato.id ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer',
                color: selectedFormat === formato.id ? 'var(--blue-light)' : 'var(--text2)',
                fontSize: 12, fontWeight: 500, transition: 'all 0.2s'
              }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>
                {formato.id === 'pdf' && '📄'}
                {formato.id === 'excel' && '📊'}
                {formato.id === 'email' && '📧'}
              </div>
              {formato.label}
              <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 4 }}>{formato.descricao}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 28 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Preview</h3>
        <div style={{
          background: 'var(--bg3)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text3)',
          textAlign: 'center', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div>
            <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            {selectedReportInfo?.label} - {selectedMonth} ({selectedFormat.toUpperCase()})
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={generating} style={{
          padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 9, color: 'var(--text2)', fontSize: 13, cursor: 'pointer', opacity: generating ? 0.5 : 1
        }}>
          Cancelar
        </button>
        <button onClick={handleGenerateReport} disabled={generating} style={{
          padding: '10px 22px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
          border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700,
          cursor: generating ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          opacity: generating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {generating && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
          <Download size={16} />
          {generating ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>
    </div>
  )
}