import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useTBStore = defineStore('Tb', {
  state: () => ({
    tbData: null, // Speichert das geladene Ergebnis
  }),

  getters: {
    getTBData: (state) => state.tbData,
  },

  actions: {
    // Lädt die gespeicherte JSON (für Read-Only Ansicht)
    async verifyAdmin(password) {
      try {
        // WICHTIG: Leeres Daten-Objekt {}, dann Config-Objekt mit Headern
        await api.post(
          '/tb/auth',
          {},
          {
            headers: {
              'x-strategy-password': password,
            },
          },
        )
        return true
      } catch (error) {
        // Fehler 401/403 landen hier
        error
        return false
      }
    },

    // 2. Simulation starten
    async runSimulation(payload, password) {
      try {
        // Payload sind die Daten (GP, Rates), Passwort kommt in den Header
        const response = await api.post('/tb/simulate', payload, {
          headers: {
            'x-strategy-password': password,
          },
        })

        return response.data
      } catch (error) {
        console.error('Simulation fehlgeschlagen:', error.message)
        throw error
      }
    },
    async loadLatestData() {
      try {
        const response = await api.get('/tb/latest')
        this.tbData = response.data
        return this.tbData
      } catch (error) {
        // Wenn Fehler 404 (Not Found), dann ist das kein Absturz, sondern einfach "leer"
        if (error.response && error.response.status === 404) {
          console.warn('Noch keine Simulation vorhanden.')
          this.tbData = null
          return null
        }
        // Andere Fehler werfen wir weiter
        console.error('API Fehler:', error.message)
        throw error
      }
    },

    // Führt neue Simulation aus (Benötigt Passwort)
  },
})
