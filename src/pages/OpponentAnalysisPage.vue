<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="header-section text-center q-mb-lg">
        <h1 class="text-h4 text-uppercase text-weight-bold glow-text q-my-none">
          <q-icon name="travel_explore" color="accent" class="q-mr-sm" />
          Opponent Analysis
        </h1>
        <div class="text-caption text-grey-4">Comparative Guild Statistics</div>
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
          <q-tab name="overview" icon="dashboard" label="Overview" />
          <q-tab name="characters" icon="groups" label="Character" />
          <q-tab name="datacron" icon="extension" label="Datacron" />
        </q-tabs>
      </div>

      <q-tab-panels v-model="tab" animated class="bg-transparent q-pa-none">
        <q-tab-panel name="overview" class="q-pa-none">
          <div class="glass-card q-pa-lg custom-scroll" style="height: 75vh; overflow-y: auto">
            <h2 class="text-h5 text-accent font-jedi q-mb-md">Power Comparison</h2>

            <div class="bar-container q-mb-xs">
              <div class="bar blue" :style="{ width: totalMinePercent + '%' }"></div>
              <div class="bar red" :style="{ width: totalOppPercent + '%' }"></div>
            </div>

            <div class="row justify-between text-body1 text-weight-bold q-mb-xl">
              <span class="text-blue-4">My Guild: {{ totalMineAverage.toFixed(1) }} Avg</span>
              <span class="text-red-4">Opponent: {{ totalOppAverage.toFixed(1) }} Avg</span>
            </div>

            <h2 class="text-h5 text-accent font-jedi q-mb-md">Key Unit Comparison</h2>

            <div class="unit-grid">
              <div
                v-for="unit in compareUnits"
                :key="unit"
                class="unit-comparison-card bg-dark-transparent q-pa-md rounded-borders"
              >
                <div class="row items-center q-mb-md">
                  <q-avatar size="50px" class="q-mr-md shadow-2">
                    <UnitIcon :unit-name="unit" :all-unit-data="allUnitData" />
                  </q-avatar>
                  <div class="text-h6 text-white">{{ unit }}</div>
                </div>

                <div class="metric-row q-mb-sm">
                  <div class="row justify-between text-caption text-grey-4">
                    <span>Count</span>
                  </div>
                  <div class="bar-container small">
                    <div class="bar blue" :style="{ width: getCountMinePercent(unit) + '%' }"></div>
                    <div class="bar red" :style="{ width: getCountOppPercent(unit) + '%' }"></div>
                  </div>
                  <div class="row justify-between text-weight-bold">
                    <span class="text-blue-4">{{ getMineCount(unit) }}</span>
                    <span class="text-red-4">{{ getOppCount(unit) }}</span>
                  </div>
                </div>

                <div class="metric-row q-mb-sm">
                  <div class="text-caption text-grey-4">Avg. Level</div>
                  <div class="bar-container small">
                    <div class="bar blue" :style="{ width: getAvgMinePercent(unit) + '%' }"></div>
                    <div class="bar red" :style="{ width: getAvgOppPercent(unit) + '%' }"></div>
                  </div>
                  <div class="row justify-between text-weight-bold">
                    <span class="text-blue-4">{{
                      formatTierValueUniversal(getMineAverage(unit), unit)
                    }}</span>
                    <span class="text-red-4">{{
                      formatTierValueUniversal(getOppAverage(unit), unit)
                    }}</span>
                  </div>
                </div>

                <div v-if="!isShipUnit(unit)" class="metric-row">
                  <div class="text-caption text-grey-4">Relic 9 Count</div>
                  <div
                    v-if="isBothZero(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9))"
                    class="bar-container small neutral"
                  ></div>
                  <div v-else class="bar-container small">
                    <div
                      class="bar blue"
                      :style="{
                        width:
                          getRelicPercent(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9)) +
                          '%',
                      }"
                    ></div>
                    <div
                      class="bar red"
                      :style="{
                        width:
                          100 -
                          getRelicPercent(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9)) +
                          '%',
                      }"
                    ></div>
                  </div>
                  <div class="row justify-between text-weight-bold">
                    <span class="text-blue-4">{{ getMineRelicCount(unit, 9) }}</span>
                    <span class="text-red-4">{{ getOppRelicCount(unit, 9) }}</span>
                  </div>
                </div>

                <div
                  v-if="
                    !isShipUnit(unit) &&
                    !isBothZero(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10))
                  "
                  class="metric-row"
                >
                  <div class="text-caption text-grey-4">Relic 10 Count</div>
                  <div class="bar-container small">
                    <div
                      class="bar blue"
                      :style="{
                        width:
                          getRelicPercent(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10)) +
                          '%',
                      }"
                    ></div>
                    <div
                      class="bar red"
                      :style="{
                        width:
                          100 -
                          getRelicPercent(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10)) +
                          '%',
                      }"
                    ></div>
                  </div>
                  <div class="row justify-between text-weight-bold">
                    <span class="text-blue-4">{{ getMineRelicCount(unit, 10) }}</span>
                    <span class="text-red-4">{{ getOppRelicCount(unit, 10) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="characters" class="q-pa-none">
          <div class="glass-card q-pa-md column" style="height: 75vh">
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col">
                <q-input
                  v-model="searchCharacter"
                  filled
                  dense
                  dark
                  placeholder="Search character…"
                  class="high-contrast-input"
                >
                  <template #append><q-icon name="search" color="accent" /></template>
                </q-input>
              </div>
              <div class="col-auto">
                <q-btn
                  color="accent"
                  text-color="white"
                  icon="group_add"
                  label="Squad Builder"
                  class="text-weight-bold"
                  @click="squadDialog = true"
                />
              </div>
            </div>

            <div
              class="col custom-scroll bg-dark-transparent rounded-borders q-pa-sm"
              style="overflow-y: auto"
            >
              <q-list dark separator>
                <q-item
                  v-for="u in filteredCharacterList"
                  :key="u.name"
                  clickable
                  v-ripple
                  @click="openCharacterDetails(u)"
                  class="rounded-borders q-mb-xs hover-bg"
                >
                  <q-item-section avatar>
                    <q-avatar rounded>
                      <UnitIcon :unit-name="u.name" :all-unit-data="allUnitData" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-white text-weight-bold">{{ u.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge color="accent" text-color="white" class="text-weight-bold">
                      {{ u.members.length }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="datacron" class="q-pa-none">
          <div class="glass-card q-pa-xl flex flex-center text-center opacity-70">
            <div class="column items-center">
              <q-icon name="extension_off" size="80px" color="grey-7" class="q-mb-md" />
              <div class="text-h5 text-grey-5 font-jedi">Datacron Intel</div>
              <div class="text-grey-6">Coming soon...</div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <q-dialog v-model="charDetailOpen" backdrop-filter="blur(4px)">
      <q-card class="glass-card char-detail-card column no-wrap" style="max-height: 80vh">
        <q-card-section class="row items-center q-pb-none bg-dark-transparent border-bottom-light">
          <q-avatar size="60px" class="q-mr-md border-accent">
            <UnitIcon
              v-if="selectedUnit"
              :unit-name="selectedUnit.name"
              :all-unit-data="allUnitData"
            />
          </q-avatar>
          <div class="text-h6 text-accent font-jedi">{{ selectedUnit?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-4" />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col">
              <q-select
                v-model="memberRelicFilter"
                filled
                dense
                dark
                :options="relicOptions"
                label="Filter by Relic"
                class="high-contrast-input"
                popup-content-class="bg-dark text-white"
              />
            </div>
            <div class="col-auto flex items-center">
              <q-toggle
                v-model="omicronOnly"
                color="accent"
                label="Omicron Only"
                left-label
                class="text-grey-4"
              />
            </div>
          </div>

          <div class="member-list custom-scroll" style="max-height: 50vh; overflow-y: auto">
            <div
              v-for="m in filteredMembers"
              :key="m.memberName"
              class="member-row row justify-between q-py-sm border-bottom-light"
            >
              <div class="text-white row items-center">
                {{ m.memberName }}
                <q-icon
                  v-if="hasOmicron(m)"
                  name="flare"
                  color="accent"
                  size="xs"
                  class="q-ml-sm"
                />
              </div>
              <div class="text-weight-bold" :class="getTierColorClass(formatTier(m))">
                {{ formatTier(m) }}
              </div>
            </div>
          </div>

          <div class="text-center text-caption text-grey-5 q-mt-sm">
            Showing {{ filteredMembers.length }} / {{ selectedUnit?.members.length }}
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="squadDialog" full-width backdrop-filter="blur(4px)">
      <q-card class="glass-card column no-wrap" style="height: 85vh; max-height: 85vh">
        <q-card-section class="row items-center bg-dark-transparent border-bottom-accent q-py-sm">
          <q-icon name="group_work" color="accent" size="md" class="q-mr-sm" />
          <div class="text-h5 text-accent font-jedi">Squad Builder</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup color="grey-4" />
        </q-card-section>

        <q-card-section class="q-pa-md bg-dark-transparent border-bottom-light">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-select
                v-model="selectedSquad"
                filled
                dark
                use-chips
                multiple
                label="Select Characters (2-5)"
                class="high-contrast-input"
                :options="squadOptions"
                @filter="filterSquadOptions"
                use-input
                max-values="5"
                @update:model-value="handleSquadSelection"
                label-color="accent"
              >
                <template v-slot:prepend><q-icon name="search" /></template>
              </q-select>
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="activeRelicFilter"
                filled
                dark
                label="Min Relic"
                class="high-contrast-input"
                :options="relicOptions"
                emit-value
                map-options
                label-color="accent"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="col q-pa-none relative-position" style="overflow: hidden">
          <div v-if="selectedSquad.length < 2" class="absolute-center text-center text-grey-5">
            <q-icon name="groups" size="60px" class="q-mb-md opacity-50" />
            <div class="text-h6">Select at least 2 characters</div>
            <div class="text-caption">Analyze which members have the full squad ready.</div>
          </div>

          <div v-else class="fit custom-scroll" style="overflow-y: auto">
            <q-markup-table flat dark class="bg-transparent sticky-header-table">
              <thead class="bg-dark-header">
                <tr>
                  <th class="text-left text-accent sticky-col">Member</th>
                  <th v-for="char in selectedSquad" :key="char" class="text-center">
                    <div class="column items-center q-py-sm">
                      <q-avatar size="40px" class="q-mb-xs shadow-2">
                        <UnitIcon :unit-name="char" :all-unit-data="allUnitData" />
                      </q-avatar>
                      <div class="text-caption ellipsis" style="max-width: 100px">{{ char }}</div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in squadMembers" :key="m.name" class="hover-row">
                  <td class="text-left text-weight-bold sticky-col bg-dark-row">{{ m.name }}</td>
                  <td v-for="char in selectedSquad" :key="char" class="text-center">
                    <q-badge
                      :class="getTierColorBadge(formatTierValue(findMemberTier(char, m.name)))"
                      class="text-weight-bold q-px-sm q-py-xs"
                    >
                      {{ formatTierValue(findMemberTier(char, m.name)) }}
                    </q-badge>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </div>
        </q-card-section>

        <q-card-section
          class="row justify-between items-center bg-dark-transparent border-top-light q-py-sm text-caption text-grey-5"
        >
          <div>Showing {{ squadMembers.length }} qualified members</div>
          <div v-if="activeRelicFilter">Filter: Relic {{ activeRelicFilter }}+</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGetGuildsStore } from 'src/stores/GetGuildStore'
import { usePlayerStore } from 'src/stores/PlayerStore'
import { useQuasar } from 'quasar'
import UnitIcon from 'components/UnitIcon.vue'

const route = useRoute()
const playerStore = usePlayerStore()
const getGuildStore = useGetGuildsStore()
const $q = useQuasar()

const tab = ref('overview')
const allUnitData = ref([])

const compareUnits = [
  'Supreme Leader Kylo Ren',
  'Jedi Master Luke Skywalker',
  'Rey',
  'Sith Eternal Emperor',
  'Jedi Master Kenobi',
  'Lord Vader',
  'Jabba the Hutt',
  'Leia Organa',
  'Executor',
  'Profundity',
  'Leviathan',
  'Ahsoka Tano',
  'Third Sister',
]

// --- SQUAD FILTER FIX ---
// Wir speichern hier nur den Zahlenwert (value), da q-select mit emit-value arbeitet
const activeRelicFilter = ref(null)
const omicronOnly = ref(false)

const myUnits = ref([])
const oppUnits = ref([])

// DATA LOADING
async function loadData() {
  $q.loading.show()

  if (playerStore.names.length === 0) {
    await playerStore.loadAllUnitNames()
  }
  allUnitData.value = playerStore.getUnitNames

  await playerStore.loadAllUnits()
  myUnits.value = playerStore.getUnitData

  if (route.params.id) {
    await getGuildStore.loadGuildData(route.params.id)
    oppUnits.value = getGuildStore.getGuildData
  }

  $q.loading.hide()
}

// --- HELPER FUNCTIONS ---
function isShipUnit(unitName) {
  const unit = unitByName(myUnits.value, unitName) || unitByName(oppUnits.value, unitName)
  const firstMember = unit?.members?.[0]
  return firstMember?.unitPrefab?.toLowerCase().includes('ship')
}

// Farben für Text (Overview)
function getTierColorClass(tierStr) {
  if (!tierStr) return 'text-grey-7'
  if (tierStr.startsWith('R9')) return 'text-red-5'
  if (tierStr.startsWith('R8')) return 'text-red-4'
  if (tierStr.startsWith('R7')) return 'text-orange-4'
  if (tierStr.startsWith('R')) return 'text-white'
  return 'text-blue-3'
}

// Farben für Badges (Squad Builder)
function getTierColorBadge(tierStr) {
  if (!tierStr) return 'bg-grey-9 text-grey-5'
  if (tierStr.startsWith('R9')) return 'bg-red-9 text-white'
  if (tierStr.startsWith('R8')) return 'bg-red-8 text-white'
  if (tierStr.startsWith('R7')) return 'bg-orange-9 text-white'
  if (tierStr.startsWith('R5')) return 'bg-orange-8 text-white'
  if (tierStr.startsWith('R')) return 'bg-grey-8 text-white' // Low Relic
  return 'bg-blue-9 text-white' // Gear
}

function getRelicLevel(member) {
  if (!member) return 0
  if (member.currentTier < 13) return 0
  return (member.relic?.currentTier ?? 2) - 2
}
function unitByName(arr, name) {
  return arr.find((u) => u.name === name)
}
function getRelicCount(units, unitName, relicLevel) {
  return units
    .filter((u) => u.name === unitName)
    .flatMap((u) => u.members)
    .filter((m) => (m.relic?.currentTier ?? 0) - 2 === relicLevel).length
}
function getMineRelicCount(unit, relicLevel) {
  return getRelicCount(myUnits.value, unit, relicLevel)
}
function getOppRelicCount(unit, relicLevel) {
  return getRelicCount(oppUnits.value, unit, relicLevel)
}
function isBothZero(mine, opp) {
  return mine === 0 && opp === 0
}
function getRelicPercent(mine, opp) {
  const total = mine + opp
  if (total === 0) return 0
  return (mine / total) * 100
}
function average(list) {
  if (!list || list.length === 0) return 0
  return list.reduce((acc, m) => acc + getMemberTierValue(m), 0) / list.length
}
function getMemberTierValue(member) {
  const isShip = member.unitPrefab?.toLowerCase().includes('ship')
  if (isShip) return member.currentRarity || 0
  if (member.currentTier < 13) return member.currentTier
  return 13 + ((member.relic?.currentTier || 2) - 2)
}
function hasOmicron(member) {
  return Array.isArray(member.skill) && member.skill.some((s) => s.isOmicron === true)
}

const getMineCount = (unit) => unitByName(myUnits.value, unit)?.members.length || 0
const getOppCount = (unit) => unitByName(oppUnits.value, unit)?.members.length || 0
const getMineAverage = (unit) => average(unitByName(myUnits.value, unit)?.members || [])
const getOppAverage = (unit) => average(unitByName(oppUnits.value, unit)?.members || [])

const percent = (mine, opp) => {
  const total = mine + opp
  if (total === 0) return [50, 50]
  const mineP = (mine / total) * 100
  return [mineP, 100 - mineP]
}
const getCountMinePercent = (unit) => percent(getMineCount(unit), getOppCount(unit))[0]
const getCountOppPercent = (unit) => percent(getMineCount(unit), getOppCount(unit))[1]
const getAvgMinePercent = (unit) => percent(getMineAverage(unit), getOppAverage(unit))[0]
const getAvgOppPercent = (unit) => percent(getMineAverage(unit), getOppAverage(unit))[1]

const totalMineAverage = computed(() => average(myUnits.value.flatMap((u) => u.members)))
const totalOppAverage = computed(() => average(oppUnits.value.flatMap((u) => u.members)))
const totalMinePercent = computed(() => percent(totalMineAverage.value, totalOppAverage.value)[0])
const totalOppPercent = computed(() => percent(totalMineAverage.value, totalOppAverage.value)[1])

function formatTierValueUniversal(avgValue, unitName) {
  const unit = unitByName(myUnits.value, unitName) || unitByName(oppUnits.value, unitName)
  if (!unit) return avgValue.toFixed(1)
  const firstMember = unit.members[0]
  const isShip = firstMember?.unitPrefab?.toLowerCase().includes('ship')
  if (isShip) return `⭐${avgValue.toFixed(1)}`
  if (avgValue <= 13) return `G${avgValue.toFixed(1)}`
  return `R${(avgValue - 12).toFixed(1)}`
}

function tierValue(member) {
  if (!member) return 0
  if (member.currentTier < 13) return member.currentTier
  const relicTier = member.relic?.currentTier ?? 2
  return 13 + (relicTier - 2)
}

function formatTier(member) {
  if (!member) return ''
  const isShip = member.unitPrefab?.toLowerCase().includes('ship')
  if (isShip) return `⭐${member.currentRarity}`
  if (member.currentTier < 13) return `G${member.currentTier}`
  const relicTier = member.relic?.currentTier ?? 2
  return `R${relicTier - 2}`
}

/* --- CHARACTERS TAB LOGIC --- */
const searchCharacter = ref('')
const memberRelicFilter = ref(null)
const charDetailOpen = ref(false)
const squadDialog = ref(false)
const selectedUnit = ref(null)

const relicOptions = [
  { label: 'No filter', value: null },
  { label: 'Relic ≥ 1', value: 1 },
  { label: 'Relic ≥ 3', value: 3 },
  { label: 'Relic ≥ 5', value: 5 },
  { label: 'Relic ≥ 7', value: 7 },
  { label: 'Relic ≥ 9', value: 9 },
]

const filteredCharacterList = computed(() => {
  const needle = searchCharacter.value.toLowerCase()
  return [...oppUnits.value]
    .filter((u) => u.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
})

const baseSquadOptions = computed(() =>
  oppUnits.value
    .filter((u) => !u.members[0]?.unitPrefab?.toLowerCase().includes('ship'))
    .map((u) => u.name)
    .sort((a, b) => a.localeCompare(b)),
)
const squadOptions = ref([])
watch(
  baseSquadOptions,
  (val) => {
    squadOptions.value = val
  },
  { immediate: true },
)

function filterSquadOptions(val, update) {
  const needle = val.toLowerCase()
  update(() => {
    if (!needle) squadOptions.value = baseSquadOptions.value
    else
      squadOptions.value = baseSquadOptions.value.filter((name) =>
        name.toLowerCase().includes(needle),
      )
  })
}

function openCharacterDetails(unit) {
  selectedUnit.value = unit
  memberRelicFilter.value = null
  charDetailOpen.value = true
}

const filteredMembers = computed(() => {
  if (!selectedUnit.value) return []
  let members = [...selectedUnit.value.members]
  if (memberRelicFilter.value !== null) {
    members = members.filter((m) => getRelicLevel(m) >= memberRelicFilter.value.value)
  }
  if (omicronOnly.value) {
    members = members.filter(
      (m) => Array.isArray(m.skill) && m.skill.some((s) => s.isOmicron === true),
    )
  }
  return members.sort(sortMembers)
})

function getGearLevel(member) {
  if (!member) return 0
  return Math.min(member.currentTier, 13)
}

function sortMembers(a, b) {
  const relicA = getRelicLevel(a)
  const relicB = getRelicLevel(b)
  if (relicA !== relicB) return relicB - relicA
  const gearA = getGearLevel(a)
  const gearB = getGearLevel(b)
  if (gearA !== gearB) return gearB - gearA
  return a.memberName.localeCompare(b.memberName)
}

/* --- SQUAD BUILDER LOGIC (Fixed) --- */
const selectedSquad = ref([])
function handleSquadSelection(val) {
  if (val.length > 5) val.splice(5)
  selectedSquad.value = [...val]
}

const squadMembers = computed(() => {
  if (selectedSquad.value.length < 2) return []
  const result = []

  // FIX: activeRelicFilter ist hier direkt der Wert (wegen emit-value), oder null
  const relicThreshold = activeRelicFilter.value

  const allMemberNames = new Set(oppUnits.value.flatMap((u) => u.members.map((m) => m.memberName)))

  for (const memberName of allMemberNames) {
    let valid = true
    const row = { name: memberName }

    // Check alle Units im Squad
    for (const charName of selectedSquad.value) {
      const unit = oppUnits.value.find((u) => u.name === charName)
      const member = unit?.members.find((m) => m.memberName === memberName)

      // 1. Hat der Member die Unit überhaupt?
      if (!member) {
        valid = false
        break
      }

      // 2. Relic Filter Check
      if (relicThreshold !== null) {
        if (getRelicLevel(member) < relicThreshold) {
          valid = false
          break
        }
      }

      row[charName] = tierValue(member)
    }

    if (valid) {
      result.push(row)
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name))
})

function findMemberTier(unitName, memberName) {
  const unit = oppUnits.value.find((u) => u.name === unitName)
  if (!unit) return 0
  const m = unit.members.find((x) => x.memberName === memberName)
  return m ? tierValue(m) : 0
}

function formatTierValue(value) {
  if (!value || value === 0) return ''
  if (value <= 13) return `G${value}`
  return `R${value - 13}`
}

onMounted(loadData)
</script>

<style scoped lang="scss">
/* --- GLOBAL --- */
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
.font-jedi {
  font-family: 'Star Jedi', sans-serif;
  letter-spacing: 1px;
}

/* --- GLASS LOOK --- */
.glass-card {
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  max-height: 70vh;
}

.bg-dark-transparent {
  background: rgba(0, 0, 0, 0.3);
}
.border-bottom-light {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.border-top-light {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.border-bottom-accent {
  border-bottom: 1px solid var(--q-accent);
}
.border-accent {
  border: 2px solid var(--q-accent);
}

/* --- NAVIGATION --- */
.filter-bar {
  width: 100%;
  max-width: 800px;
  margin: 0 auto 24px auto;
  border-radius: 50px;
  overflow: hidden;
}

/* --- OVERVIEW TAB --- */
.unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.unit-comparison-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-3px);
    border-color: var(--q-accent);
  }
}

.bar-container {
  width: 100%;
  height: 24px;
  display: flex;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
}
.bar-container.small {
  height: 8px;
  border-radius: 4px;
}
.bar-container.neutral {
  background: rgba(255, 255, 255, 0.1);
}

.bar.blue {
  background: linear-gradient(to right, #448aff, #82b1ff);
}
.bar.red {
  background: linear-gradient(to right, #ff5252, #ff8a80);
}

.text-blue-4 {
  color: #82b1ff;
}
.text-red-4 {
  color: #ff8a80;
}

/* --- CHARACTER LIST --- */
.hover-bg:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* --- SCROLLBAR --- */
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

/* --- INPUTS --- */
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label) {
  color: #ffffff !important;
}

/* --- DIALOGS & TABLES --- */
.char-detail-card {
  width: 600px;
  max-width: 95vw;
}

.bg-dark-header {
  background: rgba(10, 10, 15, 0.95);
}
.bg-dark-row {
  background: rgba(20, 20, 25, 0.9);
} /* Sticky Col Background */

.sticky-header-table thead tr th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(10, 10, 15, 1);
}

/* Sticky First Column for Squad Table */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.hover-row:hover td {
  background: rgba(255, 255, 255, 0.05);
}
.opacity-50 {
  opacity: 0.5;
}

/* --- SCROLLBAR --- */
.custom-scroll {
  /* Firefox Standard */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
}

/* Chrome / Edge / Safari */
.custom-scroll::-webkit-scrollbar {
  width: 8px; /* Etwas breiter für bessere Bedienbarkeit */
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1); /* Kleiner Rand für "Schwebe"-Effekt */
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--q-accent);
}
</style>
