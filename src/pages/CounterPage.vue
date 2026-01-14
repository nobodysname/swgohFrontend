<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <q-dialog v-model="passwordDialog" transition-show="scale" transition-hide="scale">
        <q-card class="glass-card password-card">
          <div class="text-center q-mb-md">
            <q-icon name="lock" size="xl" color="warning" />
            <div class="text-h6 text-uppercase q-mt-sm text-white">Admin Access</div>
          </div>
          <q-input
            dark
            filled
            v-model="password"
            type="password"
            label="Security Code"
            class="high-contrast-input q-mb-md"
            autofocus
            @keyup.enter="attemptLogin"
          />
          <div class="row justify-end">
            <q-btn flat label="Cancel" color="grey" v-close-popup />
            <q-btn label="Login" color="accent" text-color="black" @click="attemptLogin" />
          </div>
          <div v-if="error" class="error-msg q-mt-md text-center">{{ error }}</div>
        </q-card>
      </q-dialog>

      <div class="main-layout">
        <div
          class="glass-card filter-bar row items-center justify-between q-col-gutter-md q-px-lg q-py-md q-mb-lg"
        >
          <div class="col-12 col-md-4" style="min-width: 300px; margin-top: -10px">
            <q-select
              v-model="selectedOpponent"
              :options="opponentOptions"
              label="Search Opponent Leader..."
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
              hide-bottom-space
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps" class="text-white">
                  <q-item-section avatar>
                    <q-avatar size="30px">
                      <UnitIcon :unit-name="scope.opt" :all-unit-data="allUnitData" round />
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

          <div class="col-12 col-md-4 flex flex-center" style="margin-top: -10px">
            <q-btn-toggle
              v-model="modeFilter"
              toggle-color="accent"
              color="grey-9"
              text-color="grey-4"
              :options="[
                { label: 'All', value: null },
                { label: 'GAC', value: 'GAC' },
                { label: 'TB', value: 'TB' },
              ]"
              unelevated
              rounded
              padding="6px 24px"
            />
          </div>

          <div
            class="col-12 col-md-4 text-right flex items-center justify-end"
            style="margin-top: -10px"
          >
            <template v-if="isAdmin">
              <q-btn
                icon="add"
                label="Add Counter"
                color="accent"
                text-color="black"
                @click="showAddDialog = true"
                class="q-mr-sm"
              />
              <q-btn icon="logout" flat round color="red-4" @click="logout" title="Logout" />
            </template>

            <template v-else>
              <q-btn
                icon="lock"
                label="Admin Login"
                outline
                color="accent"
                @click="passwordDialog = true"
              />
            </template>
          </div>
        </div>

        <div class="counters-grid">
          <div v-if="filteredCounters.length === 0" class="col-12 text-center text-grey-5 q-pa-xl">
            <q-icon name="search_off" size="xl" />
            <div class="text-h6 q-mt-md">No counters found.</div>
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
                    <UnitIcon
                      :unit-name="counter.opponent_leader_id"
                      :all-unit-data="allUnitData"
                    />
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
                    <UnitIcon
                      v-if="name !== 'ANY'"
                      :unit-name="name"
                      :all-unit-data="allUnitData"
                      size="100%"
                    />

                    <q-icon v-else name="help_outline" size="20px" color="grey-6" />
                  </div>
                </div>
              </div>

              <div
                class="notes-box bg-dark-transparent q-pa-sm rounded-borders text-body2 text-grey-3"
              >
                <div class="row no-wrap">
                  <q-icon name="info" color="accent" size="xs" class="q-mr-sm q-mt-xs" />
                  <div>{{ counter.description || 'No specific notes.' }}</div>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <q-dialog v-model="showAddDialog" persistent backdrop-filter="blur(4px)">
        <q-card class="glass-card add-dialog-card">
          <q-card-section>
            <div class="text-h6 text-accent">Create New Counter</div>
          </q-card-section>

          <q-card-section class="q-gutter-md">
            <div class="section-label text-grey-4 text-caption text-uppercase">Opponent</div>
            <q-select
              v-model="newCounter.opponent"
              :options="opponentOptions"
              label="Opponent Leader"
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
                    <q-avatar size="30px">
                      <UnitIcon :unit-name="scope.opt" :all-unit-data="allUnitData" round />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-separator dark spaced />

            <div class="section-label text-grey-4 text-caption text-uppercase">My Team</div>

            <div class="row q-mb-sm">
              <div class="col-12">
                <q-select
                  v-model="newCounter.team[0]"
                  :options="opponentOptions"
                  label="Leader (Required)"
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
                        <q-avatar size="30px">
                          <UnitIcon :unit-name="scope.opt" :all-unit-data="allUnitData" round />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt }}</q-item-label>
                      </q-item-section>
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
                        <q-avatar size="30px">
                          <UnitIcon :unit-name="scope.opt" :all-unit-data="allUnitData" round />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <q-select
                v-model="newCounter.mode"
                :options="['GAC', 'TB', 'BOTH']"
                label="Mode"
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
                label="Info / Strategy"
                dark
                filled
                dense
                rows="2"
                class="high-contrast-input"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md bg-dark-transparent">
            <q-btn flat label="Cancel" color="grey-4" v-close-popup />
            <q-btn
              label="Save"
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
import { api } from 'src/boot/axios'
import UnitIcon from 'components/UnitIcon.vue'

