import { useState, useEffect } from 'react'
import { checkSubscription } from '../lib/supabase'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function WebhookPending({ user, onSubscriptionReady }) {
  const [status, setStatus] = useState('waiting') // waiting | confirmed | timeout | error
  const [elapsedTime, setElapsedTime] = useState(0)
  const [checkCount, setCheckCount] = useState(0)

  const MAX_WAIT_TIME = 5 * 60 * 1000 // 5 minutos
  const POLL_INTERVAL = 2000 // 2 segundos

  useEffect(() => {
    let pollTimer = null
    let timeoutTimer = null
    let startTime = Date.now()

    const checkWebhook = async () => {
      try {
        setCheckCount(c => c + 1)
        const sub = await checkSubscription(user.id)

        if (sub.active) {
          console.log('✅ Webhook confirmado! Subscrição ativa.')
          setStatus('confirmed')
          clearTimeout(timeoutTimer)
          clearInterval(pollTimer)
          setTimeout(() => onSubscriptionReady?.(sub), 500)
          return
        }
      } catch (err) {
        console.error('❌ Erro ao verificar webhook:', err.message)
        setStatus('error')
        return
      }

      // Atualizar tempo decorrido
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)

      // Verificar timeout
      if (elapsed > MAX_WAIT_TIME) {
        console.error('⏱️ Timeout ao aguardar webhook - 5 minutos')
        setStatus('timeout')
        clearInterval(pollTimer)
        clearTimeout(timeoutTimer)
      }
    }

    // Check imediato
    checkWebhook()

    // Poll a cada 2 segundos
    pollTimer = setInterval(checkWebhook, POLL_INTERVAL)

    // Timeout de segurança
    timeoutTimer = setTimeout(() => {
      setStatus('timeout')
      clearInterval(pollTimer)
    }, MAX_WAIT_TIME)

    return () => {
      clearInterval(pollTimer)
      clearTimeout(timeoutTimer)
    }
  }, [user.id, onSubscriptionReady])

  const minutes = Math.floor(elapsedTime / 60000)
  const seconds = Math.floor((elapsedTime % 60000) / 1000)
  const progressPercent = (elapsedTime / (5 * 60 * 1000)) * 100

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#07101F',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 60%)',
      padding: '32px 16px',
    }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="EasyDrive" style={{ width: 160, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.4))' }} />
        </div>

        {/* Card */}
        <div style={{ background: '#0B1829', border: '1px solid #1C3050', borderRadius: 20, padding: 28 }}>

          {status === 'waiting' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16, margin: '0 auto 16px',
                  background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Clock size={40} color="#10B981" style={{ animation: 'spin 3s linear infinite' }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0FE', marginBottom: 8 }}>
                  Aguardando confirmação
                </h2>
                <p style={{ fontSize: 14, color: '#4D7098', marginBottom: 4 }}>
                  Sua compra está sendo processada pelo Hotmart
                </p>
                <p style={{ fontSize: 12, color: '#2D4F6E', marginTop: 12 }}>
                  Verificação #{checkCount} • {minutes}:{seconds.toString().padStart(2, '0')}
                </p>
              </div>

              {/* Barra de progresso */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  width: '100%', height: 6, borderRadius: 3,
                  background: '#1C3050', overflow: 'hidden', marginBottom: 8,
                }}>
                  <div style={{
                    width: `${Math.min(progressPercent, 100)}%`, height: '100%',
                    background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: 11, color: '#4D7098', textAlign: 'center' }}>
                  {minutes}m {seconds}s de 5m
                </p>
              </div>

              <div style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                fontSize: 12, color: '#93C5FD',
              }}>
                💡 Isso pode levar alguns minutos. Não feche esta página.
              </div>
            </>
          )}

          {status === 'confirmed' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle size={40} color="#10B981" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0FE', marginBottom: 8 }}>
                  Compra confirmada!
                </h2>
                <p style={{ fontSize: 14, color: '#4D7098' }}>
                  Sua subscrição está ativa. Redirecionando...
                </p>
              </div>

              <div style={{
                width: 36, height: 36, border: '3px solid rgba(16,185,129,0.2)',
                borderTopColor: '#10B981', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto',
              }} />
            </>
          )}

          {status === 'timeout' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16, margin: '0 auto 16px',
                  background: 'rgba(244,114,182,0.15)', border: '2px solid rgba(244,114,182,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={40} color="#F472B6" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0FE', marginBottom: 8 }}>
                  Timeout na confirmação
                </h2>
                <p style={{ fontSize: 14, color: '#4D7098', marginBottom: 16 }}>
                  O servidor levou muito tempo para responder
                </p>
              </div>

              <div style={{
                background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                fontSize: 12, color: '#FBB6D9',
              }}>
                ⚠️ Sua conta pode ter sido criada mesmo assim. Tente fazer login com suas credenciais.
              </div>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                }}
              >
                Ir para Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16, margin: '0 auto 16px',
                  background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={40} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#E8F0FE', marginBottom: 8 }}>
                  Erro ao verificar
                </h2>
                <p style={{ fontSize: 14, color: '#4D7098' }}>
                  Não conseguimos verificar sua subscrição
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                }}
              >
                Tentar Novamente
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2D4F6E', marginTop: 16 }}>
          Powered by <strong style={{ color: '#4D7098' }}>Seven Xperts</strong>
        </p>
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
