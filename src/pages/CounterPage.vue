<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="header-section text-center q-mb-lg">
        <h1 class="text-h4 text-uppercase text-weight-bold glow-text q-my-none">
          <q-icon name="psychology" color="accent" class="q-mr-sm" />
          Counter Intelligence
        </h1>
        <div class="text-caption text-grey-4">Tactical Team Recommendations</div>
      </div>

      <q-dialog v-model="passwordDialog" persistent transition-show="scale" transition-hide="scale">
        <q-card class="glass-card password-card">
          <div class="text-center q-mb-md">
            <q-icon name="lock" size="xl" color="warning" />
            <div class="text-h6 text-uppercase q-mt-sm text-white">Access Database</div>
          </div>
          <q-input
            dark
            filled
            v-model="password"
            type="password"
            label="Security Code"
            class="high-contrast-input q-mb-md"
            autofocus
            @keyup.enter="unlock"
          />
          <div class="row justify-end">
            <q-btn label="Unlock" color="accent" text-color="black" @click="unlock" />
          </div>
          <div v-if="error" class="error-msg q-mt-md text-center">{{ error }}</div>
        </q-card>
      </q-dialog>

      <div v-if="unlocked" class="main-layout">
        <div class="glass-card filter-bar q-mb-md row items-center q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedOpponent"
              :options="opponentOptions"
              label="Gegner Leader suchen..."
              dark
              filled
              dense
              option-label="name"
              use-input
              input-debounce="0"
              @filter="filterUnits"
              class="high-contrast-input"
              popup-content-class="dark-dropdown"
              clearable
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" class="text-white">
                  <q-item-section avatar>
                    <q-avatar size="30px">
                      <img :src="getUnitImage(scope.opt)" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:prepend>
                <q-icon name="swords" color="red-4" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-4 text-center">
            <q-btn-toggle
              v-model="modeFilter"
              toggle-color="accent"
              color="grey-9"
              text-color="grey-4"
              :options="[
                { label: 'Alle', value: null },
                { label: 'GAC', value: 'GAC' },
                { label: 'TB', value: 'TB' },
              ]"
              unelevated
              rounded
              padding="6px 16px"
            />
          </div>

          <div class="col-12 col-md-4 text-right">
            <q-btn
              v-if="isAdmin"
              icon="add"
              label="Counter hinzufügen"
              color="accent"
              text-color="black"
              @click="showAddDialog = true"
            />
          </div>
        </div>

        <div class="counters-grid">
          <div v-if="filteredCounters.length === 0" class="col-12 text-center text-grey-5 q-pa-xl">
            <q-icon name="search_off" size="xl" />
            <div class="text-h6 q-mt-md">Keine Counter gefunden.</div>
          </div>

          <transition-group name="list-anim">
            <div
              v-for="counter in filteredCounters"
              :key="counter.id"
              class="glass-card counter-card q-pa-md"
            >
              <div class="counter-header q-mb-md">
                <div class="opponent-info">
                  <span class="text-caption text-red-4 text-uppercase text-weight-bold q-mr-sm"
                    >VS</span
                  >
                  <q-avatar size="42px" class="shadow-2 border-red">
                    <img :src="getUnitImage(counter.opponent_leader_id)" />
                  </q-avatar>
                  <span class="text-h6 text-white q-ml-sm">{{ counter.opponent_leader_id }}</span>
                </div>

                <div class="meta-info">
                  <q-badge
                    :color="getModeColor(counter.game_mode)"
                    text-color="black"
                    class="text-weight-bold q-mr-sm"
                  >
                    {{ counter.game_mode }}
                  </q-badge>
                  <q-btn
                    v-if="isAdmin"
                    icon="delete"
                    size="sm"
                    flat
                    color="red"
                    round
                    @click="deleteCounter(counter.id)"
                  />
                </div>
              </div>

              <q-separator dark class="q-mb-md" />

              <div class="team-label text-caption text-accent text-uppercase text-center q-mb-sm">
                Recommended Squad
              </div>
              <div class="team-display row justify-center q-mb-md">
                <div
                  v-for="(name, idx) in [
                    counter.counter_leader_id,
                    counter.unit_2_id,
                    counter.unit_3_id,
                    counter.unit_4_id,
                    counter.unit_5_id,
                  ]"
                  :key="idx"
                  class="unit-slot column items-center"
                >
                  <div
                    class="unit-circle"
                    :class="{ 'is-leader': idx === 0, 'is-any': name === 'ANY' }"
                  >
                    <q-img
                      v-if="name !== 'ANY'"
                      :src="getUnitImage(name)"
                      class="unit-image"
                      fit="cover"
                    >
                      <template v-slot:loading>
                        <q-spinner color="accent" size="20px" />
                      </template>

                      <template v-slot:error>
                        <div class="absolute-full flex flex-center bg-dark text-white">
                          <q-icon name="broken_image" size="20px" color="red" />
                        </div>
                      </template>
                    </q-img>

                    <q-icon v-else name="help_outline" size="20px" color="grey-6" />
                  </div>
                </div>
              </div>

              <div
                class="notes-box bg-dark-transparent q-pa-sm rounded-borders text-body2 text-grey-3"
              >
                <div class="row no-wrap">
                  <q-icon name="info" color="accent" size="xs" class="q-mr-sm q-mt-xs" />
                  <div>{{ counter.description || 'Keine spezifischen Anmerkungen.' }}</div>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <q-dialog v-model="showAddDialog" persistent backdrop-filter="blur(4px)">
        <q-card class="glass-card add-dialog-card">
          <q-card-section>
            <div class="text-h6 text-accent">Neuen Counter erstellen</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <div class="section-label text-grey-4 text-caption text-uppercase">Gegner</div>
            <q-select
              v-model="newCounter.opponent"
              :options="opponentOptions"
              label="Gegner Leader"
              dark
              filled
              dense
              use-input
              @filter="filterUnits"
              class="high-contrast-input"
              popup-content-class="dark-dropdown"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" class="text-white">
                  <q-item-section avatar>
                    <q-avatar><img :src="getUnitImage(scope.opt)" /></q-avatar>
                  </q-item-section>
                  <q-item-section>{{ scope.opt }}</q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-separator dark spaced />

            <div class="section-label text-grey-4 text-caption text-uppercase">Mein Team</div>

            <div class="row q-mb-sm">
              <div class="col-12">
                <q-select
                  v-model="newCounter.team[0]"
                  :options="opponentOptions"
                  label="Leader (Pflicht)"
                  dark
                  filled
                  dense
                  use-input
                  @filter="filterUnits"
                  class="high-contrast-input border-accent"
                  popup-content-class="dark-dropdown"
                >
                  <template v-slot:prepend><q-icon name="stars" color="yellow" /></template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" class="text-white">
                      <q-item-section avatar>
                        <q-avatar><img :src="getUnitImage(scope.opt)" /></q-avatar>
                      </q-item-section>
                      <q-item-section>{{ scope.opt }}</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div v-for="i in 4" :key="i" class="col-6">
                <q-select
                  v-model="newCounter.team[i]"
                  :options="opponentOptions"
                  :label="`Unit ${i + 1}`"
                  dark
                  filled
                  dense
                  use-input
                  clearable
                  @filter="filterUnits"
                  class="high-contrast-input"
                  popup-content-class="dark-dropdown"
                  placeholder="Any"
                >
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps" class="text-white">
                      <q-item-section avatar>
                        <q-avatar><img :src="getUnitImage(scope.opt)" /></q-avatar>
                      </q-item-section>
                      <q-item-section>{{ scope.opt }}</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <q-select
                v-model="newCounter.mode"
                :options="['GAC', 'TB', 'BOTH']"
                label="Modus"
                dark
                filled
                dense
                class="high-contrast-input"
                popup-content-class="dark-dropdown"
              />
            </div>
            <div class="col-12 col-md-7">
              <q-input
                v-model="newCounter.description"
                type="textarea"
                label="Infos / Strategie"
                dark
                filled
                dense
                rows="2"
                class="high-contrast-input"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md bg-dark-transparent">
            <q-btn flat label="Abbrechen" color="grey-4" v-close-popup />
            <q-btn
              label="Speichern"
              color="accent"
              text-color="black"
              @click="saveCounter"
              :disable="!isFormValid"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCounterStore } from 'src/stores/CounterStore'
