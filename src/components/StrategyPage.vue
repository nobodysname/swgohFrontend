<template>
  <div class="strategy-page-wrapper">
    <div v-if="showLogin" class="login-overlay">
      <div class="login-card glass-panel">
        <h2 class="sidebar-title">Admin Access</h2>
        <p class="text-grey-5 q-mb-md">Enter password to unlock simulation settings.</p>
        <q-input
          v-model="password"
          type="password"
          filled
          dark
          dense
          color="yellow"
          bg-color="rgba(0,0,0,0.5)"
          placeholder="Password"
          @keyup.enter="handleLogin"
          class="q-mb-md"
          autofocus
        >
          <template v-slot:prepend><q-icon name="lock" color="yellow" /></template>
        </q-input>
        <div class="btn-group-vertical">
          <q-btn
            label="Login"
            color="yellow-9"
            text-color="black"
            class="full-width font-bold"
            @click="handleLogin"
            :loading="isValidating"
          />
          <q-btn
            flat
            label="Cancel"
            color="white"
            class="full-width q-mt-sm"
            @click="showLogin = false"
          />
        </div>
      </div>
    </div>

    <div class="strategy-console">
      <div v-if="adminModeActive && isAuthenticated" class="config-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">Simulation Settings</h2>
          <div class="sidebar-subtitle">Admin Mode Active</div>
        </div>

        <div class="settings-content">
          <div class="gp-calc-section">
            <div class="label-row q-mb-sm">
              <span class="label text-grey-5">Total Guild GP</span>
              <span class="value-display text-white">{{ formatGP(totalGuildGP) }}</span>
            </div>

            <div class="input-section no-margin">
              <div class="label-row">
                <span class="label text-orange">Unused / Missing GP</span>
              </div>
              <q-input
                v-model.number="unusedGP"
                type="number"
                filled
                dark
                dense
                class="gp-input"
                color="orange"
                bg-color="rgba(0,0,0,0.3)"
                :rules="[(val) => val >= 0 || 'Cannot be negative']"
              >
                <template v-slot:prepend><q-icon name="person_off" color="orange" /></template>
              </q-input>
            </div>

            <div class="effective-gp-display glass-panel q-mt-sm">
              <div class="row justify-between items-center">
                <span class="label text-yellow no-margin">Deployable GP</span>
                <span class="text-h6 text-yellow text-bold">{{ formatGP(effectiveGP) }}</span>
              </div>
              <div class="text-caption text-grey-6 text-right">used for simulation</div>
            </div>
          </div>

          <q-separator class="sep" />

          <div class="input-section">
            <div class="label-row"><span class="label">Combat Success Rates</span></div>
            <div class="rates-grid-compact">
              <div v-for="(rate, i) in successRates" :key="i" class="rate-item-compact">
                <div class="rate-header">
                  <span class="day-label">Day {{ i + 1 }}</span>
                  <span class="pct-label text-yellow"
                    >{{ (successRates[i] * 100).toFixed(0) }}%</span
                  >
                </div>
                <q-slider
                  v-model="successRates[i]"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  color="yellow"
                  track-color="grey-8"
                  dark
                  dense
                />
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="btn-group">
            <q-btn
              label="Run & Save"
              color="yellow-9"
              text-color="black"
              class="run-btn"
              :loading="isSimulating"
              @click="triggerSimulation"
              icon="save"
              glossy
            />
            <q-btn flat round icon="logout" color="white" @click="logout" title="Exit Admin Mode" />
          </div>
        </div>
      </div>

      <div class="vis-content" :class="{ 'full-width': !adminModeActive }">
        <div class="content-header row justify-between items-center">
          <h1 class="content-title">
            {{ adminModeActive ? 'Simulation Preview' : 'Active Strategy Analysis' }}
          </h1>
          <div class="header-actions row items-center">
            <q-btn
              v-if="!adminModeActive"
              flat
              icon="settings"
              label="Admin Mode"
              color="yellow"
              class="q-mr-sm"
              @click="requestAdminAccess"
            />
            <q-btn flat round icon="close" color="white" @click="$emit('close')" />
          </div>
        </div>

        <div v-if="adminModeActive && !localResult" class="placeholder-state">
          <div class="hologram-effect">
            <q-icon name="settings_suggest" size="80px" color="yellow" class="pulsing-icon" />
          </div>
          <div class="placeholder-title">Ready to Simulate</div>
          <div class="placeholder-text">
            Adjust unused GP and success rates, then click 'Run & Save'.
          </div>
        </div>

        <div v-else-if="displayedResult" class="timeline-container">
          <q-timeline color="yellow" dark layout="dense" class="custom-timeline">
            <q-timeline-entry
              v-for="step in displayedResult.path"
              :key="step.day"
              :icon="step.strategy.isSandbaggingVariant ? 'hourglass_bottom' : 'flag'"
              :color="step.strategy.isSandbaggingVariant ? 'orange' : 'yellow'"
            >
              <template v-slot:title>
                <div class="timeline-title-row">
                  <span class="day-text">Day {{ step.day }}</span>
                  <span class="stars-sub text-grey-5">{{ step.totalStarsSoFar }} Total Stars</span>
                </div>
              </template>
              <div class="day-card glass-panel">
                <div
                  class="day-header"
                  :class="{ 'sandbag-mode': step.strategy.isSandbaggingVariant }"
                >
                  <div class="day-stats">
                    <q-chip dense color="yellow-10" text-color="black" icon="star"
                      >+{{ step.stars }}</q-chip
                    >
                    <q-chip dense color="dark" text-color="grey-4" icon="military_tech">{{
                      formatGP(step.strategy.usedGP)
                    }}</q-chip>
                    <q-chip
                      v-if="step.strategy.isSandbaggingVariant"
                      dense
                      color="orange-9"
                      text-color="black"
                      icon="warning"
                      >PRELOAD</q-chip
                    >
                  </div>
                </div>
                <div class="planets-grid">
                  <div
                    v-for="(plan, idx) in step.strategy.plan"
                    :key="idx"
                    class="planet-node"
                    :class="{
                      'node-completed': plan.targetStars > 0,
                      'node-preload': plan.targetStars === 0,
                    }"
                  >
                    <div class="node-top">
                      <span class="p-name">{{ plan.name }}</span>
                      <div class="stars-display">
                        <q-icon
                          v-for="s in 3"
                          :key="s"
                          name="star"
                          :class="s <= plan.targetStars ? 'text-yellow' : 'text-grey-8'"
                          size="xs"
                        />
                      </div>
                    </div>
                    <div class="bar-container">
                      <div
                        class="bar-fill"
                        :style="{ width: getProgressPercent(plan) + '%' }"
                      ></div>
                      <span class="bar-label">{{ formatNumber(getTotalPoints(plan)) }} TP</span>
                    </div>
                  </div>
                </div>
                <q-expansion-item
                  dark
                  dense
                  dense-toggle
                  expand-separator
                  icon="military_tech"
                  label="Operations & Platoons"
                  class="ops-expansion"
                >
                  <div class="ops-details-list">
                    <div v-for="op in step.opsDetails" :key="op.planetId" class="op-block">
                      <div class="op-header">
                        <span class="op-name">{{ op.planetName }}</span>
                        <span class="op-val text-yellow">{{ formatNumber(op.totalTP) }} TP</span>
                      </div>
                      <div class="platoon-grid">
                        <div
                          v-for="(platoon, pIdx) in op.platoons"
                          :key="platoon.id"
                          class="platoon-item"
                          :class="platoon.status === 'FILLED' ? 'status-filled' : 'status-missing'"
                        >
                          <span class="p-num">{{ pIdx + 1 }}</span>
                          <q-tooltip
                            content-class="bg-black text-body2"
                            anchor="top middle"
                            self="bottom middle"
                          >
                            <div class="text-bold">Op {{ pIdx + 1 }}</div>
                            <div class="text-caption">Status: {{ platoon.status }}</div>
                            <div class="text-yellow">
                              +{{ formatNumber(platoon.pointsGained) }} TP
                            </div>
                            <div
                              v-if="platoon.missing && platoon.missing.length > 0"
                              class="text-red q-mt-xs"
                            >
                              Missing: {{ platoon.missing.length }} Units
                            </div>
                          </q-tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-expansion-item>
              </div>
            </q-timeline-entry>
          </q-timeline>
        </div>

        <div v-else class="placeholder-state">
          <div class="hologram-effect">
            <q-icon name="search_off" size="80px" color="grey-6" class="" />
          </div>
          <div class="placeholder-title">No Analysis Found</div>
          <div class="placeholder-text">
            There is no strategy data available yet.<br />Please enter Admin Mode to run the first
            simulation.
          </div>
          <q-btn
            icon="settings"
            label="Enter Admin Mode"
            color="yellow"
            text-color="black"
            class="q-mt-lg"
            @click="requestAdminAccess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/GuildStore'
