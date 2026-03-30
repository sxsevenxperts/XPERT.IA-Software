import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Download, Plus, Copy, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'

const CENARIOS_MOCK = [
  {
    id: 'sce-001',
    nome: 'Caso: Carlos Eduardo Melo (PRV-0355)',
    cliente: 'Carlos Eduardo Melo',
    caso: 'PRV-0355',
    descricao: 'Aposentadoria por Idade - 62F + 16 anos contribuição. Prognóstico: FAVORÁVEL (91%)',
    beneficios: [
      { tipo: 'Aposentadoria por Idade', rmi: 'R$ 3.200', viabilidade: 91, status: 'muito_favoravel' },
      { tipo: 'Aposentadoria Especial', rmi: 'R$ 4.100', viabilidade: 45, status: 'desfavoravel' },
      { tipo: 'Auxílio por Incapacidade', rmi: 'R$ 1.800', viabilidade: 12, status: 'muito_desfavoravel' },
    ],
    prazo_estimado: '8-14 meses',
    custo_estimado: 'R$ 3.500 (10% de êxito)',
    criacao: '15/03/2026',
  },
  {
    id: 'sce-002',
    nome: 'Caso: Luiza Fernandes (PRV-0321)',
    cliente: 'Luiza Fernandes',
    caso: 'PRV-0321',
    descricao: 'Regra dos Pontos - 78 pontos, 16 anos. Prognóstico: FAVORÁVEL (87%)',
    beneficios: [
      { tipo: 'Regra dos Pontos', rmi: 'R$ 2.800', viabilidade: 87, status: 'muito_favoravel' },
      { tipo: 'Aposentadoria por Idade', rmi: 'R$ 2.100', viabilidade: 56, status: 'neutro' },
    ],
    prazo_estimado: '6-10 meses',
    custo_estimado: 'R$ 2.800 (10% de êxito)',
    criacao: '02/03/2026',
  },
  {
    id: 'sce-003',
    nome: 'Caso: João Carlos Silva (PRV-0342)',
    cliente: 'João Carlos Silva',
    caso: 'PRV-0342',
    descricao: 'BPC/LOAS - Renda familiar baixa + incapacidade. Prognóstico: DESFAVORÁVEL (34%)',
    beneficios: [
      { tipo: 'BPC/LOAS', rmi: 'R$ 1.412', viabilidade: 34, status: 'desfavoravel' },
      { tipo: 'Auxílio Incapacidade', rmi: 'R$ 1.600', viabilidade: 28, status: 'desfavoravel' },
    ],
    prazo_estimado: '12-18 meses',
    custo_estimado: 'R$ 500 (não reembolsável)',
    criacao: '15/01/2026',
  },
]

const statusConfig = {
  muito_favoravel: { label: 'Muito Favorável', color: 'var(--green)', bg: 'var(--green-dim)', icon: '✅' },
  favoravel: { label: 'Favorável', color: 'var(--blue)', bg: 'var(--blue-dim)', icon: '👍' },
  neutro: { label: 'Neutro', color: 'var(--amber)', bg: 'var(--amber-dim)', icon: '⚠️' },
  desfavoravel: { label: 'Desfavorável', color: 'var(--red)', bg: 'var(--red-dim)', icon: '❌' },
  muito_desfavoravel: { label: 'Muito Desfav.', color: 'var(--red)', bg: 'var(--red-dim)', icon: '🚫' },
}

const viabilidadeChartData = [
  { range: '80-100%', casos: 28, fill: 'var(--green)' },
  { range: '60-79%', casos: 34, fill: '#10B98160' },
  { range: '40-59%', casos: 18, fill: 'var(--amber)' },
  { range: '20-39%', casos: 12, fill: 'var(--red)' },
  { range: '0-19%', casos: 5, fill: '#EF4444' },
]

const previsaoChartData = [
  { mes: 'Mês 1', vitoria: 0, em_andamento: 8, arquivado: 0 },
  { mes: 'Mês 2', vitoria: 1, em_andamento: 7, arquivado: 0 },
  { mes: 'Mês 3', vitoria: 3, em_andamento: 5, arquivado: 1 },
  { mes: 'Mês 4', vitoria: 5, em_andamento: 2, arquivado: 1 },
  { mes: 'Mês 5', vitoria: 6, em_andamento: 1, arquivado: 1 },
  { mes: 'Mês 6', vitoria: 7, em_andamento: 0, arquivado: 1 },
]

