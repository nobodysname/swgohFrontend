import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const usePlayerStore = defineStore('Player', {
  state: () => ({
    player: [],
  }),

  getters: {
    getPlayerData: (state) => {
      return state.player
    },
  },

  actions: {
    async loadPlayerData() {
      try {
        if (this.player.length > 0) return
        const response = await api.get('/player')
        this.player = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
  },
})
