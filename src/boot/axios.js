import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// Dynamische URL je nach Umgebung
const isDev = process.env.NODE_ENV === 'development'

const baseURL = isDev
  ? 'http://localhost:3000' // Development
  : 'https://ginwalkers.de:3000' // Production

const api = axios.create({ baseURL })

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