import { useTBStore } from 'src/stores/TbStore'

const props = defineProps({
  analysis: { type: Object, default: null },
})

defineEmits(['close'])

const $q = useQuasar()
const guildStore = useGuildStore()
const tbStore = useTBStore()

// --- STATE ---
const totalGuildGP = ref(400000000) // Default Fallback
const unusedGP = ref(0) // NEU: Was abgezogen wird
const password = ref('')
const successRates = ref([1.0, 1.0, 0.95, 0.9, 0.85, 0.8])

// UI Flags
const showLogin = ref(false)
const isAuthenticated = ref(false)
const adminModeActive = ref(false)
const isValidating = ref(false)
const isSimulating = ref(false)
const localResult = ref(null)

// --- COMPUTED ---
const displayedResult = computed(() => {
  if (adminModeActive.value && localResult.value) {
    return localResult.value
  }
  return props.analysis
})

// NEU: Berechnung der Effektiven GP
const effectiveGP = computed(() => {
  const eff = totalGuildGP.value - unusedGP.value
  return eff > 0 ? eff : 0
})

// --- SYNC PARAMS ---
function syncParamsFromAnalysis(data) {
  // Immer Total GP aus dem Store (Source of Truth) holen, falls verfügbar
  if (
    guildStore.getGuildData.guild.profile.guildGalacticPower &&
    guildStore.getGuildData.guild.profile.guildGalacticPower > 0
  ) {
    totalGuildGP.value = guildStore.getGuildData.guild.profile.guildGalacticPower
  }

  // Fall 1: Wir haben gespeicherte Params
  if (data && data.simulationParams) {
    // Wenn in der Simulation eine GP gespeichert war (das ist die EFFEKTIVE GP),
    // dann berechnen wir rückwärts, wie viel "Unused" war.
    if (data.simulationParams.guildGP) {
      const savedEffective = data.simulationParams.guildGP
      // Unused ist Differenz zwischen heutigem Total und damals genutztem
      // (Falls Total sich geändert hat, ist das die sicherste Annäherung)
      unusedGP.value = Math.max(0, totalGuildGP.value - savedEffective)
    }

    if (data.simulationParams.successRates && Array.isArray(data.simulationParams.successRates)) {
      successRates.value = [...data.simulationParams.successRates]
    }
  }
  // Fall 2: Keine Daten da -> Reset
  else {
    unusedGP.value = 0
  }
}

