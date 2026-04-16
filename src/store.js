import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultSettings = {
  nome: '',
  carro: '',
  placa: '',
  fuelPrice: 6.0,
  fuelConsumption: 10.0,
  metaDiaria: 200,
  platforms: ['uber', '99'],
}

export const useStore = create(
  persist(
    (set, get) => ({
      settings: { ...defaultSettings },
      trips: [],
      expenses: [],
      maintenances: [],
      appEnabled: true,

      updateSettings: (newSettings) =>
        set(state => ({ settings: { ...state.settings, ...newSettings } })),

      addTrip: (trip) =>
        set(state => ({ trips: [trip, ...state.trips] })),

      addExpense: (expense) =>
        set(state => ({ expenses: [expense, ...state.expenses] })),

      addMaintenance: (m) =>
        set(state => ({ maintenances: [m, ...state.maintenances] })),

      updateMaintenance: (id, data) =>
        set(state => ({
          maintenances: state.maintenances.map(m => m.id === id ? { ...m, ...data } : m)
        })),

      deleteMaintenance: (id) =>
        set(state => ({
          maintenances: state.maintenances.filter(m => m.id !== id)
        })),

      toggleAppPower: () =>
        set(state => ({ appEnabled: !state.appEnabled })),
    }),
    {
      name: 'easydrive-store',
      partialize: (state) => ({
        settings: state.settings,
        maintenances: state.maintenances,
        appEnabled: state.appEnabled,
      }),
    }
  )
)
