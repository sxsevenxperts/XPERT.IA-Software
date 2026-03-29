import { useState } from 'react'
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, CheckCheck, Check, Circle } from 'lucide-react'

const contacts = [
  { id: 1, name: 'João Carlos Silva',   area: 'Previdenciário', avatar: 'JC', online: true,  unread: 2, lastMsg: 'Quando sai meu benefício?',          time: '14:32', caso: 'PRV-0342' },
  { id: 2, name: 'Fernanda Oliveira',   area: 'Trabalhista',    avatar: 'FO', online: true,  unread: 0, lastMsg: 'Ok, obrigada Dr!',                   time: '13:10', caso: 'TRB-0189' },
  { id: 3, name: 'Pedro Alves Rocha',   area: 'Cível',          avatar: 'PA', online: false, unread: 1, lastMsg: 'Preciso dos documentos.',            time: '11:45', caso: 'CVL-0401' },
  { id: 4, name: 'Ana Beatriz Lima',    area: 'Família',        avatar: 'AB', online: false, unread: 0, lastMsg: 'Entendido, aguardo novidades.',       time: 'Ontem', caso: 'FAM-0378' },
  { id: 5, name: 'Carlos Eduardo Melo', area: 'Previdenciário', avatar: 'CE', online: true,  unread: 3, lastMsg: 'Quando é a perícia médica?',          time: 'Ontem', caso: 'PRV-0355' },
  { id: 6, name: 'Maria Aparecida',     area: 'Previdenciário', avatar: 'MA', online: false, unread: 0, lastMsg: 'Muito obrigada pela atenção.',        time: 'Seg',   caso: 'PRV-0389' },
]

const convMap = {
  1: [
    { from: 'cliente', text: 'Bom dia doutor, tenho novidades sobre meu caso?', time: '09:15', status: 'read' },
    { from: 'adv',     text: 'Bom dia, João! Seu processo está em análise pelo perito. Em breve teremos o resultado da perícia.', time: '09:32', status: 'read' },
    { from: 'cliente', text: 'Quanto tempo ainda vai demorar?', time: '11:20', status: 'read' },
    { from: 'adv',     text: 'O perito tem 30 dias para emitir o laudo. Faltam aproximadamente 2 semanas. Fique tranquilo que te aviso imediatamente quando sair.', time: '11:35', status: 'read' },
    { from: 'cliente', text: 'Quando sai meu benefício?', time: '14:32', status: 'delivered' },
  ],
  2: [
    { from: 'adv',     text: 'Fernanda, a audiência está confirmada para amanhã às 09h no TRT. Lembre de trazer seus documentos de identidade.', time: '10:00', status: 'read' },
    { from: 'cliente', text: 'Ok, estarei lá! Preciso levar mais alguma coisa?', time: '10:15', status: 'read' },
    { from: 'adv',     text: 'Sim: carteira de trabalho, holerites e comprovante de residência. Já tenho cópia de tudo aqui.', time: '10:20', status: 'read' },
    { from: 'cliente', text: 'Ok, obrigada Dr!', time: '13:10', status: 'read' },
  ],
  5: [
    { from: 'cliente', text: 'Boa tarde! Vi que tem perícia marcada. É essa semana?', time: '08:00', status: 'read' },
    { from: 'adv',     text: 'Sim Carlos! A perícia é na quinta-feira dia 01/04 às 15h na Agência INSS do Centro. Endereço: Rua XV de Novembro, 320.', time: '08:45', status: 'read' },
    { from: 'cliente', text: 'Preciso levar laudos médicos?', time: '09:00', status: 'read' },
    { from: 'adv',     text: 'Sim! Leve TODOS os laudos e exames dos últimos 2 anos. Quanto mais documentação, melhor para a perícia.', time: '09:15', status: 'read' },
    { from: 'cliente', text: 'Quando é a perícia médica?', time: 'Ontem', status: 'delivered' },
  ],
}