// --- SETUP ---
const store = useCounterStore()
const { isAdmin } = storeToRefs(store)

// Dialog jetzt standardmäßig geschlossen
const passwordDialog = ref(false)
const password = ref('')
const error = ref(null)
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
const allUnitData = ref([])
const allUnits = ref([])
const opponentOptions = ref([])

onMounted(async () => {
  try {
    // 1. Lade Unit Daten (Bilder/Namen)
    const res = await api.get('/unitNames')
    allUnitData.value = res.data
    allUnits.value = res.data.map((unit) => unit.name)
    opponentOptions.value = allUnits.value
    store.setUnits(allUnits.value)

    // 2. Lade Counter Daten (öffentlich, ohne Passwort)
    // Hinweis: Dein Backend sollte Lesezugriff auch ohne PW erlauben.
    await store.fetchCounters(null)
  } catch (e) {
    console.error('Error loading initial data:', e)
  }
})

// --- ACTIONS ---

async function attemptLogin() {
  // Wir nutzen fetchCounters mit PW, um Admin-Status zu prüfen/setzen
  const success = await store.fetchCounters(password.value)
  if (success) {
    // Wenn erfolgreich, ist isAdmin im Store jetzt true
    passwordDialog.value = false
    password.value = ''
    error.value = null
  } else {
    error.value = 'Wrong Password'
  }
}

function logout() {
  store.logout() // Du brauchst eine logout action im Store, die isAdmin = false setzt
  // Fallback falls Action nicht existiert:
  // store.$patch({ isAdmin: false })
}

async function saveCounter() {
  const payload = {
    opponentLeaderId: newCounter.value.opponent,
    counterTeam: newCounter.value.team.map((name) => (name ? name : 'ANY')),
    mode: newCounter.value.mode,
    description: newCounter.value.description,
  }

  // Hier brauchen wir das Passwort nicht zwingend, wenn das Backend
  // session-based ist, aber dein Store nutzt es vermutlich noch:
  // Wir können das PW nutzen, das wir beim Login eingegeben haben
  // (müsste idealerweise im Store gespeichert sein).
  // Für jetzt übergeben wir es einfach nicht, wenn der Store es intern hat
  // oder wir nehmen an, dass der Store den Auth-Header setzt.

  await store.addCounter(payload)
  showAddDialog.value = false

  newCounter.value = {
    opponent: null,
    team: [null, null, null, null, null],
    mode: 'BOTH',
    description: '',
  }
}

async function deleteCounter(id) {
  if (confirm('Really delete counter?')) {
    await store.deleteCounter(id)
  }
}

// --- FILTER & HELPERS ---

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

function getModeColor(mode) {
  if (mode === 'GAC') return 'blue-4'
  if (mode === 'TB') return 'orange-4'
  return 'green-4'
}
</script>

<style scoped lang="scss">
/* (Dein CSS bleibt unverändert, ich habe es hier nur der Vollständigkeit halber gekürzt) */
.page-container {
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(rgba(10, 10, 14, 0.089), rgba(10, 10, 14, 0.781)),
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
.glass-card {
  background: rgba(20, 20, 25, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
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
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label),
.high-contrast-input :deep(.q-select__dropdown-icon) {
  color: #ffffff !important;
}
.border-accent {
  border: 1px solid var(--q-accent);
}
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
.team-display {
  gap: 12px;
}
.unit-slot {
  position: relative;
}
.filter-bar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 24px auto;
  border-radius: 12px;
}
@media (max-width: 800px) {
  .filter-bar {
    justify-content: center !important;
  }
  .filter-bar > div {
    text-align: center;
    justify-content: center !important;
    margin-bottom: 8px;
  }
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
    height: 65px;
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