onMounted(async () => {
  // Total GP initialisieren
  await guildStore.loadGuildData()
  if (guildStore.getGuildData.guild.profile.guildGalacticPower)
    totalGuildGP.value = guildStore.getGuildData.guild.profile.guildGalacticPower
  syncParamsFromAnalysis(props.analysis)
})

watch(adminModeActive, (isActive) => {
  if (isActive) {
    syncParamsFromAnalysis(displayedResult.value)
  }
})

watch(
  () => props.analysis,
  (newVal) => {
    if (!localResult.value) {
      syncParamsFromAnalysis(newVal)
    }
  },
)

// --- ACTIONS ---
function requestAdminAccess() {
  if (isAuthenticated.value) {
    adminModeActive.value = true
  } else {
    showLogin.value = true
  }
}

async function handleLogin() {
  if (!password.value) return
  isValidating.value = true
  const valid = await tbStore.verifyAdmin(password.value)
  isValidating.value = false
  if (valid) {
    isAuthenticated.value = true
    showLogin.value = false
    adminModeActive.value = true
    $q.notify({ type: 'positive', message: 'Admin Access Granted' })
  } else {
    $q.notify({ type: 'negative', message: 'Invalid Password' })
    password.value = ''
  }
}

function logout() {
  adminModeActive.value = false
  isAuthenticated.value = false
  password.value = ''
  localResult.value = null
  syncParamsFromAnalysis(props.analysis)
}

async function triggerSimulation() {
  // Sicherheitscheck
  if (effectiveGP.value <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Effective GP is too low!',
      caption: 'Check unused GP amount.',
    })
    return
  }

  isSimulating.value = true
  try {
    const payload = {
      guildGP: effectiveGP.value, // Wir senden die berechnete GP
      strikeZoneSuccessRates: successRates.value,
    }
    const result = await tbStore.runSimulation(payload, password.value)
    localResult.value = result
    $q.notify({ type: 'positive', message: 'Simulation updated' })
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'negative', message: 'Simulation failed' })
    logout()
  } finally {
    isSimulating.value = false
  }
}

// Helpers
function formatNumber(num) {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    num,
  )
}
function formatGP(num) {
  return (num / 1000000).toFixed(1) + 'M' // Auf 1 Dezimalstelle für genauere Anzeige
}
function getProgressPercent(plan) {
  const currentTP = getTotalPoints(plan)
  if (plan.targetStars === 3) return 100
  const nextThreshold = plan.thresholds[plan.targetStars]
  if (!nextThreshold) return 100
  return Math.min(100, (currentTP / plan.thresholds[2]) * 100)
}
function getTotalPoints(plan) {
  return (
    (plan.opsTP || 0) +
    (plan.strikeTP || 0) +
    (plan.preloadedTP || 0) +
    plan.cost +
    plan.extraDeployment
  )
}
</script>

