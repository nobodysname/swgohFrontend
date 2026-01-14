import { defineStore } from 'pinia'

export const useImageStore = defineStore('ImageStore', {
  state: () => ({
    // Hier speichern wir die Bilder: { 'tex.charui_rex': 'data:image/png;base64...' }
    imageCache: {},
    // Hier merken wir uns laufende Anfragen, um doppelte Downloads zu verhindern
    pendingRequests: {},
  }),

  getters: {
    getImage: (state) => (assetName) => {
      return state.imageCache[assetName]
    },
  },

  actions: {
    hasImage(assetName) {
      return !!this.imageCache[assetName]
    },

    saveImage(assetName, dataUrl) {
      this.imageCache[assetName] = dataUrl
    },

    // Optional: Verhindert, dass 10 Icons gleichzeitig dasselbe Bild anfordern
    isPending(assetName) {
      return !!this.pendingRequests[assetName]
    },

    setPending(assetName, promise) {
      this.pendingRequests[assetName] = promise
    },

    clearPending(assetName) {
      delete this.pendingRequests[assetName]
    },
  },
})
