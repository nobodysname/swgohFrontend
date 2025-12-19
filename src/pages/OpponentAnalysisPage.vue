<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <h1 class="title">Opponent Analysis</h1>

      <div class="analysis-header">
        <q-tabs
          v-model="tab"
          dense
          class="analysis-tabs"
          active-color="yellow"
          indicator-color="yellow"
        >
          <q-tab name="overview" label="Overview" />
          <q-tab name="characters" label="Character" />
          <q-tab name="datacron" label="Datacron" />
        </q-tabs>
      </div>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- ÜBERSICHT -->
        <q-tab-panel name="overview">
          <div class="comparison-section">
            <h2 class="subtitle">Overview</h2>

            <div class="bar-container">
              <div class="bar blue" :style="{ width: totalMinePercent + '%' }"></div>
              <div class="bar red" :style="{ width: totalOppPercent + '%' }"></div>
            </div>

            <p class="bar-label">
              Gesamtstärke:
              <span class="blue-text">{{ totalMineAverage.toFixed(1) }}</span> vs
              <span class="red-text">{{ totalOppAverage.toFixed(1) }}</span>
            </p>

            <h2 class="subtitle mt-4">Charakter Comparison</h2>

            <div v-for="unit in compareUnits" :key="unit" class="unit-row">
              <h3 class="unit-title">{{ unit }}</h3>

              <!-- ANZAHL -->
              <div class="metric-label">Count</div>
              <div class="bar-container">
                <div class="bar blue" :style="{ width: getCountMinePercent(unit) + '%' }"></div>
                <div class="bar red" :style="{ width: getCountOppPercent(unit) + '%' }"></div>
              </div>
              <div class="metric-values">
                <span class="blue-text">{{ getMineCount(unit) }}</span>
                <span class="red-text">{{ getOppCount(unit) }}</span>
              </div>

              <!-- STUFE -->
              <div class="metric-label">Average Level</div>
              <div class="bar-container">
                <div class="bar blue" :style="{ width: getAvgMinePercent(unit) + '%' }"></div>
                <div class="bar red" :style="{ width: getAvgOppPercent(unit) + '%' }"></div>
              </div>
              <div class="metric-values">
                <span class="blue-text">
                  {{ formatTierValueUniversal(getMineAverage(unit), unit) }}
                </span>

                <span class="red-text">
                  {{ formatTierValueUniversal(getOppAverage(unit), unit) }}
                </span>
              </div>

              <!-- RELIC 9 -->
              <div v-if="!isShipUnit(unit)" class="metric-label">Relic 9 Count</div>
              <div v-if="!isShipUnit(unit)" class="bar-container">
                <!-- FALL: beide 0 → grauer Balken -->
                <div
                  v-if="isBothZero(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9))"
                  class="bar neutral"
                  style="width: 100%"
                />

                <!-- NORMALFALL -->
                <template v-else>
                  <div
                    class="bar blue"
                    :style="{
                      width:
                        getRelicPercent(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9)) +
                        '%',
                    }"
                  />
                  <div
                    class="bar red"
                    :style="{
                      width:
                        100 -
                        getRelicPercent(getMineRelicCount(unit, 9), getOppRelicCount(unit, 9)) +
                        '%',
                    }"
                  />
                </template>
              </div>

              <div v-if="!isShipUnit(unit)" class="metric-values">
                <span class="blue-text">{{ getMineRelicCount(unit, 9) }}</span>
                <span class="red-text">{{ getOppRelicCount(unit, 9) }}</span>
              </div>

              <!-- RELIC 10 -->
              <div v-if="!isShipUnit(unit)" class="metric-label">Relic 10 Count</div>
              <div v-if="!isShipUnit(unit)" class="bar-container">
                <!-- FALL: beide 0 → grauer Balken -->
                <div
                  v-if="isBothZero(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10))"
                  class="bar neutral"
                  style="width: 100%"
                />

                <!-- NORMALFALL -->
                <template v-else>
                  <div
                    class="bar blue"
                    :style="{
                      width:
                        getRelicPercent(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10)) +
                        '%',
                    }"
                  />
                  <div
                    class="bar red"
                    :style="{
                      width:
                        100 -
                        getRelicPercent(getMineRelicCount(unit, 10), getOppRelicCount(unit, 10)) +
                        '%',
                    }"
                  />
                </template>
              </div>

              <div v-if="!isShipUnit(unit)" class="metric-values">
                <span class="blue-text">{{ getMineRelicCount(unit, 10) }}</span>
                <span class="red-text">{{ getOppRelicCount(unit, 10) }}</span>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="characters">
          <div class="char-page">
            <!-- HEADER SEARCH + FILTER + SQUAD BUILDER BUTTON -->
            <div class="char-header">
              <q-input
                v-model="searchCharacter"
                filled
                dense
                dark
                placeholder="Search character…"
                class="char-search"
                input-class="text-white"
              >
                <template #append><q-icon name="search" /></template>
              </q-input>

              <q-btn
                color="yellow"
                class="char-squad-btn"
                flat
                dark
                label="Squad Builder"
                @click="squadDialog = true"
              />
            </div>

            <!-- CHARACTER LIST -->
            <div class="character-list">
              <div
                v-for="u in filteredCharacterList"
                :key="u.name"
                class="character-row"
                @click="openCharacterDetails(u)"
              >
                <span class="char-name">{{ u.name }}</span>
                <span class="count">{{ u.members.length }}</span>
              </div>
            </div>

            <!-- CHARACTER DETAIL MODAL -->
            <q-dialog v-model="charDetailOpen">
              <q-card class="char-detail-card">
                <h2 class="dialog-title">{{ selectedUnit?.name }}</h2>

                <q-select
                  v-model="memberRelicFilter"
                  filled
                  dense
                  dark
                  :options="relicOptions"
                  label="Filter by Relic"
                  class="mb-3"
                />

                <q-toggle
                  v-model="omicronOnly"
                  color="grey"
                  label="Only Omicron"
                  style="color: white"
                />

                <div class="member-list">
                  <div v-for="m in filteredMembers" :key="m.memberName" class="member-row">
                    <span style="color: white"
                      >{{ m.memberName }}
                      <q-icon
                        v-if="hasOmicron(m)"
                        name="flare"
                        color="yellow"
                        size="16px"
                        class="q-ml-xs"
                    /></span>

                    <span style="color: white">{{ formatTier(m) }}</span>
                  </div>
                </div>

                <div class="member-count">
                  Showing {{ filteredMembers.length }} / {{ selectedUnit?.members.length }}
                </div>

                <q-btn flat dark label="Close" class="q-mt-md" @click="charDetailOpen = false" />
              </q-card>
            </q-dialog>

            <!-- SQUAD BUILDER MODAL -->
            <q-dialog
              v-model="squadDialog"
              persistent
              transition-show="scale"
              transition-hide="scale"
            >
              <q-card class="squad-card-modern">
                <div class="squad-title">Squad Builder</div>

                <div class="squad-select-wrap">
                  <q-select
                    v-model="selectedSquad"
                    filled
                    dark
                    use-chips
                    multiple
                    style="width: 50%; margin-right: 5px"
                    use-input
                    max-values="5"
                    label-color="white"
                    :options="squadOptions"
                    label="Choose characters"
                    @filter="filterSquadOptions"
                    @update:model-value="handleSquadSelection"
                  />
                  <q-select
                    v-model="activeRelicFilter"
                    style="min-width: 50%"
                    :options="[
                      { label: 'No relic filter', value: null },
                      { label: 'Relic ≥ 1', value: 1 },
                      { label: 'Relic ≥ 3', value: 3 },
                      { label: 'Relic ≥ 5', value: 5 },
                      { label: 'Relic ≥ 7', value: 7 },
                      { label: 'Relic ≥ 9', value: 9 },
                    ]"
                    filled
                    label-color="white"
                    dark
                    label="Relic filter"
                  />
                </div>

                <q-separator class="q-my-md" />

                <!-- INFO -->
                <div v-if="selectedSquad.length < 2" class="squad-warning">
                  Select at least <b>2 characters</b> to generate squad table.
                </div>

                <!-- TABLE -->
                <q-scroll-area v-else class="squad-result-area">
                  <div class="squad-table-header">
                    <div class="col member-col">Member</div>
                    <div v-for="c in selectedSquad" :key="c" class="col">{{ c }}</div>
                  </div>

                  <div class="squad-table-row" v-for="m in squadMembers" :key="m.name">
                    <div class="col member-col">{{ m.name }}</div>

                    <div class="col" v-for="c in selectedSquad" :key="c">
                      {{ formatTierValue(findMemberTier(c, m.name)) }}
                    </div>
                  </div>
                </q-scroll-area>

                <div class="squad-result-count" v-if="selectedSquad.length >= 2">
                  Showing {{ squadMembers.length }} results
                </div>

                <div class="close-wrap">
                  <q-btn flat color="yellow" dark label="Close" @click="squadDialog = false" />
                </div>
              </q-card>
            </q-dialog>
          </div>
        </q-tab-panel>

        <q-tab-panel name="datacron">
          <div class="placeholder">Datacron Inhalt kommt später</div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGetGuildsStore } from 'src/stores/GetGuildStore'