const quickReplies = [
  'Seu caso está em andamento, em breve retorno com novidades.',
  'Vou verificar e te retorno ainda hoje.',
  'Documentação recebida! Obrigado.',
  'Sua audiência está confirmada. Precisa de algum preparo?',
  'Benefício aprovado! Parabéns, entramos em contato para detalhes.',
]

const areaColors = {
  'Previdenciário': '#3B82F6',
  'Trabalhista':    '#8B5CF6',
  'Cível':          '#10B981',
  'Família':        '#F59E0B',
}

export default function Comunicacoes() {
  const [selected, setSelected] = useState(contacts[0])
  const [msgText, setMsgText] = useState('')
  const [busca, setBusca] = useState('')
  const [localConv, setLocalConv] = useState(convMap)

  const msgs = localConv[selected?.id] || []

  const sendMsg = () => {
    if (!msgText.trim()) return
    const newMsg = { from: 'adv', text: msgText, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'sent' }
    setLocalConv(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), newMsg] }))
    setMsgText('')
  }

  const filtered = contacts.filter(c => !busca || c.name.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="fade-in" style={{ display: 'flex', height: 'calc(100vh - var(--header-h))', background: 'var(--bg)' }}>

      {/* Sidebar lista */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 14px 10px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Mensagens</h3>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text4)' }} />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar clientes..."
              style={{ width: '100%', padding: '7px 10px 7px 28px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5, color: 'var(--text)', outline: 'none' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              padding: '12px 14px', cursor: 'pointer', transition: 'background 0.12s',
              background: selected?.id === c.id ? 'var(--bg3)' : 'transparent',
              borderBottom: '1px solid var(--border)',
            }}
              onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${areaColors[c.area] || '#3B82F6'}, #8B5CF6)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>{c.avatar}</div>
                  {c.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg2)' }} />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--text4)', flexShrink: 0, marginLeft: 4 }}>{c.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{c.lastMsg}</span>
                    {c.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0, marginLeft: 4 }}>{c.unread}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      {selected && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '12px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${areaColors[selected.area] || '#3B82F6'}, #8B5CF6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
              {selected.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: selected.online ? 'var(--green)' : 'var(--text4)', marginTop: 1 }}>
                {selected.online ? '● Online' : '○ Offline'} · {selected.area} · {selected.caso}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer' }}>
                <Phone size={14} />
              </button>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer' }}>
                <Video size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'adv' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '65%', padding: '10px 14px',
                  background: m.from === 'adv' ? 'linear-gradient(135deg, #3B82F6, #7C3AED)' : 'var(--bg2)',
                  border: m.from === 'adv' ? 'none' : '1px solid var(--border)',
                  borderRadius: m.from === 'adv' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  color: m.from === 'adv' ? 'white' : 'var(--text)',
                }}>
                  <p style={{ fontSize: 13, lineHeight: 1.45 }}>{m.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{m.time}</span>
                    {m.from === 'adv' && (
                      <span style={{ opacity: 0.7 }}>
                        {m.status === 'read' ? <CheckCheck size={11} /> : m.status === 'delivered' ? <CheckCheck size={11} /> : <Check size={11} />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div style={{ padding: '6px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {quickReplies.map((q, i) => (
              <button key={i} onClick={() => setMsgText(q)} style={{
                padding: '5px 12px', background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 20, fontSize: 11, color: 'var(--text3)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
              >
                {q.slice(0, 35)}...
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button style={{ width: 34, height: 34, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', cursor: 'pointer' }}>
              <Paperclip size={15} />
            </button>
            <div style={{ flex: 1 }}>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                placeholder="Digite uma mensagem..."
                rows={1}
                style={{
                  width: '100%', padding: '9px 14px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 13, color: 'var(--text)', outline: 'none', resize: 'none', lineHeight: 1.4,
                }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button onClick={sendMsg} style={{
              width: 38, height: 38, background: msgText.trim() ? 'linear-gradient(135deg, var(--blue), var(--purple))' : 'var(--bg3)',
              border: 'none', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: msgText.trim() ? 'white' : 'var(--text4)', cursor: msgText.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
