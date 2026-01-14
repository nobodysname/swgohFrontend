<template>
  <div class="strategy-page-wrapper">
    <div class="strategy-console">
      <div v-if="adminModeActive && isAuthenticated" class="config-sidebar glass-card column">
        <div class="sidebar-header q-pa-md text-center border-bottom-accent">
          <div class="text-h6 text-accent font-jedi">Simulation Settings</div>
          <div class="text-caption text-grey-5 text-uppercase">Admin Mode Active</div>
        </div>

        <div class="settings-content col scroll q-pa-md custom-scroll">
          <div class="gp-calc-section q-mb-md">
            <div class="row justify-between q-mb-sm">
              <span class="text-grey-4 text-caption text-uppercase">Total Guild GP</span>
              <span class="text-white text-weight-bold">{{ formatGP(totalGuildGP) }}</span>
            </div>

            <q-input
              v-model.number="unusedGP"
              type="number"
              filled
              dark
              dense
              label="Unused / Missing GP"
              class="high-contrast-input q-mb-md"
              :rules="[(val) => val >= 0 || 'Cannot be negative']"
            >
              <template v-slot:prepend><q-icon name="person_off" color="orange" /></template>
            </q-input>

            <div class="bg-dark-transparent q-pa-sm rounded-borders border-accent">
              <div class="row justify-between items-center">
                <span class="text-accent text-weight-bold">Deployable GP</span>
                <span class="text-h6 text-white">{{ formatGP(effectiveGP) }}</span>
              </div>
              <div class="text-caption text-grey-6 text-right">used for simulation</div>
            </div>
          </div>

          <q-separator dark class="q-my-md" />

          <div class="input-section">
            <div class="text-caption text-grey-4 text-uppercase q-mb-sm">Combat Success Rates</div>
            <div class="rates-grid-compact">
              <div v-for="(rate, i) in successRates" :key="i" class="rate-item-compact">
                <div class="row justify-between text-caption text-grey-4">
                  <span>Day {{ i + 1 }}</span>
                  <span class="text-accent text-weight-bold"
                    >{{ (successRates[i] * 100).toFixed(0) }}%</span
                  >
                </div>
                <q-slider
                  v-model="successRates[i]"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  color="accent"
                  track-color="grey-8"
                  dark
                  dense
                />
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-footer q-pa-md border-top-accent bg-dark-transparent">
          <div class="row q-gutter-sm">
            <q-btn
              label="Run & Save"
              color="accent"
              text-color="white"
              class="col-grow text-weight-bold shadow-2"
              :loading="isSimulating"
              @click="triggerSimulation"
              icon="save"
            />
            <q-btn flat round icon="logout" color="grey-5" @click="logout" size="sm">
              <q-tooltip>Exit Admin Mode</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <div class="vis-content col column" :class="{ 'full-width': !adminModeActive }">
        <div v-if="showLogin" class="login-overlay">
          <div class="glass-card login-card">
            <div class="text-center q-mb-md">
              <q-icon name="security" size="xl" color="accent" />
              <div class="text-h5 text-uppercase q-mt-sm text-white font-jedi">Admin Access</div>
            </div>
            <p class="text-grey-4 q-mb-md text-center">
              Enter security code to unlock simulation settings.
            </p>

            <q-input
              v-model="password"
              type="password"
              filled
              dark
              dense
              label="Password"
              class="high-contrast-input q-mb-md"
              @keyup.enter="handleLogin"
              autofocus
            >
              <template v-slot:prepend><q-icon name="lock" color="accent" /></template>
            </q-input>

            <div class="column q-gutter-sm">
              <q-btn
                label="Login"
                color="accent"
                text-color="white"
                class="full-width text-weight-bold"
                @click="handleLogin"
                :loading="isValidating"
              />
              <q-btn
                flat
                label="Cancel"
                color="grey-5"
                class="full-width"
                @click="showLogin = false"
              />
            </div>
          </div>
        </div>

        <div class="glass-card q-mb-sm q-pa-sm row justify-between items-center header-bar">
          <div class="text-h6 text-uppercase text-white q-ml-md mobile-header-text">
            <q-icon name="insights" color="accent" class="q-mr-sm" />
            <span class="gt-xs">{{
              adminModeActive ? 'Simulation Preview' : 'Active Strategy Analysis'
            }}</span>
            <span class="lt-sm">{{ adminModeActive ? 'Sim Preview' : 'Analysis' }}</span>
          </div>
          <div class="q-mr-sm">
            <q-btn
              v-if="!adminModeActive"
              flat
              icon="settings"
              :label="$q.screen.gt.xs ? 'Admin Mode' : ''"
              color="accent"
              @click="requestAdminAccess"
            />
          </div>
        </div>

        <div
          v-if="adminModeActive && !localResult"
          class="col column flex-center text-center opacity-70"
        >
          <q-icon name="settings_suggest" size="80px" color="accent" class="pulsing-icon q-mb-md" />
          <div class="text-h5 text-white font-jedi">Ready to Simulate</div>
          <div class="text-grey-4">Adjust settings and click 'Run & Save'.</div>
        </div>

        <div v-else-if="displayedResult" class="glass-card timeline-wrapper custom-scroll">
          <q-timeline color="accent" dark layout="dense">
            <q-timeline-entry
              v-for="step in displayedResult.path"
              :key="step.day"
              :icon="step.strategy.isSandbaggingVariant ? 'hourglass_bottom' : 'flag'"
              :color="step.strategy.isSandbaggingVariant ? 'orange' : 'accent'"
            >
              <template v-slot:title>
                <div class="row items-baseline q-gutter-x-md">
                  <span class="text-h5 text-white text-weight-bold font-jedi"
                    >Day {{ step.day }}</span
                  >
                  <span class="text-subtitle2 text-grey-5"
                    >{{ step.totalStarsSoFar }} Total Stars</span
                  >
                </div>
              </template>

              <div class="glass-card q-pa-md day-card">
                <div class="row items-center justify-between q-mb-md pb-2 border-bottom-light">
                  <div class="row q-gutter-x-sm q-gutter-y-xs wrap">
                    <q-chip
                      dense
                      color="accent"
                      text-color="white"
                      icon="star"
                      class="text-weight-bold shadow-1"
                    >
                      +{{ step.stars }} Stars
                    </q-chip>
                    <q-chip
                      dense
                      color="dark"
                      text-color="grey-4"
                      icon="military_tech"
                      class="border-grey"
                    >
                      {{ formatGP(step.strategy.usedGP) }} GP Used
                    </q-chip>
                    <q-chip
                      v-if="step.strategy.isSandbaggingVariant"
                      dense
                      color="orange"
                      text-color="black"
                      icon="warning"
                      class="text-weight-bold"
                      >PRELOAD</q-chip
                    >
                  </div>
                </div>

                <div class="row q-col-gutter-md">
                  <div v-for="(plan, idx) in step.strategy.plan" :key="idx" class="col-12 col-md-4">
                    <div
                      class="planet-node q-pa-sm rounded-borders"
                      :class="{
                        'border-left-accent': plan.targetStars > 0,
                        'border-left-orange': plan.targetStars === 0,
                      }"
                    >
                      <div class="row justify-between items-center q-mb-xs">
                        <span class="text-weight-bold text-white">{{ plan.name }}</span>
                        <div>
                          <q-icon
                            v-for="s in 3"
                            :key="s"
                            name="star"
                            :class="s <= plan.targetStars ? 'text-accent' : 'text-grey-9'"
                            size="xs"
                          />
                        </div>
                      </div>

                      <div class="bar-bg">
                        <div
                          class="bar-fill"
                          :style="{ width: getProgressPercent(plan) + '%' }"
                        ></div>
                      </div>
                      <div class="text-right text-caption text-grey-5 q-mt-xs">
                        {{ formatNumber(getTotalPoints(plan)) }} TP
                      </div>
                    </div>
                  </div>
                </div>

                <q-expansion-item
                  dark
                  dense
                  dense-toggle
                  expand-separator
                  icon="military_tech"
                  label="Ops & Platoons"
                  class="q-mt-sm bg-dark-transparent rounded-borders"
                  header-class="text-grey-4"
                >
                  <div class="q-pa-sm">
                    <div v-for="op in step.opsDetails" :key="op.planetId" class="q-mb-sm">
                      <div class="row justify-between text-caption text-grey-4 q-mb-xs">
                        <span>{{ op.planetName }}</span>
                        <span>{{ formatNumber(op.totalTP) }} TP</span>
                      </div>

                      <div class="row q-gutter-xs">
                        <div
                          v-for="(platoon, pIdx) in op.platoons"
                          :key="platoon.id"
                          class="platoon-box clickable"
                          :class="getPlatoonClass(platoon.status)"
                          @click.stop="openPlatoonDetails(platoon, pIdx, op.planetId, step)"
                        >
                          {{ pIdx + 1 }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-expansion-item>
              </div>
            </q-timeline-entry>
          </q-timeline>
        </div>

        <div v-else class="col column flex-center text-center opacity-70 q-pa-md">
          <q-icon name="search_off" size="60px" color="grey-7" class="q-mb-md" />
          <div class="text-h5 text-grey-5 font-jedi">No Analysis Found</div>
          <div class="text-grey-6 q-mb-lg">
            There is no strategy data available yet.<br />Enter Admin Mode to run a simulation.
          </div>
          <q-btn
            outline
            color="accent"
            label="Enter Admin Mode"
            icon="settings"
            @click="requestAdminAccess"
          />
        </div>
      </div>
    </div>

    <q-dialog v-model="showPlatoonDialog" backdrop-filter="blur(4px)">
      <q-card class="glass-card platoon-dialog">
        <q-card-section class="row items-center q-pb-none bg-dark-transparent border-bottom-light">
          <div class="text-h6 text-accent">
            Operation {{ selectedPlatoon ? selectedPlatoon.index : '' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-4" />
        </q-card-section>

        <q-card-section
          v-if="selectedPlatoon"
          class="q-pa-md custom-scroll"
          style="max-height: 70vh; overflow-y: auto"
        >
          <div class="row justify-between items-center q-mb-lg">
            <q-chip
              :color="getStatusColor(selectedPlatoon.status)"
              text-color="black"
              class="text-bold"
            >
              {{ selectedPlatoon.status }}
            </q-chip>
            <div class="text-white">
              <span class="text-grey-4">Points:</span>
              <span class="text-accent text-weight-bold q-ml-xs"
                >+{{ formatNumber(selectedPlatoon.pointsGained) }}</span
              >
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div v-for="(unit, idx) in dialogUnitList" :key="idx" class="col-4 col-md-3">
              <div class="unit-card relative-position" :class="getUnitCardClass(unit)">
                <div class="row justify-center">
                  <q-avatar size="50px" class="shadow-2">
                    <UnitIcon :unit-name="unit.name" :all-unit-data="allUnitData" />
                  </q-avatar>
                </div>

                <q-badge
                  floating
                  rounded
                  :color="unit.missing === 0 ? 'green' : 'red'"
                  class="shadow-1"
                  style="top: 8px; right: 8px"
                >
                  <q-icon :name="unit.missing === 0 ? 'check' : 'close'" size="10px" />
                </q-badge>

                <div class="unit-name-box">
                  <div
                    class="text-caption text-center text-white ellipsis-2-lines line-height-tight"
                  >
                    {{ unit.name }}
                  </div>
                </div>

                <div class="text-caption text-center text-weight-bold">
                  <span :class="unit.missing > 0 ? 'text-red-4' : 'text-green-4'">
                    {{ unit.filled }}/{{ unit.amount }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="dialogUnitList.length === 0" class="text-center text-grey-5 q-pa-md">
            No unit requirements data available.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/GuildStore'
import { useTBStore } from 'src/stores/TbStore'
import { usePlayerStore } from 'src/stores/PlayerStore'
import UnitIcon from 'components/UnitIcon.vue'

const props = defineProps({
  analysis: { type: Object, default: null },
})

defineEmits(['close'])

const $q = useQuasar()
const guildStore = useGuildStore()
const tbStore = useTBStore()
const playerStore = usePlayerStore()

// --- STATE ---
const totalGuildGP = ref(400000000)
const unusedGP = ref(0)
const password = ref('')
const successRates = ref([1.0, 1.0, 0.95, 0.9, 0.85, 0.8])
const allUnitData = ref([])

// UI Flags
const showLogin = ref(false)
const isAuthenticated = ref(false)
const adminModeActive = ref(false)
const isValidating = ref(false)
const isSimulating = ref(false)
const localResult = ref(null)

// Dialog State
const showPlatoonDialog = ref(false)
const selectedPlatoon = ref(null)

// --- COMPUTED ---
const displayedResult = computed(() => {
  if (adminModeActive.value && localResult.value) {
    return localResult.value
  }
  return props.analysis
})

const effectiveGP = computed(() => {
  const eff = totalGuildGP.value - unusedGP.value
  return eff > 0 ? eff : 0
})

// --- LOGIC ---

function openPlatoonDetails(platoonData, index, planetId, stepData) {
  const planetDef = stepData.activePlanets?.find((p) => p.id === planetId)
  let definition = null

  if (planetDef && planetDef.reconZones) {
    for (const zone of planetDef.reconZones) {
      if (zone.platoonDefinition) {
        const found = zone.platoonDefinition.find((pd) => pd.id === platoonData.id)
        if (found) {
          definition = found
          break
        }
      }
    }
  }

  selectedPlatoon.value = {
    ...platoonData,
    definition: definition,
    index: index + 1,
  }
  showPlatoonDialog.value = true
}

const dialogUnitList = computed(() => {
  if (!selectedPlatoon.value) return []
  const reqs = selectedPlatoon.value.definition?.units || []
  const missingRaw = selectedPlatoon.value.missing || []

  return reqs.map((req) => {
    let missingCount = 0
    const entry = missingRaw.find((m) => {
      const mName = typeof m === 'string' ? m : m.name
      return mName === req.name
    })

    if (entry) {
      if (typeof entry === 'object' && entry.count !== undefined) {
        missingCount = entry.count
      } else {
        missingCount = missingRaw.filter((m) => m === req.name).length
      }
    }

    const filled = Math.max(0, req.amount - missingCount)

    return {
      name: req.name,
      amount: req.amount,
      filled: filled,
      missing: missingCount,
      isComplete: missingCount === 0,
    }
  })
})

function getPlatoonClass(status) {
  if (status === 'FILLED') return 'status-filled'
  if (status === 'PARTIAL') return 'status-partial'
  return 'status-missing'
}

function syncParamsFromAnalysis(data) {
  if (guildStore.getGuildData?.guild?.profile?.guildGalacticPower > 0) {
    totalGuildGP.value = guildStore.getGuildData.guild.profile.guildGalacticPower
  }

  if (data && data.simulationParams) {
    if (data.simulationParams.guildGP) {
      const savedEffective = data.simulationParams.guildGP
      unusedGP.value = Math.max(0, totalGuildGP.value - savedEffective)
    }
    if (data.simulationParams.successRates && Array.isArray(data.simulationParams.successRates)) {
      successRates.value = [...data.simulationParams.successRates]
    }
  } else {
    unusedGP.value = 0
  }
}

function getUnitCardClass(unit) {
  if (unit.missing === 0) return 'unit-card-filled'
  if (unit.filled > 0) return 'unit-card-partial'
  return 'unit-card-missing'
}

onMounted(async () => {
  if (!guildStore.getGuildData?.guild?.profile) {
    await guildStore.loadGuildData()
  }
  if (guildStore.getGuildData?.guild?.profile?.guildGalacticPower) {
    totalGuildGP.value = guildStore.getGuildData.guild.profile.guildGalacticPower
  }

  if (playerStore.names.length === 0) {
    await playerStore.loadAllUnitNames()
  }
  allUnitData.value = playerStore.getUnitNames

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
  $q.notify({ type: 'info', message: 'Exited Admin Mode' })
}

async function triggerSimulation() {
  if (effectiveGP.value <= 0) {
    $q.notify({ type: 'warning', message: 'Effective GP is too low!' })
    return
  }

  isSimulating.value = true
  try {
    const payload = {
      guildGP: effectiveGP.value,
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

function formatNumber(num) {
  if (!num) return '0'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    num,
  )
}
function formatGP(num) {
  return (num / 1000000).toFixed(1) + 'M'
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
function getStatusColor(status) {
  if (status === 'FILLED') return 'green-accent-3'
  if (status === 'PARTIAL') return 'orange'
  return 'red'
}
</script>

<style scoped lang="scss">
/* --- GLOBAL --- */
.strategy-page-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 70vh; /* Begrenzte Höhe für eingebettete Ansicht */
  display: flex;
  overflow-y: hidden; /* Wichtig: Scrollen nur innen */
}

.font-jedi {
  font-family: 'Star Jedi', sans-serif;
  letter-spacing: 1px;
}

/* --- GLASS & COLORS (DUNKEL) --- */
.glass-card {
  background: rgba(15, 15, 20, 0.95);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
  border-radius: 12px;
}

.bg-dark-transparent {
  background: rgba(0, 0, 0, 0.4);
}
.border-bottom-accent {
  border-bottom: 1px solid var(--q-accent);
}
.border-bottom-light {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.border-top-accent {
  border-top: 1px solid var(--q-accent);
}
.border-accent {
  border: 1px solid var(--q-accent);
}
.border-grey {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* --- INPUTS --- */
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label),
.high-contrast-input :deep(.q-icon) {
  color: #ffffff !important;
}

/* --- OVERLAY --- */
.login-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.login-card {
  width: 100%;
  max-width: 350px; /* Responsive Width */
  padding: 30px;
  border: 1px solid var(--q-accent);
}

/* --- LAYOUT & SCROLLING --- */
.strategy-console {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 10px;
  gap: 10px; /* Ersetzt q-mr-md für responsive gap */
}

.config-sidebar {
  width: 320px;
  min-width: 320px;
  display: flex;
}

/* Content Area */
.vis-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  flex: 1; /* Nimm restlichen Platz */
}

.header-bar {
  flex-shrink: 0;
  min-height: 60px;
}

/* TIMELINE AREA - Scrollbar Fix */
.timeline-wrapper {
  flex: 1;
  max-height: 65vh;
  overflow-y: auto; /* Scrollbar hier */
  padding: 20px 40px;
  min-height: 0; /* Flexbox Hack */
  background-color: rgba(0, 0, 0, 0.4); /* Leichter Background für Kontrast */
  border-radius: 12px;
}

/* --- RESPONSIVE BREAKPOINTS --- */
@media (max-width: 850px) {
  .strategy-console {
    flex-direction: column; /* Stapeln auf Mobile */
  }

  .config-sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    max-height: 40vh; /* Sidebar nicht zu groß machen */
    margin-right: 0;
  }

  .vis-content {
    width: 100%;
    height: auto;
    flex: 1;
  }

  .timeline-wrapper {
    padding: 10px; /* Weniger Padding auf Mobile */
  }
}

/* --- CARDS & ELEMENTS --- */
.day-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 15px;
  margin-bottom: 10px;
  transition: transform 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.planet-node {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left-width: 3px;
  border-left-color: #555;
  transition: background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}
.border-left-accent {
  border-left-color: var(--q-accent) !important;
}
.border-left-orange {
  border-left-color: orange !important;
}

.bar-bg {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.bar-fill {
  height: 100%;
  background: var(--q-accent);
  box-shadow: 0 0 8px rgba(180, 90, 240, 0.5);
}

.platoon-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  transition: all 0.2s;
}
.clickable {
  cursor: pointer;
}
.clickable:hover {
  transform: scale(1.1);
  box-shadow: 0 0 5px var(--q-accent);
}

.status-filled {
  background: rgba(0, 200, 83, 0.2);
  border-color: #69f0ae;
  color: #69f0ae;
}
.status-partial {
  background: rgba(255, 152, 0, 0.2);
  border-color: #ffb74d;
  color: #ffb74d;
}
.status-missing {
  background: rgba(211, 47, 47, 0.2);
  border-color: #ff5252;
  color: #ff5252;
}

/* DIALOG */
.platoon-dialog {
  width: 650px;
  max-width: 95vw;
}

.unit-card {
  height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
  padding: 10px;
  &:hover {
    transform: translateY(-2px);
  }
}
.unit-card-filled {
  border-color: #69f0ae;
  background: rgba(0, 200, 83, 0.1);
}
.unit-card-partial {
  border-color: #ffb74d;
  background: rgba(255, 152, 0, 0.1);
}
.unit-card-missing {
  border-color: #ff5252;
  background: rgba(211, 47, 47, 0.1);
}

.unit-name-box {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.line-height-tight {
  line-height: 1.1;
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

/* CUSTOM SCROLLBAR */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--q-accent);
}
</style>