import { usePlayerStore } from 'src/stores/PlayerStore'
import { useQuasar } from 'quasar'

const route = useRoute()
const playerStore = usePlayerStore()
const getGuildStore = useGetGuildsStore()
const $q = useQuasar()

const tab = ref('overview')

const compareUnits = [
  'Supreme Leader Kylo Ren',
  'Jedi Master Luke Skywalker',
  'Rey',
  'Ahsoka Tano',
  'Pirate King Hondo Ohnaka',
  'Sith Eternal Emperor',
  'Jedi Master Kenobi',
  'Jabba the Hutt',
  'Lord Vader',
  'Leia Organa',
  'Leviathan',
  'Executor',
  'Profundity',
  'Third Sister',
  'Great Mothers',
]

const activeRelicFilter = ref(null)
const omicronOnly = ref(false)

const myUnits = ref([])
const oppUnits = ref([])

function isShipUnit(unitName) {
  const unit = unitByName(myUnits.value, unitName) || unitByName(oppUnits.value, unitName)

  const firstMember = unit?.members?.[0]
  return firstMember?.unitPrefab?.toLowerCase().includes('ship')
}

async function loadData() {
  $q.loading.show()
  await playerStore.loadAllUnits()
  myUnits.value = playerStore.getUnitData
  await getGuildStore.loadGuildData(route.params.id)
  oppUnits.value = getGuildStore.getGuildData
  console.log(oppUnits.value)
  $q.loading.hide()
}
function getRelicLevel(member) {
  if (!member) return 0
  if (member.currentTier < 13) return 0 // Gear → kein Relic

  // echtes Relic-Level bestimmen
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

function isBothZero(mine, opp) {
  return mine === 0 && opp === 0
}

function getOppRelicCount(unit, relicLevel) {
  return getRelicCount(oppUnits.value, unit, relicLevel)
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

function hasOmicron(member) {
  return Array.isArray(member.skill) && member.skill.some((s) => s.isOmicron === true)
}

/* --- GETTER --- */
const getMineCount = (unit) => unitByName(myUnits.value, unit)?.members.length || 0
const getOppCount = (unit) => unitByName(oppUnits.value, unit)?.members.length || 0

const getMineAverage = (unit) => average(unitByName(myUnits.value, unit)?.members || [])
const getOppAverage = (unit) => average(unitByName(oppUnits.value, unit)?.members || [])

/* --- BALKEN-PROZENTE --- */
const percent = (mine, opp) => {
  const total = mine + opp
  if (total === 0) return [50, 50]
  const mineP = (mine / total) * 100
  return [mineP, 100 - mineP]
}

function getMemberTierValue(member) {
  const isShip = member.unitPrefab?.toLowerCase().includes('ship')

  if (isShip) {
    // SHIP → basiert NICHT auf Gear/Relic → nur Rarity-Value
    return member.currentRarity || 0
  }

  // CHARACTER
  if (member.currentTier < 13) return member.currentTier

  return 13 + ((member.relic?.currentTier || 2) - 2)
}

const getCountMinePercent = (unit) => percent(getMineCount(unit), getOppCount(unit))[0]
const getCountOppPercent = (unit) => percent(getMineCount(unit), getOppCount(unit))[1]

const getAvgMinePercent = (unit) => percent(getMineAverage(unit), getOppAverage(unit))[0]
const getAvgOppPercent = (unit) => percent(getMineAverage(unit), getOppAverage(unit))[1]

/* --- GESAMTVERGLEICH --- */
const totalMineAverage = computed(() => average(myUnits.value.flatMap((u) => u.members)))
const totalOppAverage = computed(() => average(oppUnits.value.flatMap((u) => u.members)))

const totalMinePercent = computed(() => percent(totalMineAverage.value, totalOppAverage.value)[0])
const totalOppPercent = computed(() => percent(totalMineAverage.value, totalOppAverage.value)[1])

function formatTierValueUniversal(avgValue, unitName) {
  const unit = unitByName(myUnits.value, unitName) || unitByName(oppUnits.value, unitName)

  if (!unit) return avgValue.toFixed(1)

  // Prüfen ob SHIP anhand eines Members
  const firstMember = unit.members[0]
  const isShip = firstMember?.unitPrefab?.toLowerCase().includes('ship')

  if (isShip) {
    return `⭐${avgValue.toFixed(1)}` // Ships haben nur Rarity
  }

  // CHARACTERS
  if (avgValue <= 13) {
    return `G${avgValue.toFixed(1)}`
  }

  return `R${(avgValue - 12).toFixed(1)}`
}

/* List of all names */

function tierValue(member) {
  if (!member) return 0

  // Charakter Gear
  if (member.currentTier < 13) return member.currentTier

  // Relic
  const relicTier = member.relic?.currentTier ?? 2 // 2 = R0
  return 13 + (relicTier - 2)
}

function formatTier(member) {
  if (!member) return ''

  const isShip = member.unitPrefab?.toLowerCase().includes('ship')

  // SHIP = rarity
  if (isShip) {
    return `⭐${member.currentRarity}`
  }

  // CHARACTER
  if (member.currentTier < 13) {
    return `G${member.currentTier}`
  }

  const relicTier = member.relic?.currentTier ?? 2
  return `R${relicTier - 2}`
}

/* --- CHARACTER TAB --- */

const searchCharacter = ref('')
const memberRelicFilter = ref(null)

const charDetailOpen = ref(false)
const squadDialog = ref(false)

const relicOptions = [
  { label: 'No filter', value: null },
  { label: 'Relic ≥ 1', value: 1 },
  { label: 'Relic ≥ 3', value: 3 },
  { label: 'Relic ≥ 5', value: 5 },
  { label: 'Relic ≥ 7', value: 7 },
  { label: 'Relic ≥ 9', value: 9 },
]

// Liste für die Charakterübersicht: alphabetisch + Suchfilter
const filteredCharacterList = computed(() => {
  const needle = searchCharacter.value.toLowerCase()

  return [...oppUnits.value]
    .filter((u) => u.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
})

/* Character details */
const selectedUnit = ref(null)

// Basis-Liste: nur Charaktere (keine Schiffe), alphabetisch
const baseSquadOptions = computed(() =>
  oppUnits.value
    .filter((u) => !u.members[0]?.unitPrefab?.toLowerCase().includes('ship'))
    .map((u) => u.name)
    .sort((a, b) => a.localeCompare(b)),
)

// Gefilterte Liste für das q-select (muss ref sein!)
const squadOptions = ref([])

// Immer wenn sich die Basisliste ändert → aktuelle Options updaten
watch(
  baseSquadOptions,
  (val) => {
    squadOptions.value = val
  },
  { immediate: true },
)

// Name-Filter vom q-select
function filterSquadOptions(val, update) {
  const needle = val.toLowerCase()

  update(() => {
    if (!needle) {
      squadOptions.value = baseSquadOptions.value
    } else {
      squadOptions.value = baseSquadOptions.value.filter((name) =>
        name.toLowerCase().includes(needle),
      )
    }
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

  // --- RELIC FILTER (wie vorher) ---
  if (memberRelicFilter.value !== null) {
    members = members.filter((m) => getRelicLevel(m) >= memberRelicFilter.value.value)
  }

  // --- OMIKRON FILTER (NEU) ---
  if (omicronOnly.value) {
    members = members.filter(
      (m) => Array.isArray(m.skill) && m.skill.some((s) => s.isOmicron === true),
    )
  }

  // --- SORTIEREN (wie vorher) ---
  return members.sort(sortMembers)
})

function getGearLevel(member) {
  if (!member) return 0
  return Math.min(member.currentTier, 13) // 1–13
}

function sortMembers(a, b) {
  const relicA = getRelicLevel(a)
  const relicB = getRelicLevel(b)

  // 1. Relic absteigend
  if (relicA !== relicB) return relicB - relicA

  const gearA = getGearLevel(a)
  const gearB = getGearLevel(b)

  // 2. Gear absteigend
  if (gearA !== gearB) return gearB - gearA

  // 3. Alphabetisch
  return a.memberName.localeCompare(b.memberName)
}

/* --- SQUAD BUILDER --- */
const selectedSquad = ref([])

function handleSquadSelection(val) {
  // Maximal 5
  if (val.length > 5) {
    val.splice(5)
  }

  // Minimum 2 (aber nicht automatisch löschen)
  selectedSquad.value = [...val]
}

/* Build table */
const squadMembers = computed(() => {
  if (selectedSquad.value.length < 2) return []

  const result = []

  const firstCharName = selectedSquad.value[0]
  if (!firstCharName) return []

  // Relic-Schwelle aus dem Dropdown
  const relicThreshold =
    activeRelicFilter.value && activeRelicFilter.value.value != null
      ? activeRelicFilter.value.value
      : null

  // Alle Member-Namen
  const allMemberNames = new Set(oppUnits.value.flatMap((u) => u.members.map((m) => m.memberName)))

  for (const memberName of allMemberNames) {
    let valid = true
    const row = { name: memberName }

    // Prüfen: besitzt der Member *alle Charaktere*?
    for (const charName of selectedSquad.value) {
      const unit = oppUnits.value.find((u) => u.name === charName)
      const member = unit?.members.find((m) => m.memberName === memberName)

      if (!member) {
        valid = false
        break
      }

      row[charName] = tierValue(member)
    }

    if (!valid) continue

    // Relic-Filter auf Basis des ersten Charakters
    // --- Relic-Filter: Jetzt für ALLE ausgewählten Charaktere ---
    if (relicThreshold != null) {
      for (const charName of selectedSquad.value) {
        const unit = oppUnits.value.find((u) => u.name === charName)
        const member = unit?.members.find((m) => m.memberName === memberName)

        if (!member) {
          valid = false
          break
        }

        const relicLevel = getRelicLevel(member)

        // wenn irgendeiner der gewählten Charaktere zu niedrig ist → raus
        if (relicLevel < relicThreshold) {
          valid = false
          break
        }
      }

      if (!valid) continue
    }

    result.push(row)
  }

  // Sortieren nach:
  // 1. Relic-Level vom ersten Character
  // 2. Tierwert vom ersten Character
  // 3. Alphabetisch
  return result.sort((a, b) => {
    const firstA = oppUnits.value
      .find((u) => u.name === firstCharName)
      ?.members.find((m) => m.memberName === a.name)
    const firstB = oppUnits.value
      .find((u) => u.name === firstCharName)
      ?.members.find((m) => m.memberName === b.name)

    const relicA = getRelicLevel(firstA)
    const relicB = getRelicLevel(firstB)

    if (relicA !== relicB) return relicB - relicA

    const tierA = tierValue(firstA)
    const tierB = tierValue(firstB)

    if (tierA !== tierB) return tierB - tierA

    return a.name.localeCompare(b.name)
  })
})

function findMemberTier(unitName, memberName) {
  const unit = oppUnits.value.find((u) => u.name === unitName)
  if (!unit) return 0

  const m = unit.members.find((x) => x.memberName === memberName)
  return m ? tierValue(m) : 0
}

function formatTierValue(value) {
  if (!value || value === 0) return ''

  // Gear 1–13
  if (value <= 13) return `G${value}`

  // Relics: value = 13 + relicLevel → relicLevel = value - 13
  return `R${value - 13}`
}

onMounted(loadData)
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

/* Gleicher Wrapper wie Charakterübersicht → komplett transparent */
.content-wrapper {
  max-width: 1500px;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  background: transparent !important;
  box-sizing: border-box;
}

/* Titel – exakt dieselben Werte */
.title {
  font-family: 'Star Jedi', sans-serif;
  text-align: center;
  font-size: 2.6rem;
  margin-bottom: 20px;
  color: #ffe81f;
  text-shadow: 0 0 12px #ffe81f;
}

/* Tabs bleiben */
.tab-header {
  margin-bottom: 25px;
}

/* Überschrift */
.subtitle {
  font-size: 1.4rem;
  margin: 20px 0 10px;
  color: #ffe81f;
  font-weight: 600;
}

/* --- HOLOTABLE CARD STYLE (Matcht Charakterübersicht) --- */

/* Titel im Panel */
.unit-title {
  font-size: 1.2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

/* Balken – bleiben wie du sie hattest */
.bar-container {
  width: 100%;
  height: 26px;
  display: flex;
  margin: 5px 0 10px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.bar.neutral {
  background: linear-gradient(to right, #666, #999);
  opacity: 0.6;
}

.bar.red {
  background: linear-gradient(to right, #992222, #ff4b4b);
}

.bar.blue {
  background: linear-gradient(to left, #3a82ff, #61a6ff);
}

/* Balkenwerte */
.metric-values {
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: -6px;
}

.blue-text {
  color: #6bb8ff;
}
.red-text {
  color: #ff6f6f;
}

/* Leichter Glow um große Box */
.comparison-section {
  margin-bottom: 40px;
}

/* Placeholder */
.placeholder {
  margin-top: 40px;
  text-align: center;
  opacity: 0.6;
}

/* ENTSCHEIDEND: Tab Panels transparent machen */
:deep(.q-tab-panel) {
  background: transparent !important;
  padding: 0 !important;
}

/* Der Bereich direkt unter den Tabs soll KEINEN grauen Block erzeugen */
:deep(.q-tab-panels) {
  background: transparent !important;
}

/* Der weiße/helle Block der jetzt sichtbar ist */
.comparison-section {
  background: rgba(0, 0, 0, 0.45) !important;
  border: 1px solid rgba(255, 232, 31, 0.18);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(6px);
}

/* Jede Unit-Karte */
.unit-row {
  background-color: none;
  border-radius: 14px;
  padding: 18px;
  margin-top: -40px;
}

/* --- Header Wrapper --- */
.analysis-header {
  display: flex;
  justify-content: center;
  margin-top: -10px;
  margin-bottom: 20px;
}

/* --- Improved Tabs --- */
.analysis-tabs {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  padding: 6px 20px;
  max-width: 100%;
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

/* Weicher Fade + Blur am unteren Rand */
.page-container::after {
  content: '';
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px; /* wie stark der Fade sein soll */
  pointer-events: none;

  /* Gradient + Blur */
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.4) 40%,
    rgba(0, 0, 0, 0.7) 70%,
    rgba(0, 0, 0, 1) 100%
  );

  backdrop-filter: blur(2px);
}

.char-page {
  background: transparent;
  padding: 10px;
}

.search-input,
.filter-select {
  margin-bottom: 15px;
}

.character-list {
  max-height: 40vh;
  overflow-y: auto;
  border-radius: 12px;
}

.character-row {
  padding: 12px;
  background: rgba(0, 0, 0, 0.45);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.character-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* --- CHARACTER DETAIL MODAL (MATCHT DEINEN WAR INSPECTOR STYLE) --- */

.char-detail-card {
  width: 700px;
  max-width: 95vw;
  padding: 25px 30px;
  border-radius: 18px;

  /* STAR-WARS GLASOPTIK */
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 232, 31, 0.35);

  /* Glow */
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.7);

  color: #ffe81f !important;
}

/* Titel wie im War-Detail-Fenster */
.char-detail-card .dialog-title {
  font-family: 'Star Jedi', sans-serif;
  font-size: 2rem;
  text-align: center;
  margin-bottom: 20px;
  color: #ffe81f;
  text-shadow: 0 0 10px rgba(255, 232, 31, 0.8);
}

/* Select-Styling */
.char-detail-card .q-select {
  margin-bottom: 12px;
}

.char-detail-card :deep(.q-field__native),
.char-detail-card :deep(.q-item__label) {
  color: #ffe81f !important;
}

/* Scrollbare Memberliste */
.member-list {
  max-height: 55vh;
  overflow-y: auto;
  padding-right: 6px;
}

/* Zeilen exakt wie im Beispiel */
.member-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 1.05rem;
}

.member-row:last-child {
  border-bottom: none;
}

.member-count {
  text-align: center;
  margin-top: 12px;
  font-size: 0.95rem;
  opacity: 0.85;
  color: white;
}

/* Close Button */
.char-detail-card .q-btn {
  margin-top: 18px;
  width: 100%;
  border: 1px solid rgba(255, 232, 31, 0.25);
  font-weight: 600;
}

.member-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.member-count {
  opacity: 0.7;
  margin-top: 5px;
}

.squad-builder {
  margin-top: 40px;
  padding: 20px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 232, 31, 0.15);
  backdrop-filter: blur(6px);
}

.search-input :deep(input) {
  color: white !important;
}

.char-filter :deep(input) {
  color: white;
}

/* CHARACTER TAB */

.char-page {
  padding: 10px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 16px;
  backdrop-filter: blur(6px);
}

.char-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.char-search {
  flex: 2;
}

.char-filter {
  flex: 1;
}

.char-squad-btn {
  border: 1px solid rgba(255, 232, 31, 0.25);
  font-weight: 600;
}

.character-list {
  max-height: 55vh;
  overflow-y: auto;
  border-radius: 12px;
  mask-image: linear-gradient(to bottom, black 80%, transparent);
}

.character-row {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.5);
  margin-bottom: 6px;
  border-radius: 10px;
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  transition: 0.15s ease;
}

.character-row:hover {
  background: rgba(255, 255, 255, 0.12);
}

.char-name {
  font-size: 1.05rem;
}

.count {
  opacity: 0.8;
}

/* Character detail modal */
.char-detail-card {
  width: 550px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 232, 31, 0.25);
}

.member-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

/* SQUAD BUILDER */
.squad-card {
  width: 850px;
  padding: 25px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 232, 31, 0.25);
}

.squad-warning {
  opacity: 0.7;
  font-size: 1rem;
}

.squad-select-wrap {
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
}

.squad-select-popup {
  max-height: 200px !important; /* Fixe Höhe – kein Wachstum mehr */
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* Damit das Popup niemals versucht, größer zu werden */
.q-menu,
.q-menu__content {
  max-height: 200px !important;
}

/* verhindert, dass Quasar die Größe dynamisch neu berechnet */
.q-virtual-scroll__content,
.q-virtual-scroll__padding {
  max-height: 200px !important;
}

.squad-table {
  max-height: 400px;
  overflow-y: auto;
}

.squad-header,
.squad-row {
  display: grid;
  grid-template-columns: 160px repeat(5, 1fr);
  padding: 8px 0;
}

.squad-header {
  border-bottom: 1px solid rgba(255, 232, 31, 0.3);
  font-weight: 700;
}

/* Fix: Squad Builder text invisible on dark background */
.squad-card,
.squad-card * {
  color: #ffe81f !important; /* Star Wars gelb */
}

.squad-card-modern {
  width: min(900px, 100%);
  max-width: 95vw;
  box-sizing: border-box;
  max-width: 95vw;
  padding: 30px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 232, 31, 0.3);
  border-radius: 18px;
  backdrop-filter: blur(12px);
  color: #ffffff;
  font-size: 1.1em;
}

.squad-title {
  font-family: 'Star Jedi';
  font-size: 2rem;
  margin-bottom: 20px;
  text-align: center;
}

.squad-result-area {
  max-height: 400px;
}

.squad-table-header,
.squad-table-row {
  display: grid;
  grid-template-columns: 200px repeat(5, 1fr);
  padding: 8px 0;
}

.squad-table-header {
  border-bottom: 1px solid rgba(255, 232, 31, 0.4);
  font-weight: bold;
}

.squad-table-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.squad-warning {
  text-align: center;
  opacity: 0.9;
  padding: 20px;
}

.close-wrap {
  text-align: center;
  margin-top: 15px;
}

.squad-result-area {
  height: 300px; /* wichtig! nicht nur max-height */
  max-height: 400px;
  overflow: hidden; // übernimmt q-scroll-area
  margin-top: 10px;
}

.squad-result-count {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 5px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #ffe81f;
  opacity: 0.9;
  text-shadow: 0 0 6px rgba(255, 232, 31, 0.45);
}

.page-container {
  padding: 20px;
  background: url('/icons/BGTest.webp') center/cover no-repeat fixed;
  min-height: 100vh;
  color: white;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  max-width: 1500px;
  margin: 0 auto;
  background: transparent !important;
}

/* Titel */
.title {
  font-family: 'Star Jedi', sans-serif;
  text-align: center;
  font-size: 2.6rem;
  margin-bottom: 20px;
  color: #ffe81f;
  text-shadow: 0 0 12px #ffe81f;
}

/* Hauptbereich, Tab und Content */
.analysis-header,
.analysis-tabs {
  margin-bottom: 25px;
}

.strategy-layout {
  display: grid;
  grid-template-columns: 1fr 3fr; /* Anpassung für größere Bildschirme */
  gap: 20px;
}

.map-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* Anpassung für die Zone Panel */
.zone-panel {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 232, 31, 0.35);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  flex-grow: 1;
}

/* Scrollbar für die Zone */
.zone-rows-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  mask-image: linear-gradient(to bottom, black 90%, transparent);
}