import { storeToRefs } from 'pinia'
import { api } from 'src/boot/axios' // WICHTIG: API importieren

const isDev = process.env.NODE_ENV === 'development'

const baseURL = isDev
  ? 'http://localhost:3000' // Development
  : 'https://ginwalkers.de:3000' // Production

// --- SETUP ---
const store = useCounterStore()
const { isAdmin } = storeToRefs(store)

const passwordDialog = ref(true)
const password = ref('')
const error = ref(null)
const unlocked = ref(false)
const showAddDialog = ref(false)

// State für Filter
const selectedOpponent = ref(null)
const modeFilter = ref(null)

// State für neuen Counter
const newCounter = ref({
  opponent: null,
  team: [null, null, null, null, null],
  mode: 'BOTH',
  description: '',
})

// --- UNIT DATEN ---
// Speichert die VOLLEN Objekte { name, thumbnailName } aus dem Backend
const allUnitData = ref([])
// Speichert nur die Namen ["Rex", "Cody"] für die Dropdowns
const allUnits = ref([])

// Optionen für das Dropdown (wird beim Tippen gefiltert)
const opponentOptions = ref([])

onMounted(async () => {
  try {
    // 1. Lade die Daten direkt von deiner neuen Backend-Route
    const res = await api.get('/unitNames')
    // Erwartetes Format: [{ name: "...", thumbnailName: "..." }, ...]

    // 2. Speichere die Rohdaten für den Bilder-Lookup
    allUnitData.value = res.data

    // 3. Extrahiere NUR die Namen für die Dropdowns (Array of Strings)
    allUnits.value = res.data.map((unit) => unit.name)

    // 4. Initialisiere die Optionen
    opponentOptions.value = allUnits.value

    // Optional: Falls der Store die Namen auch braucht
    store.setUnits(allUnits.value)
  } catch (e) {
    console.error('Fehler beim Laden der Unit-Namen:', e)
  }
})