export default function Planejamento() {
  const [cenarioAtivo, setCenarioAtivo] = useState(CENARIOS_MOCK[0].id)
  const [abas, setAbas] = useState('cenarios')

  const cenario = CENARIOS_MOCK.find(c => c.id === cenarioAtivo)

  return (
    <div className="fade-in" style={{ padding: '24px', maxWidth: 1400 }}>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'cenarios', label: 'Cenários de Viabilidade', icon: '📊' },
          { id: 'predicoes', label: 'Previsões de Desfecho', icon: '🔮' },
          { id: 'comparacao', label: 'Comparação de Estratégias', icon: '⚖️' },
        ].map(aba => (
          <button key={aba.id} onClick={() => setAbas(aba.id)} style={{
            padding: '12px 16px', fontSize: 13.5, fontWeight: abas === aba.id ? 600 : 400,
            color: abas === aba.id ? 'var(--blue)' : 'var(--text3)',
            borderBottom: abas === aba.id ? '2px solid var(--blue)' : 'none',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            {aba.icon} {aba.label}
          </button>
        ))}
      </div>

      {/* ─────── Cenários ─────── */}
      {abas === 'cenarios' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Cenários de Viabilidade</h2>
              <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Análise comparativa de benefícios e estratégias por caso</p>
            </div>
            <button style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--blue), var(--cyan))', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <Plus size={14} /> Novo Cenário
            </button>
          </div>

          {/* Grid: Casos + Detalhes */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, marginBottom: 20 }}>

            {/* Lista de casos */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {CENARIOS_MOCK.map(c => (
                <button key={c.id} onClick={() => setCenarioAtivo(c.id)} style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--border)',
                  background: cenarioAtivo === c.id ? 'var(--bg3)' : 'transparent',
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}>
                  <p style={{ fontSize: 13.5, fontWeight: cenarioAtivo === c.id ? 700 : 600, marginBottom: 4 }}>{c.nome}</p>
                  <p style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 6 }}>{c.caso}</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {c.beneficios.slice(0, 2).map((b, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text4)' }}>
                        {b.viabilidade}%
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Detalhes do cenário */}
            {cenario && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{cenario.nome}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text3)' }}>{cenario.descricao}</p>
                  </div>
                  <button style={{ padding: '6px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text3)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={12} /> Gerar PDF
                  </button>
                </div>

                {/* Benefícios */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Benefícios Analisados</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cenario.beneficios.map((b, i) => {
                      const cfg = statusConfig[b.status]
                      return (
                        <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{b.tipo}</p>
                            <p style={{ fontSize: 12, color: 'var(--text4)' }}>RMI estimada: {b.rmi}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, marginBottom: 3 }}>{cfg.icon}</div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>{b.viabilidade}%</p>
                            <p style={{ fontSize: 11, color: 'var(--text4)' }}>{cfg.label}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Info cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '14px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Prazo Estimado</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>{cenario.prazo_estimado}</p>
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '14px' }}>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Custo Estimado</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{cenario.custo_estimado}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de distribuição de viabilidade */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Distribuição de Viabilidade (Portfólio)</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Total de casos analisados: 97</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={viabilidadeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 3 }}>{payload[0].payload.range}</p>
                    <p style={{ color: payload[0].fill }}>{payload[0].value} casos</p>
                  </div>
                ) : null} />
                <Bar dataKey="casos" radius={[6,6,0,0]}>
                  {viabilidadeChartData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─────── Previsões ─────── */}
      {abas === 'predicoes' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Previsões de Desfecho (6 meses)</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Curva de resolução esperada baseada em histórico e prognósticos</p>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={previsaoChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text4)' }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 6 }}>{payload[0].payload.mes}</p>
                    {payload.map((p, i) => (
                      <p key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {p.value}</p>
                    ))}
                  </div>
                ) : null} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text3)' }} />
                <Line type="monotone" dataKey="vitoria" stroke="var(--green)" strokeWidth={2.5} dot={{ r: 4 }} name="Vitória 🏆" />
                <Line type="monotone" dataKey="em_andamento" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 4 }} name="Em Andamento ⏳" />
                <Line type="monotone" dataKey="arquivado" stroke="var(--red)" strokeWidth={2.5} dot={{ r: 4 }} name="Arquivado 📁" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Métricas resumidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Taxa de Êxito (6m)', valor: '85%', color: 'var(--green)', icon: '✅' },
              { label: 'Tempo Médio', valor: '4.2 meses', color: 'var(--blue)', icon: '⏱️' },
              { label: 'Confiabilidade', valor: '91%', color: 'var(--amber)', icon: '🎯' },
              { label: 'Casos Críticos', valor: '3', color: 'var(--red)', icon: '⚠️' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.valor}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────── Comparação ─────── */}
      {abas === 'comparacao' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Comparação de Estratégias</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text3)' }}>Análise de custo-benefício para diferentes abordagens jurídicas</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              {
                nome: 'Estratégia Conservadora',
                desc: 'Documento menor, recurso único',
                taxa: '78%',
                prazo: '8-12 meses',
                custo: 'R$ 2.500',
                pros: ['Menor custo', 'Menos documentação', 'Rápido processamento'],
                contras: ['Taxa de êxito menor', 'Menos argumentos'],
              },
              {
                nome: 'Estratégia Equilibrada',
                desc: 'Documentação completa + recurso',
                taxa: '87%',
                prazo: '10-14 meses',
                custo: 'R$ 3.500',
                pros: ['Ótima taxa de êxito', 'Bem fundamentada', 'Jurisprudência forte'],
                contras: ['Custo moderado', 'Mais tempo'],
              },
              {
                nome: 'Estratégia Agressiva',
                desc: 'Documentação máxima + múltiplos recursos',
                taxa: '94%',
                prazo: '12-18 meses',
                custo: 'R$ 5.200',
                pros: ['Máxima taxa de êxito', 'Resposta a todas as teses', 'Antecipa defesas'],
                contras: ['Custo elevado', 'Mais tempo processual'],
              },
            ].map((est, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{est.nome}</h4>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{est.desc}</p>

                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 6 }}>Taxa de Êxito</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', marginBottom: 8 }}>{est.taxa}</p>
                  <p style={{ fontSize: 11, color: 'var(--text4)' }}>Prazo: {est.prazo}</p>
                  <p style={{ fontSize: 11, color: 'var(--text4)' }}>Custo: {est.custo}</p>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>✅ Vantagens</p>
                  <ul style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, paddingLeft: 16 }}>
                    {est.pros.map((p, j) => <li key={j} style={{ marginBottom: 3 }}>{p}</li>)}
                  </ul>

                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>⚠️ Desvantagens</p>
                  <ul style={{ fontSize: 11, color: 'var(--text3)', paddingLeft: 16 }}>
                    {est.contras.map((c, j) => <li key={j} style={{ marginBottom: 3 }}>{c}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
