import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const usePlayerStore = defineStore('Player', {
  state: () => ({
    player: [],
    units: [],
    names: [],
  }),

  getters: {
    getPlayerData: (state) => {
      return state.player
    },
    getUnitData: (state) => {
      return state.units
    },
    getUnitNames: (state) => {
      return state.names
    },
  },

  actions: {
    async loadPlayerData() {
      try {
        if (this.player.length > 0) return
        const response = await api.get('/guildroster')
        this.player = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
    async loadAllUnits() {
      try {
        if (this.units.length > 0) return
        const response = await api.get('/units')
        this.units = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
    async loadAllUnitNames() {
      try {
        if (this.names.length > 0) return
        const response = await api.get('/unitNames')
        this.names = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
  },
})
