import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HotmartSuccess() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processHotmartRedirect = async () => {
      try {
        // Extract parameters from URL
        const params = new URLSearchParams(window.location.search)
        const email = params.get('email')
        const phone = params.get('phone')
        const name = params.get('name')
        const transactionId = params.get('transaction_id')

        if (!email) {
          setError('Email não encontrado. Verifique o link.')
          setLoading(false)
          return
        }

        // Call edge function to create user
        const supabaseUrl = 'https://untmxmbqgdagfqhmqyvm.supabase.co'

        const response = await fetch(
          `${supabaseUrl}/functions/v1/create-hotmart-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              phone: phone || '',
              name: name || '',
              transaction_id: transactionId || '',
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao processar pagamento')
        }

        const { session } = await response.json()

        // Set session
        const { error: setSessionError } = await supabase.auth.setSession(session)
        if (setSessionError) {
          throw setSessionError
        }

        // Small delay then redirect to app
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } catch (err) {
        console.error('Error processing Hotmart redirect:', err)
        setError(err.message || 'Erro ao processar sua compra. Tente novamente.')
        setLoading(false)
      }
    }

    processHotmartRedirect()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {loading && !error && (
          <>
            <div style={{
              width: 60,
              height: 60,
              border: '3px solid rgba(59,130,246,0.3)',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 24px'
            }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Processando...</h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              Criando sua conta e fazendo login automático...
            </p>
          </>
        )}

        {error && (
          <>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
            }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#EF4444' }}>
              Erro ao processar
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voltar para login
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
