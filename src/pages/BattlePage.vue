<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="analysis-header">
        <q-tabs v-model="tab" dense class="analysis-tabs" align="center">
          <q-tab name="strategy" label="Strategy Overview" />
          <q-tab name="platoon" label="Platoon Analysis" />
        </q-tabs>
      </div>

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="strategy">
          <StrategyPage :analysis="analysis" />
        </q-tab-panel>

        <q-tab-panel name="platoon">
          <div v-if="loading" class="comparison-section placeholder">Lade TB Analyse…</div>

          <div v-else-if="error" class="comparison-section placeholder">
            Fehler beim Laden: {{ error }}
          </div>

          <PlatoonAnalysis v-else :analysis="analysis" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PlatoonAnalysis from '../components/PlatoonAnalysis.vue'
import StrategyPage from 'src/components/StrategyPage.vue'
import { useTBStore } from 'src/stores/TbStore'
import { useQuasar } from 'quasar'

const tab = ref('strategy')
const $q = useQuasar()
const analysis = ref(null)
const loading = ref(true)
const error = ref(null)
const tbStore = useTBStore()

// In deiner Page Komponente (wo die Tabs sind)

onMounted(async () => {
  try {
    $q.loading.show({ message: 'Lade TB Strategie...' })

    await tbStore.loadLatestData()
    const res = tbStore.getTBData
    analysis.value = res
  } catch (e) {
    // Fehler ist okay (z.B. 404 wenn noch keine Daten da sind)
    console.log('Keine Daten vorhanden oder Fehler:', e.message)
    analysis.value = null // Wichtig: auf null setzen, damit der Placeholder kommt
  } finally {
    // WICHTIG: Das muss hier stehen!
    loading.value = false
    $q.loading.hide()
  }
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 16px;
  background: url('/icons/BGTest.webp') center/cover no-repeat fixed;
  min-height: 100vh;
  color: white;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.content-wrapper {
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  background: transparent !important;
  box-sizing: border-box;
}

.title {
  font-family: 'Star Jedi', sans-serif;
  text-align: center;
  font-size: 2.6rem;
  margin-bottom: 20px;
  color: #ffe81f;
  text-shadow: 0 0 12px #ffe81f;
}

.analysis-header {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 20px;
}

.analysis-tabs {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  padding: 6px 20px;
  max-width: 100%;
  margin-top: 15px;
  border-radius: 12px;
  border: 1px solid rgba(255, 232, 31, 0.25);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
}

.analysis-tabs :deep(.q-tab__label) {
  font-family: 'Star Jedi', sans-serif;
  letter-spacing: 1px;
  font-size: 1rem;
}

.analysis-tabs :deep(.q-tab--active .q-tab__label) {
  color: #ffe81f !important;
  text-shadow: 0 0 8px #ffe81f;
}

.analysis-tabs :deep(.q-tabs__content) {
  gap: 20px;
}

:deep(.q-tab-panel) {
  background: transparent !important;
  padding: 0 !important;
}
:deep(.q-tab-panels) {
  background: transparent !important;
}

.comparison-section {
  background: rgba(0, 0, 0, 0.45) !important;
  border: 1px solid rgba(255, 232, 31, 0.18);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(6px);
}

.placeholder {
  text-align: center;
  opacity: 0.7;
}
</style>
