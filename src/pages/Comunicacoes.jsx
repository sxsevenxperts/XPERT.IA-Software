import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, CheckCheck, MessageCircle, Search, Send } from 'lucide-react'
import { getCurrentUser, supabase } from '../lib/supabase'

export default function Comunicacoes() {
  const [clients, setClients] = useState([])
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const [{ data: clientRows }, { data: conversationRows }] = await Promise.all([
      supabase.from('clientes').select('id,nome,area,email,telefone').order('nome'),
      supabase.from('conversas').select('*, clientes(nome,area)').eq('status', 'aberta').order('ultima_mensagem_em', { ascending: false, nullsFirst: false }),
    ])
    setClients(clientRows || [])
    setConversations(conversationRows || [])
    if (!selected && conversationRows?.[0]) setSelected(conversationRows[0])
  }, [selected])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!selected) { setMessages([]); return }
    supabase.from('mensagens').select('*').eq('conversa_id', selected.id).order('enviada_em').then(({ data }) => setMessages(data || []))
  }, [selected])

  const contacts = useMemo(() => {
    const map = new Map()
    clients.forEach((client) => map.set(client.id, { ...client, conversation: conversations.find((conversation) => conversation.cliente_id === client.id) }))
    return [...map.values()].filter((client) => !search || client.nome.toLowerCase().includes(search.toLowerCase()))
  }, [clients, conversations, search])

  async function chooseClient(client) {
    let conversation = client.conversation
    if (!conversation) {
      const user = await getCurrentUser()
      if (!user) return alert('Sua sessão expirou. Entre novamente.')
      const { data, error } = await supabase.from('conversas').insert({ user_id: user.id, cliente_id: client.id, status: 'aberta' }).select('*, clientes(nome,area)').single()
      if (error) return alert(error.message)
      conversation = data
      setConversations((current) => [conversation, ...current])
    }
    setSelected(conversation)
  }

  async function sendMessage() {
    if (!text.trim() || !selected) return
    const { data, error } = await supabase.from('mensagens').insert({ conversa_id: selected.id, remetente: 'advogado', conteudo: text.trim() }).select().single()
    if (error) return alert(error.message)
    await supabase.from('conversas').update({ ultima_mensagem_em: new Date().toISOString() }).eq('id', selected.id)
    setMessages((current) => [...current, data])
    setText('')
  }

  return <div className="fade-in" style={{ display: 'flex', height: 'calc(100vh - var(--header-h))', background: 'var(--bg)' }}>
    <aside style={{ width: 290, borderRight: '1px solid var(--border)', background: 'var(--bg2)', padding: 14, overflow: 'auto' }}><h3 style={{ marginBottom: 12 }}>Mensagens</h3><div style={{ position: 'relative', marginBottom: 12 }}><Search size={13} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--text4)' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar clientes" style={{ width: '100%', padding: '8px 8px 8px 28px' }} /></div>{contacts.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 12 }}>Cadastre clientes para iniciar uma conversa.</p> : contacts.map((client) => <button key={client.id} onClick={() => chooseClient(client)} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'center', padding: 10, border: 0, borderBottom: '1px solid var(--border)', background: selected?.cliente_id === client.id ? 'var(--bg3)' : 'transparent', color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}><div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-dim)', display: 'grid', placeItems: 'center', color: 'var(--blue)', fontWeight: 700 }}>{client.nome?.slice(0, 1)}</div><div><strong style={{ fontSize: 13 }}>{client.nome}</strong><div style={{ fontSize: 11, color: 'var(--text3)' }}>{client.area || 'Cliente'}</div></div></button>)}</aside>
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{selected ? <><header style={{ padding: 15, background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}><strong>{selected.clientes?.nome || 'Conversa'}</strong><div style={{ fontSize: 11, color: 'var(--text3)' }}>{selected.clientes?.area || 'Cliente'}</div></header><div style={{ flex: 1, overflow: 'auto', padding: 20 }}>{messages.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text3)', marginTop: 80 }}><MessageCircle size={32} /><p>Nenhuma mensagem registrada.</p></div> : messages.map((message) => <div key={message.id} style={{ display: 'flex', justifyContent: message.remetente === 'advogado' ? 'flex-end' : 'flex-start', marginBottom: 8 }}><div style={{ maxWidth: '70%', padding: '9px 12px', background: message.remetente === 'advogado' ? 'var(--blue)' : 'var(--bg2)', borderRadius: 12, color: message.remetente === 'advogado' ? 'white' : 'var(--text)' }}><div style={{ fontSize: 13 }}>{message.conteudo}</div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, fontSize: 10, opacity: .7, marginTop: 4 }}>{new Date(message.enviada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{message.remetente === 'advogado' && (message.lida_em ? <CheckCheck size={11} /> : <Check size={11} />)}</div></div></div>)}</div><footer style={{ padding: 12, display: 'flex', gap: 8, background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}><textarea rows={1} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() } }} placeholder="Digite uma mensagem" style={{ flex: 1, resize: 'none' }} /><button onClick={sendMessage} style={{ width: 40, border: 0, borderRadius: 8, background: 'var(--blue)', color: 'white' }}><Send size={15} /></button></footer></> : <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text3)' }}><MessageCircle size={40} /><p>Selecione um cliente para iniciar uma conversa.</p></div>}</main>
  </div>
}
