import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Send, MessageSquare } from 'lucide-react'

export default function Chat({ user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()

    // Real-time subscription
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadMessages() {
    try {
      const { data } = await supabase.from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)
      setMessages(data || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
    setLoading(false)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        user_email: user.email,
        message: text.trim(),
      })
      setText('')
    } catch {}
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 60px)', paddingTop: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, padding: '0 16px 16px' }}>Chat Motoristas</h1>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text4)' }}>Carregando...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <MessageSquare size={32} color="var(--text4)" style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text3)' }}>Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.user_id === user.id
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%',
                  background: isMe ? '#3B82F6' : 'var(--bg2)',
                  border: isMe ? 'none' : '1px solid var(--border)',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px',
                }}>
                  {!isMe && (
                    <div style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text4)', marginBottom: 4 }}>
                      {msg.user_email?.split('@')[0]}
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: isMe ? 'white' : 'var(--text)', lineHeight: 1.4 }}>{msg.message}</div>
                  <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text4)', marginTop: 4, textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '12px 16px 100px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 10,
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Mensagem..."
          style={{
            flex: 1, padding: '12px 14px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 24, fontSize: 15, color: 'var(--text)', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#3B82F6'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none',
            background: text.trim() ? '#3B82F6' : 'var(--bg3)',
            color: text.trim() ? 'white' : 'var(--text4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'default', flexShrink: 0,
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
