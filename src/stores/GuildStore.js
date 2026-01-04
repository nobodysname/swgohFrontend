import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useGuildStore = defineStore('Guild', {
  state: () => ({
    guild: [],
  }),

  getters: {
    getGuildData: (state) => {
      return state.guild
    },
  },

  actions: {
    async loadGuildData() {
      try {
        if (this.guild.length > 0) return
        const response = await api.get('/guilds')
        this.guild = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
  },
})