<style scoped lang="scss">
/* Stays the same, just adding utility for margins */
.no-margin {
  margin: 0;
}

.gp-calc-section {
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}
.effective-gp-display {
  border-color: rgba(255, 232, 31, 0.3);
  background: rgba(255, 232, 31, 0.05);
}

/* ... Rest der Styles wie zuvor ... */
/* --- OVERLAYS --- */
.login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  z-index: 5000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-card {
  width: 350px;
  padding: 30px;
  text-align: center;
  border: 1px solid rgba(255, 232, 31, 0.3);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

/* --- WRAPPER --- */
.strategy-page-wrapper {
  position: relative;
  width: 100%;
  height: calc(80vh - 120px);
  margin-top: 10px;
  background: rgba(0, 0, 0, 0);
  display: flex;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 233, 31, 0.11);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(4px);
}

.strategy-console {
  display: flex;
  width: 100%;
  height: 100%;
  background: rgba(20, 24, 29, 0.65);
  backdrop-filter: blur(12px);
}

/* SIDEBAR */
.config-sidebar {
  width: 320px;
  min-width: 320px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
}

/* VIS CONTENT */
.vis-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  padding: 0;
}

/* Header Styles */
.content-header {
  padding: 20px 40px;
  border-bottom: 1px solid rgba(255, 232, 31, 0.2);
  background: rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.content-title {
  font-size: 1.4rem;
  color: #ffe81f;
  text-transform: uppercase;
  margin: 0;
  font-weight: 300;
}

/* Timeline Container */
.timeline-container {
  padding: 20px 40px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Placeholder */
.placeholder-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0.7;
  text-align: center;
}
.pulsing-icon {
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
}
.placeholder-title {
  font-family: 'Star Jedi';
  font-size: 1.8rem;
  margin-top: 20px;
  color: #eee;
}
.placeholder-text {
  color: #bbb;
  font-size: 1rem;
  margin-top: 10px;
}

/* Standard Components */
.sidebar-header {
  padding: 20px 20px 10px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 232, 31, 0.1);
}
.sidebar-title {
  color: #ffe81f;
  font-family: 'Star Jedi';
  font-size: 1.3rem;
  margin: 0;
}
.sidebar-subtitle {
  font-size: 0.8rem;
  color: #aaa;
  text-transform: uppercase;
  margin-top: 5px;
}
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.input-section {
  margin-bottom: 20px;
}
.label {
  font-weight: 600;
  color: #eee;
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
}
.rates-grid-compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.rate-item-compact {
  background: rgba(255, 255, 255, 0.05);
  padding: 5px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.rate-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #ccc;
}
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
}
.btn-group {
  display: flex;
  gap: 10px;
}
.run-btn {
  flex-grow: 1;
  font-weight: 800;
}
.sep {
  background: rgba(255, 255, 255, 0.1);
  margin: 15px 0;
}
.glass-panel {
  background: rgba(20, 20, 20, 0.4);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-top: 8px;
}
.day-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
}
.day-stats {
  display: flex;
  gap: 8px;
}
.planets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.planet-node {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #555;
}
.node-completed {
  border-left-color: #ffe81f;
}
.node-preload {
  border-left-color: #ff9800;
}
.node-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  color: #eee;
}
.bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  margin-top: 6px;
}
.bar-fill {
  height: 100%;
  background: #ffe81f;
  box-shadow: 0 0 10px rgba(255, 232, 31, 0.5);
}
.bar-label {
  position: absolute;
  top: -18px;
  right: 0;
  font-size: 0.75rem;
  color: #bbb;
}
.timeline-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.day-text {
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

/* OPS EXPANSION STYLES */
.ops-expansion {
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 8px;
  border-radius: 0 0 12px 12px;
}

.ops-details-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.op-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 12px;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.op-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.op-name {
  font-weight: 700;
  color: #ddd;
}

.op-val {
  font-family: monospace;
  font-weight: bold;
}

/* PLATOON GRID */
.platoon-grid {
  display: flex;
  gap: 6px;
}

.platoon-item {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: help;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #888;
}

.platoon-item:hover {
  transform: scale(1.1);
  z-index: 2;
}

/* Colors for Status */
.status-filled {
  background: rgba(0, 200, 83, 0.25);
  border-color: #69f0ae;
  color: #69f0ae;
  box-shadow: 0 0 8px rgba(105, 240, 174, 0.3);
}

.status-missing {
  background: rgba(211, 47, 47, 0.25);
  border-color: #ff5252;
  color: #ff5252;
}
</style>
