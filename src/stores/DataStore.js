import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useDataStore = defineStore('Data', {
  state: () => ({
    data: [],
  }),

  getters: {
    getDataData: (state) => {
      return state.data
    },
  },

  actions: {
    async loadDataData() {
      try {
        if (this.data.length > 0) return
        const response = await api.get('/data')
        this.data.push(response.data)
      } catch (error) {
        console.error(error.message)
      }
    },
  },
})
