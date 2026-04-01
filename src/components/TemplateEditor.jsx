import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { createTemplate, updateTemplate, fetchTemplates } from '../lib/supabase'

const TEMPLATE_TYPES = [
  { value: 'peticao', label: 'Petição' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'parecer', label: 'Parecer' },
  { value: 'customizado', label: 'Customizado' },
]

const PLACEHOLDER_SUGGESTIONS = [
  { tag: '[[CLIENTE_NOME]]', description: 'Nome do cliente' },
  { tag: '[[CLIENTE_CPF]]', description: 'CPF do cliente' },
  { tag: '[[CASO_NUMERO]]', description: 'Número do caso' },
  { tag: '[[DATA_ATUAL]]', description: 'Data atual' },
  { tag: '[[ADVOGADO_NOME]]', description: 'Nome do advogado' },
  { tag: '[[TRIBUNAL]]', description: 'Tribunal/Instância' },
]

export default function TemplateEditor({ userId, onSave, onClose, template = null }) {
  const [form, setForm] = useState({
    nome: template?.nome || '',
    tipo: template?.tipo || 'peticao',
    conteudo: template?.conteudo || '',
    categoria: template?.categoria || '',
    marcadores: template?.marcadores || []
  })
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const [loading, setLoading] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAddPlaceholder = (tag) => {
    const textarea = document.getElementById('template-content')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = form.conteudo.substring(0, start)
      const after = form.conteudo.substring(end)
      f('conteudo', before + tag + after)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tag.length
        textarea.focus()
      }, 0)
    }
  }

  const handleSave = async () => {
    if (!form.nome.trim()) return alert('Nome do template obrigatório')
    if (!form.conteudo.trim()) return alert('Conteúdo do template obrigatório')

    setLoading(true)
    try {
      if (template) {
        // await updateTemplate(template.id, form)
      } else {
        // await createTemplate(form, userId)
      }
      onSave(form)
    } catch (err) {
      alert('Erro ao salvar template: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
      <div className="fade-in" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 800, maxHeight: '90vh', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{template ? 'Editar Template' : 'Novo Template'}</h3>
          <button onClick={onClose} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          
          {/* Left: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Nome do Template *</label>
              <input type="text" placeholder="Ex: Petição Inicial INSS" value={form.nome} onChange={e => f('nome', e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: 'var(--text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Tipo *</label>
              <select value={form.tipo} onChange={e => f('tipo', e.target.value)} disabled={loading}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: 'var(--text)', outline: 'none' }}>
                {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Categoria</label>
              <input type="text" placeholder="Ex: Previdência, Trabalhista" value={form.categoria} onChange={e => f('categoria', e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, fontSize: 13.5, color: 'var(--text)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          {/* Right: Placeholders */}
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, margin: '0 0 12px 0' }}>Placeholders Disponíveis</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {PLACEHOLDER_SUGGESTIONS.map(({ tag, description }) => (
                <button key={tag} onClick={() => handleAddPlaceholder(tag)} disabled={loading}
                  style={{
                    padding: '8px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                    fontSize: 11, color: 'var(--text2)', textAlign: 'left', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-dim)' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600, marginBottom: 2 }}>{tag}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Conteúdo *</label>
          <textarea id="template-content" placeholder="Digite o conteúdo do template..." value={form.conteudo} onChange={e => f('conteudo', e.target.value)}
            disabled={loading}
            style={{
              width: '100%', height: 200, padding: '12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9,
              fontSize: 13, color: 'var(--text)', outline: 'none', fontFamily: 'monospace', resize: 'none'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <p style={{ fontSize: 11, color: 'var(--text4)', margin: '6px 0 0 0' }}>Use os placeholders acima para criar templates dinâmicos</p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={onClose} disabled={loading} style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text2)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} style={{
            padding: '10px 22px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
            border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
            <Save size={16} />
            {loading ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      </div>
    </div>
  )
}