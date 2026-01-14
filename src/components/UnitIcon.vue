<template>
  <div class="unit-icon-wrapper" :style="wrapperStyle">
    <q-spinner v-if="loading" color="accent" size="50%" />

    <img
      v-else-if="currentImage"
      :src="currentImage"
      class="unit-img"
      :class="{ 'is-round': round }"
      @error="handleError"
    />

    <div v-else class="fallback-icon">
      <q-icon name="broken_image" color="red" size="50%" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useImageStore } from 'src/stores/ImageStore' // <--- IMPORT

const props = defineProps({
  unitName: String,
  allUnitData: { type: Array, default: () => [] },
  size: { type: String, default: '100%' },
  round: Boolean,
})

const imageStore = useImageStore() // <--- STORE NUTZEN
const loading = ref(true)
const localError = ref(false)

// Wir holen das Bild direkt aus dem Store, wenn es da ist
const currentImage = computed(() => {
  // 1. Asset Name ermitteln (müssen wir hier nochmal machen oder speichern)
  if (!props.unitName || !props.allUnitData.length) return null

  const unitObj = props.allUnitData.find(
    (u) => u.name.toLowerCase() === props.unitName.toLowerCase(),
  )
  if (!unitObj || !unitObj.thumbnailName) return null

  const assetName = unitObj.thumbnailName.replace(/^tex\./, '')

  // Gibt Bild aus Store zurück oder null
  return imageStore.getImage(assetName)
})

const wrapperStyle = computed(() => ({
  width: props.size,
  height: props.size,
  minWidth: props.size === '100%' ? 'auto' : props.size,
  minHeight: props.size === '100%' ? 'auto' : props.size,
}))

const loadImage = async () => {
  if (!props.unitName || props.unitName === 'ANY') {
    loading.value = false
    return
  }

  // Warten auf UnitData
  if (!props.allUnitData || props.allUnitData.length === 0) {
    return
  }

  // 1. Asset Name finden
  const unitObj = props.allUnitData.find(
    (u) => u.name.toLowerCase() === props.unitName.toLowerCase(),
  )

  if (!unitObj || !unitObj.thumbnailName) {
    loading.value = false
    return
  }

  const assetName = unitObj.thumbnailName.replace(/^tex\./, '')

  // 2. CHECK: Haben wir das Bild schon im Store?
  if (imageStore.hasImage(assetName)) {
    // Ja -> Fertig! Keine API Anfrage nötig.
    loading.value = false
    return
  }

  // 3. CHECK: Lädt das Bild gerade schon woanders? (Concurrency)
  if (imageStore.isPending(assetName)) {
    // Wir warten auf den existierenden Request
    try {
      await imageStore.pendingRequests[assetName]
    } catch (e) {
      /* ignore */
      e
    }
    loading.value = false
    return
  }

  // 4. NEU LADEN
  loading.value = true
  localError.value = false

  // Promise erstellen und im Store speichern, damit andere Icons warten können
  const requestPromise = api.get(`/icons/${assetName}`)
  imageStore.setPending(assetName, requestPromise)

  try {
    const res = await requestPromise

    if (res.data.image) {
      // WICHTIG: Im globalen Store speichern!
      imageStore.saveImage(assetName, res.data.image)
    }
  } catch (e) {
    console.error(`Load failed: ${assetName}`)
    e
    localError.value = true
  } finally {
    imageStore.clearPending(assetName)
    loading.value = false
  }
}

const handleError = () => {
  localError.value = true
}

onMounted(loadImage)

// Watcher bleiben gleich
watch(() => props.unitName, loadImage)
watch(
  () => props.allUnitData,
  (newData) => {
    if (newData && newData.length > 0) loadImage()
  },
  { deep: true },
)
</script>

<style scoped>
/* Dein CSS bleibt unverändert */
.unit-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background-color: rgba(0, 0, 0, 0.2);
}
.unit-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.is-round {
  border-radius: 50%;
}
.fallback-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
