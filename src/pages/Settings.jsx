import { useState } from 'react'
import { useStore } from '../store'
import { fmt } from '../utils/format'
import { Save, Fuel, User, Car, DollarSign, Download, Upload } from 'lucide-react'

export default function Settings() {
  const { settings, updateSettings, trips, expenses } = useStore()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ ...settings })

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings,
      trips: trips.slice(0, 1000),
      expenses: expenses.slice(0, 500),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `motoapp-backup-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Estimativas
  const litrosSemana = (form.fuelConsumption > 0 && form.fuelPrice > 0)
    ? `${(200 / form.fuelConsumption).toFixed(1)} L/semana (estimativa 200km)`
    : null

  const custoKm = form.fuelConsumption > 0
    ? form.fuelPrice / form.fuelConsumption
    : 0

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Configurações</h1>

      {/* Dados pessoais */}
      <Section icon={<User size={16} color='#3b82f6' />} title='Dados pessoais'>
        <Label>Seu nome</Label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          placeholder='Ex: João Silva'
        />
        <Label>Placa do veículo</Label>
        <input
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
          style={inputStyle}
          placeholder='Ex: ABC-1234'
          maxLength={8}
        />
      </Section>

      {/* Veículo */}
      <Section icon={<Car size={16} color='#a78bfa' />} title='Veículo'>
        <Label>Tipo de veículo</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { id: 'moto', label: '🏍️ Moto' },
            { id: 'carro', label: '🚗 Carro' },
            { id: 'van', label: '🚐 Van' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setForm({ ...form, vehicle: v.id })}
              style={{
                padding: '10px 0', border: `2px solid ${form.vehicle === v.id ? '#a78bfa' : '#334155'}`,
                borderRadius: 10, background: form.vehicle === v.id ? '#a78bfa20' : '#1e293b',
                color: form.vehicle === v.id ? '#a78bfa' : '#64748b',
                cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Combustível */}
      <Section icon={<Fuel size={16} color='#f97316' />} title='Combustível'>
        <Label>Tipo de combustível</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { id: 'gasolina', label: '⛽ Gasolina' },
            { id: 'etanol', label: '🌿 Etanol' },
            { id: 'flex', label: '🔄 Flex' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setForm({ ...form, fuelType: f.id })}
              style={{
                padding: '10px 0', border: `2px solid ${form.fuelType === f.id ? '#f97316' : '#334155'}`,
                borderRadius: 10, background: form.fuelType === f.id ? '#f9731620' : '#1e293b',
                color: form.fuelType === f.id ? '#f97316' : '#64748b',
                cursor: 'pointer', fontWeight: 600, fontSize: 12,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Label>Preço do litro (R$)</Label>
        <input
          type='number'
          value={form.fuelPrice}
          onChange={(e) => setForm({ ...form, fuelPrice: parseFloat(e.target.value) || 0 })}
          step='0.01'
          style={inputStyle}
          placeholder='Ex: 6.49'
        />
        <Label>Consumo do veículo (km/L)</Label>
        <input
          type='number'
          value={form.fuelConsumption}
          onChange={(e) => setForm({ ...form, fuelConsumption: parseFloat(e.target.value) || 1 })}
          step='0.5'
          style={inputStyle}
          placeholder='Ex: 35'
        />

        {/* Estimativas */}
        {custoKm > 0 && (
          <div style={{
            background: '#f9731615', border: '1px solid #f9731630',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <p style={{ fontSize: 12, color: '#f97316', fontWeight: 700, marginBottom: 6 }}>
              Estimativas de custo
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
              Custo por km: <strong style={{ color: '#f1f5f9' }}>{fmt.currency(custoKm)}/km</strong>
            </p>
            {litrosSemana && (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                200 km: <strong style={{ color: '#f1f5f9' }}>{litrosSemana}</strong> = {fmt.currency(200 * custoKm)}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Plataformas ativas */}
      <Section icon={<DollarSign size={16} color='#22c55e' />} title='Plataformas ativas'>
        {['uber', '99', 'inDriver', 'outro'].map((p) => {
          const active = form.platforms?.includes(p)
          return (
            <button
              key={p}
              onClick={() => {
                const current = form.platforms || []
                setForm({
                  ...form,
                  platforms: active ? current.filter((x) => x !== p) : [...current, p],
                })
              }}
              style={{
                width: '100%', padding: '12px 14px', marginBottom: 8,
                background: active ? '#22c55e15' : '#1e293b',
                border: `1px solid ${active ? '#22c55e' : '#334155'}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{p.toUpperCase()}</span>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: active ? '#22c55e' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
              }}>
                {active ? '✓' : ''}
              </span>
            </button>
          )
        })}
      </Section>

      {/* Ações */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '16px', marginBottom: 12,
          background: saved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          border: 'none', borderRadius: 14, color: '#fff',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.3s',
        }}
      >
        <Save size={18} />
        {saved ? 'Salvo!' : 'Salvar configurações'}
      </button>

      <button
        onClick={handleExport}
        style={{
          width: '100%', padding: '14px',
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 14, color: '#94a3b8',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <Download size={16} />
        Exportar dados (JSON)
      </button>

      {/* Info */}
      <div style={{ marginTop: 24, padding: 14, background: '#1e293b', borderRadius: 12, border: '1px solid #334155' }}>
        <p style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
          MotoApp v1.0 • Dados salvos localmente no dispositivo
        </p>
        <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 4 }}>
          {trips.length} corridas • {expenses.length} gastos registrados
        </p>
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {icon}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Label({ children }) {
  return <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</p>
}

const inputStyle = {
  width: '100%', background: '#1e293b', border: '1px solid #334155',
  borderRadius: 10, padding: '12px 14px', color: '#f1f5f9',
  fontSize: 15, outline: 'none', marginBottom: 14,
}
