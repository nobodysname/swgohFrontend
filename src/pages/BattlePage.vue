<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="header-section text-center q-mb-lg">
        <h1 class="text-h4 text-uppercase text-weight-bold glow-text q-my-none">
          <q-icon name="analytics" color="accent" class="q-mr-sm" />
          Territory Battles
        </h1>
        <div class="text-caption text-grey-4">Strategy & Platoon Assignment</div>
      </div>

      <div class="glass-card filter-bar q-mb-lg">
        <q-tabs
          v-model="tab"
          dense
          class="text-grey-5"
          active-color="accent"
          indicator-color="accent"
          align="justify"
          narrow-indicator
        >
          <q-tab name="strategy" icon="psychology" label="Strategy Overview" />
          <q-tab name="platoon" icon="grid_view" label="Platoon Analysis" />
        </q-tabs>
      </div>

      <q-tab-panels v-model="tab" animated class="bg-transparent q-pa-none">
        <q-tab-panel name="strategy" class="q-pa-none">
          <StrategyPage :analysis="analysis" />
        </q-tab-panel>

        <q-tab-panel name="platoon" class="q-pa-none">
          <div v-if="loading" class="glass-card q-pa-xl text-center text-grey-4">
            <q-spinner-orbit color="accent" size="3em" />
            <div class="q-mt-md">Loading Analysis Data...</div>
          </div>

          <div v-else-if="error" class="glass-card q-pa-xl text-center text-red-4">
            <q-icon name="warning" size="3em" class="q-mb-md" />
            <div>Fehler beim Laden: {{ error }}</div>
          </div>

          <PlatoonAnalysis v-else :analysis="analysis" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTBStore } from 'src/stores/TbStore'

// Components
import PlatoonAnalysis from '../components/PlatoonAnalysis.vue'
import StrategyPage from 'src/components/StrategyPage.vue'

const $q = useQuasar()
const tbStore = useTBStore()

const tab = ref('strategy')
const analysis = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    $q.loading.show({ message: 'Lade TB Strategie...' })
    await tbStore.loadLatestData()
    const res = tbStore.getTBData
    analysis.value = res
  } catch (e) {
    console.log('Keine Daten vorhanden oder Fehler:', e.message)
    error.value = e.message // Fehler speichern für Anzeige
    analysis.value = null
  } finally {
    loading.value = false
    $q.loading.hide()
  }
})
</script>

<style scoped lang="scss">
/* --- GLOBAL --- */
.page-container {
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(rgba(10, 10, 14, 0), rgba(10, 10, 14, 0.637)),
    url('/icons/BGTest.webp') center/cover no-repeat fixed;
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.glow-text {
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(79, 195, 247, 0.2);
  letter-spacing: 2px;
}

/* --- GLASS LOOK --- */
.glass-card {
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}

/* --- NAVIGATION / TABS --- */
.filter-bar {
  width: 100%;
  max-width: 800px; /* Tabs etwas schmaler zentriert sieht meist besser aus */
  margin: 0 auto 24px auto;
  border-radius: 50px; /* Runde Pill-Shape für die Tabs */
  overflow: hidden;
}

/* Tab Anpassungen */
:deep(.q-tab__label) {
  font-weight: bold;
}
</style>
