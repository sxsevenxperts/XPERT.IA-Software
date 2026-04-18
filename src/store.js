import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Gera IDs estáveis para entradas locais (manutenções, trips, expenses).
// Usa crypto.randomUUID() quando disponível; fallback robusto para ambientes antigos.
function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fallback abaixo
    }
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const defaultSettings = {
  // Identidade do motorista
  name: '',
  plate: '',
  // Veículo e combustível
  vehicle: 'carro',
  fuelType: 'gasolina',
  fuelPrice: 6.0,
  fuelConsumption: 10.0,
  // Metas financeiras
  goalDailyRevenue: 0,
  goalDailyProfit: 0,
  goalWeeklyRevenue: 0,
  goalWeeklyProfit: 0,
  goalMonthlyRevenue: 0,
  goalMonthlyProfit: 0,
  goalYearlyRevenue: 0,
  goalYearlyProfit: 0,
  // Plataformas ativas
  platforms: ['uber', '99'],
}

export const useStore = create(
  persist(
    (set) => ({
      settings: { ...defaultSettings },
      trips: [],
      expenses: [],
      maintenances: [],
      appEnabled: true,

      updateSettings: (newSettings) =>
        set(state => ({ settings: { ...state.settings, ...(newSettings || {}) } })),

      addTrip: (trip) =>
        set(state => ({
          trips: [{ id: trip?.id || genId(), ...trip }, ...state.trips],
        })),

      addExpense: (expense) =>
        set(state => ({
          expenses: [{ id: expense?.id || genId(), ...expense }, ...state.expenses],
        })),

      addMaintenance: (m) =>
        set(state => ({
          maintenances: [
            {
              id: m?.id || genId(),
              createdAt: m?.createdAt || Date.now(),
              done: false,
              ...m,
            },
            ...state.maintenances,
          ],
        })),

      updateMaintenance: (id, data) =>
        set(state => ({
          maintenances: state.maintenances.map(m =>
            m.id === id ? { ...m, ...(data || {}) } : m
          ),
        })),

      deleteMaintenance: (id) =>
        set(state => ({
          maintenances: state.maintenances.filter(m => m.id !== id),
        })),

      // Aceita valor explícito (boolean) ou faz toggle se chamado sem argumento.
      toggleAppPower: (value) =>
        set(state => ({
          appEnabled: typeof value === 'boolean' ? value : !state.appEnabled,
        })),

      // Reset completo (mantém sessão Supabase por padrão).
      resetLocal: () =>
        set({
          settings: { ...defaultSettings },
          trips: [],
          expenses: [],
          maintenances: [],
          appEnabled: true,
        }),
    }),
    {
      name: 'easydrive-store',
      version: 2,
      // Garante que perfis salvos antes da v2 recebam os novos campos de settings.
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState
        if (version < 2) {
          return {
            ...persistedState,
            settings: { ...defaultSettings, ...(persistedState.settings || {}) },
          }
        }
        return persistedState
      },
      partialize: (state) => ({
        settings: state.settings,
        maintenances: state.maintenances,
        appEnabled: state.appEnabled,
      }),
    }
  )
)
