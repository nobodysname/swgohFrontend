import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    counters: [],
    isAdmin: false,
    adminPassword: null, // NEU: Speichert das Passwort nach erfolgreichem Login im RAM
    loading: false,
    allUnits: [],
  }),

  getters: {
    getCounters: (state) => state.counters,

    // Filter Logik
    getFilteredCounters: (state) => (opponentLeaderId, modeFilter) => {
      return state.counters.filter((c) => {
        // 1. Gegner Match
        const matchOpponent = opponentLeaderId ? c.opponent_leader_id === opponentLeaderId : true

        // 2. Mode Match
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
    // password ist optional (null = Public access)
    async fetchCounters(password = null) {
      this.loading = true

      // Wenn wir schon eingeloggt sind und kein neues PW übergeben wurde, nutzen wir das gespeicherte
      const passwordToUse = password || this.adminPassword
      const headers = passwordToUse ? { 'x-strategy-password': passwordToUse } : {}

      try {
        const res = await api.get('/counters', { headers })

        this.counters = res.data.counters

        // Prüfen, ob wir Admin sind
        if (res.data.role === 'admin') {
          this.isAdmin = true
          // Wenn ein Passwort übergeben wurde (Login-Versuch), speichern wir es
          if (password) {
            this.adminPassword = password
          }
        } else {
          // Falls wir 'guest' sind, setzen wir Admin-Rechte zurück (aber löschen PW nicht sofort, falls Token Logik genutzt würde)
          this.isAdmin = false
        }

        return true // Erfolg (Daten geladen)
      } catch (e) {
        console.error(e)
        // Bei Auth-Fehler (401/403) setzen wir Admin zurück
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          this.isAdmin = false
          this.adminPassword = null
        }
        return false
      } finally {
        this.loading = false
      }
    },

    // Action zum Ausloggen
    logout() {
      this.isAdmin = false
      this.adminPassword = null
      // Optional: Counters neu laden als Gast
      this.fetchCounters(null)
    },

    async addCounter(payload) {
      // Nutzt das gespeicherte Passwort aus dem State
      if (!this.adminPassword) {
        throw new Error('Not authenticated')
      }

      await api.post('/counters', payload, {
        headers: { 'x-strategy-password': this.adminPassword },
      })

      // Reload (nutzt automatisch das gespeicherte PW)
      await this.fetchCounters()
    },

    async deleteCounter(id) {
      // Nutzt das gespeicherte Passwort aus dem State
      if (!this.adminPassword) {
        throw new Error('Not authenticated')
      }

      await api.delete(`/counters/${id}`, {
        headers: { 'x-strategy-password': this.adminPassword },
      })

      // Optimistisches Update im UI (schneller als Reload)
      this.counters = this.counters.filter((c) => c.id !== id)
    },

    // Hilfsfunktion: Setze Units
    setUnits(units) {
      this.allUnits = units
    },
  },
})