// --- ACTIONS ---

async function unlock() {
  const success = await store.fetchCounters(password.value)
  if (success) {
    unlocked.value = true
    passwordDialog.value = false
  } else {
    error.value = 'Falsches Passwort'
  }
}

async function saveCounter() {
  const payload = {
    opponentLeaderId: newCounter.value.opponent,
    counterTeam: newCounter.value.team.map((name) => (name ? name : 'ANY')),
    mode: newCounter.value.mode,
    description: newCounter.value.description,
  }

  await store.addCounter(payload, password.value)
  showAddDialog.value = false
  // Reset Form
  newCounter.value = {
    opponent: null,
    team: [null, null, null, null, null],
    mode: 'BOTH',
    description: '',
  }
}

async function deleteCounter(id) {
  if (confirm('Counter wirklich löschen?')) {
    await store.deleteCounter(id, password.value)
  }
}

// --- FILTER & HELPERS ---

// Filterfunktion für q-select (arbeitet jetzt korrekt mit Strings)
function filterUnits(val, update) {
  if (val === '') {
    update(() => {
      opponentOptions.value = allUnits.value
    })
    return
  }
  update(() => {
    const needle = val.toLowerCase()
    opponentOptions.value = allUnits.value.filter((v) => v.toLowerCase().indexOf(needle) > -1)
  })
}

const filteredCounters = computed(() => {
  return store.getFilteredCounters(selectedOpponent.value, modeFilter.value)
})

const isFormValid = computed(() => {
  return newCounter.value.opponent && newCounter.value.team[0]
})

// BILD-LOGIK WURDE ANGEPASST
function getUnitImage(name) {
  if (!name || name === 'ANY') return ''

  const unitObj = allUnitData.value.find((u) => u.name === name)

  if (unitObj && unitObj.thumbnailName) {
    const assetName = unitObj.thumbnailName.replace(/^tex\./, '')

    // Das q-img ruft diese URL auf.
    // Dein Backend empfängt den Request und streamt das Bild zurück.
    return `${baseURL}/icons/${assetName}`
  }

  // Wenn wir hier 'null' oder '' zurückgeben, triggert q-img den error-slot
  return ''
}

function getModeColor(mode) {
  if (mode === 'GAC') return 'blue-4'
  if (mode === 'TB') return 'orange-4'
  return 'green-4'
}
</script>

<style scoped lang="scss">
/* --- GLOBAL --- */
.page-container {
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(rgba(10, 10, 14, 0.4), rgba(10, 10, 14, 0.9)),
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

/* --- GLASS CARDS --- */
.glass-card {
  background: rgba(25, 25, 30, 0.95); /* Dunklerer Hintergrund für Kontrast */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.password-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border: 1px solid var(--q-warning);
}
.add-dialog-card {
  width: 600px;
  max-width: 95vw;
  background: #1a1a1e;
  border: 1px solid var(--q-accent);
}
.error-msg {
  color: #ff6b6b;
  font-weight: bold;
  background: rgba(255, 0, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
}

/* --- INPUTS & DROPDOWNS --- */
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
/* Erzwingt weiße Schrift in Inputs */
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label),
.high-contrast-input :deep(.q-select__dropdown-icon) {
  color: #ffffff !important;
}

/* Spezialklasse für Leader Input */
.border-accent {
  border: 1px solid var(--q-accent);
}

/* --- COUNTERS LAYOUT --- */
.counters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.counter-card {
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-3px);
    border-color: var(--q-accent);
  }
}

.counter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.opponent-info {
  display: flex;
  align-items: center;
}

.meta-info {
  display: flex;
  align-items: center;
}

.bg-dark-transparent {
  background: rgba(0, 0, 0, 0.3);
}

/* --- TEAM DISPLAY --- */
.team-display {
  gap: 12px;
}

.unit-slot {
  position: relative;
}

.unit-circle {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: rgba(40, 40, 40, 0.8);
  border: 2px solid #555;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.is-leader {
    border-color: var(--q-warning);
    width: 65px;
    height: 65px; /* Leader etwas größer */
    box-shadow: 0 0 10px rgba(255, 232, 31, 0.4);
  }
  &.is-any {
    border-style: dashed;
    opacity: 0.7;
  }
}

.border-red {
  border: 2px solid #ef5350;
}

/* --- ANIMATIONS --- */
.list-anim-move,
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.4s ease;
}
.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.list-anim-leave-active {
  position: absolute;
}
</style>

<style lang="scss">
/* Damit das Dropdown Menü dunkel ist */
.dark-dropdown {
  background: #1e1e24 !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
/* Hover Effekt im Dropdown */
.dark-dropdown .q-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
/* Selected Item */
.dark-dropdown .q-item--active {
  background: rgba(79, 195, 247, 0.2);
  color: var(--q-accent);
}
</style>
