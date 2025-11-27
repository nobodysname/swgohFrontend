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
        const response = await api.get('/guilds')
        this.guild = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
  },
})
