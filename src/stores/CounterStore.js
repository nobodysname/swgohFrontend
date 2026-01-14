import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    counters: [],
    isAdmin: false,
    loading: false,
    // Kleiner Cache für Unit-Daten, falls du keinen globalen UnitStore hast.
    // Idealerweise holst du das aus deinem bestehenden System (Comlink).
    allUnits: [],
  }),

  getters: {
    getCounters: (state) => state.counters,

    // Filter Logik im Getter für maximale Performance
    getFilteredCounters: (state) => (opponentLeaderId, modeFilter) => {
      return state.counters.filter((c) => {
        // 1. Gegner Match (wenn keiner gewählt, zeige alle)
        const matchOpponent = opponentLeaderId ? c.opponent_leader_id === opponentLeaderId : true

        // 2. Mode Match (TB, GAC oder BOTH)
        // Wenn Filter 'TB' ist -> zeige 'TB' UND 'BOTH'
        let matchMode = true
        if (modeFilter) {
          if (c.game_mode === 'BOTH') matchMode = true
          else matchMode = c.game_mode === modeFilter
        }

        return matchOpponent && matchMode
      })
    },
  },

  actions: {
    async fetchCounters(password) {
      this.loading = true
      try {
        const headers = password ? { 'x-strategy-password': password } : {}
        const res = await api.get('/counters', { headers })
        this.counters = res.data.counters
        this.isAdmin = res.data.role === 'admin'
        return true
      } catch (e) {
        console.error(e)
        return false
      } finally {
        this.loading = false
      }
    },

    async addCounter(payload, password) {
      await api.post('/counters', payload, {
        headers: { 'x-strategy-password': password },
      })
      await this.fetchCounters(password) // Reload
    },

    async deleteCounter(id, password) {
      await api.delete(`/counters/${id}`, {
        headers: { 'x-strategy-password': password },
      })
      this.counters = this.counters.filter((c) => c.id !== id)
    },

    // Hilfsfunktion: Setze Units (wird von der Page aufgerufen, wenn sie geladen werden)
    setUnits(units) {
      this.allUnits = units
    },
  },
})
