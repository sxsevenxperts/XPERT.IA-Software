import { useState } from 'react'
import { Eye, MessageSquare, CheckCircle, X, Send, ThumbsUp } from 'lucide-react'

const REVIEW_STATUSES = [
  { id: 'pending', label: 'Pendente', color: 'var(--amber)', bg: 'var(--amber-dim)' },
  { id: 'in_review', label: 'Em Revisão', color: 'var(--blue)', bg: 'var(--blue-dim)' },
  { id: 'approved', label: 'Aprovado', color: 'var(--green)', bg: 'var(--green-dim)' },
  { id: 'rejected', label: 'Rejeitado', color: 'var(--red)', bg: 'var(--red-dim)' },
  { id: 'changes_requested', label: 'Ajustes Solicitados', color: 'var(--purple)', bg: 'var(--purple-dim)' },
]

export default function DocumentReviewModal({ document, onClose, onStatusChange }) {
  const [status, setStatus] = useState('pending')
  const [comments, setComments] = useState([
    { id: 1, author: 'Ana Silva', avatar: '👨‍⚖️', text: 'Revisar cláusula 5, ponto 2', time: '2h atrás', resolved: false },
  ])
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('document')

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, {
        id: comments.length + 1,
        author: 'Você',
        avatar: '👤',
        text: newComment,
        time: 'agora',
        resolved: false,
      }])
      setNewComment('')
    }
  }

  const statusInfo = REVIEW_STATUSES.find(s => s.id === status)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20
    }}>
      <div className="fade-in" style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18,
        width: '100%', maxWidth: 1000, maxHeight: '90vh', boxShadow: 'var(--shadow)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Revisão: {document?.titulo}</h3>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <span style={{
                padding: '4px 10px', background: statusInfo?.bg, color: statusInfo?.color,
                fontSize: 11, fontWeight: 600, borderRadius: 4
              }}>
                {statusInfo?.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text4)' }}>Versão 1 · Criado há 3 dias</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, overflow: 'hidden' }}>
          {/* Documento */}
          <div style={{
            padding: '20px', overflowY: 'auto', background: 'var(--bg3)',
            fontSize: 13, color: 'var(--text2)', lineHeight: 1.6
          }}>
            {activeTab === 'document' && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Conteúdo do Documento</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p style={{ marginTop: 12 }}>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <div style={{
                  background: 'var(--bg2)', border: '2px solid var(--amber)', borderRadius: 8,
                  padding: 12, marginTop: 16, color: 'var(--amber)'
                }}>
                  <strong>Comentário:</strong> Revisar esta seção
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Histórico de Versões</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '10px', background: 'var(--bg2)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600 }}>Versão 1 (Atual)</div>
                    <div style={{ fontSize: 11, color: 'var(--text4)' }}>Criado por você há 3 dias</div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg2)', borderRadius: 8, opacity: 0.6 }}>
                    <div style={{ fontWeight: 600 }}>Versão 0 (Draft)</div>
                    <div style={{ fontSize: 11, color: 'var(--text4)' }}>Criado por você há 4 dias</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Comments & Status */}
          <div style={{
            borderLeft: '1px solid var(--border)', padding: '20px', display: 'flex',
            flexDirection: 'column', gap: 16, overflowY: 'auto'
          }}>
            {/* Status */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', color: 'var(--text3)' }}>
                Status da Revisão
              </h4>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: 12, color: 'var(--text)', cursor: 'pointer'
                }}>
                {REVIEW_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setActiveTab('document')}
                style={{
                  padding: '6px 12px', borderBottom: activeTab === 'document' ? '2px solid var(--blue)' : 'none',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  color: activeTab === 'document' ? 'var(--blue)' : 'var(--text3)'
                }}>
                Documento
              </button>
              <button onClick={() => setActiveTab('history')}
                style={{
                  padding: '6px 12px', borderBottom: activeTab === 'history' ? '2px solid var(--blue)' : 'none',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  color: activeTab === 'history' ? 'var(--blue)' : 'var(--text3)'
                }}>
                Histórico
              </button>
            </div>

            {/* Comments */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', color: 'var(--text3)' }}>
                Comentários
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {comments.map(comment => (
                  <div key={comment.id} style({ padding: '8px', background: 'var(--bg3)', borderRadius: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                      {comment.avatar} {comment.author} <span style={{ color: 'var(--text4)' }}>{comment.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text2)', margin: 0 }}>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" placeholder="Adicionar comentário..." value={newComment} onChange={e => setNewComment(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                style={{
                  flex: 1, padding: '6px 8px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 6, fontSize: 11, color: 'var(--text)', outline: 'none'
                }} />
              <button onClick={handleAddComment}
                style={{ padding: '6px 10px', background: 'var(--blue)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer' }}>
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10,
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose}
            style={{ padding: '10px 18px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
            Fechar
          </button>
          <button onClick={() => onStatusChange?.(status)}
            style={{
              padding: '10px 18px', background: 'linear-gradient(135deg, var(--blue), var(--purple))',
              border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            <ThumbsUp size={14} />
            Salvar Revisão
          </button>
        </div>
      </div>
    </div>
  )
}