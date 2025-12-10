import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useGetGuildsStore = defineStore('getGuilds', {
  state: () => ({
    names: [],
    guild: [],
    name: '',
  }),

  getters: {
    getGuildNames: (state) => {
      return state.names
    },
    getGuildData: (state) => {
      return state.guild
    },
  },

  actions: {
    async loadGuildNames(names) {
      try {
        const response = await api.post('/getGuildName', {
          name: names,
        })
        this.names = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
    async loadGuildData(guild) {
      try {
        const response = await api.post('/getGuild', {
          id: guild,
          name: this.name,
        })
        this.guild = response.data
      } catch (error) {
        console.error(error.message)
      }
    },
    async setName(name) {
      this.name = name
    },
  },
})
