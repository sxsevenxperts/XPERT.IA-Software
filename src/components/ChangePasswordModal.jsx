import { useState } from 'react'
import { X, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { changeLojaPassword } from '../lib/supabase'

export default function ChangePasswordModal({ onClose, lojaEmail, lojaId }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!currentPassword) {
      setError('Senha atual é obrigatória')
      return
    }
    if (!newPassword) {
      setError('Nova senha é obrigatória')
      return
    }
    if (newPassword.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    setLoading(true)

    try {
      if (!lojaId) {
        setError('ID da loja não encontrado')
        setLoading(false)
        return
      }

      // Alterar senha no banco de dados
      const result = await changeLojaPassword(lojaId, currentPassword, newPassword)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError('Falha ao alterar senha. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 16,
        padding: 24,
        maxWidth: 400,
        width: '100%',
        position: 'relative',
      }}>
        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}>
            <Lock size={20} color='#22c55e' />
            <h2 style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#f1f5f9',
              margin: 0,
            }}>
              Alterar Senha
            </h2>
          </div>
          <p style={{
            fontSize: 12,
            color: '#94a3b8',
            margin: 0,
          }}>
            {lojaEmail}
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success && (
          <div style={{
            background: '#22c55e15',
            border: '1px solid #22c55e40',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}>
            <Check size={18} color='#22c55e' />
            <span style={{ fontSize: 12, color: '#22c55e' }}>
              Senha alterada com sucesso!
            </span>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{
            background: '#ef444410',
            border: '1px solid #ef444440',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            <AlertCircle size={18} color='#ef4444' style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#ef4444' }}>
              {error}
            </span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Senha Atual */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                Senha Atual
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder='••••••••'
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 14px',
                    paddingRight: 36,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='••••••••'
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 14px',
                    paddingRight: 36,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                marginBottom: 6,
                textTransform: 'uppercase',
              }}>
                Confirmar Senha
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='••••••••'
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 14px',
                    paddingRight: 36,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type='button'
                  onClick={() => setShowPasswords(!showPasswords)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 4,
                  }}
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button
                type='button'
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: 12,
                  background: '#334155',
                  border: 'none',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type='submit'
                disabled={loading}
                style={{
                  padding: 12,
                  background: loading ? '#334155' : '#22c55e',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Alterando...' : 'Alterar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
