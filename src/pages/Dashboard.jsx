import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Store, TrendingUp, AlertTriangle, ShoppingCart, Users, Package, BarChart2, RefreshCw } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = '#22c55e' }) {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: '#64748b' }}>{sub}</span>}
    </div>
  )
}

export default function Dashboard({ onTab }) {
  const [loja, setLoja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hora, setHora] = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setHora(new Date()), 60000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data } = await supabase
            .from('lojas')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          setLoja(data)
        } else {
          // fallback: tentar pegar loja do localStorage
          const cached = localStorage.getItem('sm_loja')
          if (cached) setLoja(JSON.parse(cached))
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      }
      setLoading(false)
    }
    load()
  }, [])

  const saudacao = () => {
    const h = hora.getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const dataFmt = hora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#64748b' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Store size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
              {saudacao()}, {loja?.nome_usuario || 'Lojista'}!
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{dataFmt}</p>
          </div>
        </div>
        {loja?.nome && (
          <div style={{
            marginTop: 8,
            background: '#0f172a',
            border: '1px solid #1e3a5f',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {loja.nome}
              {loja.cidade ? ` — ${loja.cidade}${loja.estado ? `/${loja.estado}` : ''}` : ''}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>
              {loja.plano?.toUpperCase() || 'PREMIUM'}
            </span>
          </div>
        )}
      </div>

      {/* Status do sistema */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2d1a, #0f172a)',
        border: '1px solid #166534',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={20} color="#22c55e" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Sistema Online</p>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Scraper ativo · Dados locais em coleta</p>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
      </div>

      {/* Cards de métricas placeholder */}
      <p style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        Visão Geral
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatCard icon={ShoppingCart} label="Vendas Hoje" value="R$ 0,00" sub="Aguardando dados do PDV" />
        <StatCard icon={TrendingUp} label="Meta Mensal" value="0%" sub="Configure nas Lojas" color="#3b82f6" />
        <StatCard icon={Package} label="Estoque" value="—" sub="Integre o PDV" color="#f59e0b" />
        <StatCard icon={Users} label="Clientes" value="—" sub="Aguardando dados" color="#a855f7" />
      </div>

      {/* Banner de próximos passos */}
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Próximos Passos</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Cadastrar sua loja', desc: 'Adicione endereço e CEP para scraper local', tab: 'lojas' },
            { label: 'Configurar plano', desc: 'Gerencie sua assinatura Smart Market', tab: 'billing' },
            { label: 'Alterar senha', desc: 'Troque o CPF por uma senha segura', tab: 'settings' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => onTab?.(item.tab)}
              style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 8 }}>
        Powered by <strong style={{ color: '#475569' }}>Seven Xperts</strong> · CNPJ 32.794.007/0001-19
      </p>
    </div>
  )
}
