import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// Automatische BaseURL je nach Umgebung
const api = axios.create({
  baseURL:
    window.location.hostname === 'localhost'
      ? 'http://localhost:3300'
      : `${window.location.protocol}//${window.location.hostname}:3300`,
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