/* Anpassungen für die Buttons */
.add-row-btn,
.delete-btn {
  position: sticky;
  bottom: 0;
  margin-top: 12px;
  z-index: 5;
}

/* Responsive Anpassungen */
@media (max-width: 1024px) {
  .strategy-layout {
    grid-template-columns: 1fr; /* Für Tablets: 1 Spalte */
  }

  .map-panel {
    grid-template-columns: repeat(5, minmax(140px, 1fr));
    overflow-x: auto;
  }

  .zone-panel {
    height: auto;
    max-height: none;
  }

  .zone-rows-scroll {
    max-height: 60vh;
  }
}

@media (max-width: 600px) {
  .map-panel {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 10px;
  }

  .zone-tile {
    min-width: 140px;
    padding: 14px 10px;
    font-size: 0.9rem;
    border-radius: 14px;
    text-align: center;
  }

  .zone-tile.active {
    background: #ffe81f;
    color: #000;
    box-shadow: 0 0 12px rgba(255, 232, 31, 0.8);
  }

  .zone-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding-bottom: 36px;
  }

  .delete-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
  }

  /* Modal und Tabs für mobile */
  .char-header,
  .zone-header {
    display: flex;
    gap: 10px;
    flex-direction: column;
  }

  .zone-panel {
    padding: 10px;
    max-height: none;
  }
}

@media (max-width: 375px) {
  /* Weitere Optimierungen für kleine Geräte */
  .title {
    font-size: 1.8rem;
  }

  .zone-tile {
    font-size: 0.8rem;
  }

  .zone-header {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .squad-table-header,
  .squad-table-row {
    grid-template-columns: 140px repeat(5, minmax(60px, 1fr));
  }
}
</style>
