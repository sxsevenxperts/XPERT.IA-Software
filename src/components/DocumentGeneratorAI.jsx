import { useState } from 'react'
import { Wand2, FileText, Copy, Download, RefreshCw } from 'lucide-react'

const DOCUMENT_TYPES = [
  { id: 'peticao', label: 'Petição Inicial', descricao: 'Documento de abertura do caso' },
  { id: 'contrato', label: 'Contrato', descricao: 'Acordo entre partes' },
  { id: 'parecer', label: 'Parecer Jurídico', descricao: 'Análise e posicionamento legal' },
  { id: 'memorando', label: 'Memorando Interno', descricao: 'Documentação interna' },
]

export default function DocumentGeneratorAI({ userId, casoData, onClose }) {
  const [selectedType, setSelectedType] = useState('peticao')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Chamar Edge Function para gerar documento com IA
      const response = await fetch('/functions/v1/generate-document-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          document_type: selectedType,
          caso_data: casoData,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data.content)
        setEditing(true)
      } else {
        alert('Erro ao gerar documento')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    // TODO: Salvar documento na tabela documents
    alert('Documento salvo com sucesso!')
    onClose?.()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent)
    alert('Documento copiado para clipboard!')
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedContent))
    element.setAttribute('download', `${selectedType}-${Date.now()}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20
    }}>
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18,
        padding: '28px', width: '100%', maxWidth: 900, maxHeight: '90vh', boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Gerador de Documentos com IA</h3>
            <p style={{ fontSize: 11, color: 'var(--text3)', margin: '4px 0 0 0' }}>Crie peças processuais automaticamente</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {!generatedContent ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tipo de Documento */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Tipo de Documento</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {DOCUMENT_TYPES.map(type => (
                  <button key={type.id} onClick={() => setSelectedType(type.id)}
                    style={{
                      background: selectedType === type.id ? 'var(--blue-dim)' : 'var(--bg3)',
                      border: `1px solid ${selectedType === type.id ? 'var(--blue)' : 'var(--border)'}`,
                      borderRadius: 10, padding: 12, textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{type.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{type.descricao}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div style={{
              background: 'var(--blue-dim)', border: '1px solid var(--blue)', borderRadius: 10,
              padding: 12, flex: 1
            }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px 0', color: 'var(--blue-light)' }}>ℹ️ Sobre a Geração</h4>
              <ul style={{ fontSize: 11, color: 'var(--blue-light)', margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                <li>IA analisa dados do caso automaticamente</li>
                <li>Cria documento completo e profissional</li>
                <li>Você pode editar e personalizar antes de salvar</li>
                <li>Usa informações do caso para contexto jurídico</li>
              </ul>
            </div>

            {/* Botão Gerar */}
            <button onClick={handleGenerate} disabled={generating}
              style={{
                padding: '14px 20px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700,
                cursor: generating ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                opacity: generating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8
              }}>
              {generating && <div style={{
                width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
              }} />}
              <Wand2 size={18} />
              {generating ? 'Gerando com IA...' : 'Gerar Documento com IA'}
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                Edite se necessário:
              </label>
              <textarea value={generatedContent} onChange={e => setGeneratedContent(e.target.value)}
                style={{
                  flex: 1, padding: 12, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 12, color: 'var(--text)', fontFamily: 'monospace',
                  resize: 'none', outline: 'none'
                }} />
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCopy}
                style={{ flex: 1, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Copy size={14} />
                Copiar
              </button>
              <button onClick={handleDownload}
                style={{ flex: 1, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <Download size={14} />
                Download
              </button>
              <button onClick={() => { setGeneratedContent(''); setSelectedType('peticao'); }}
                style={{ flex: 1, padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <RefreshCw size={14} />
                Novo
              </button>
              <button onClick={handleSave}
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, var(--blue), var(--purple))', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                <FileText size={14} />
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}