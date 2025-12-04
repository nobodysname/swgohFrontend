<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <h1 class="title">Charakter-Übersicht</h1>

      <div class="top-buttons">
        <q-btn color="secondary" label="Gegneranalyse" @click="goToOpponent" flat />
        <q-btn color="secondary" label="Charakter suchen" @click="goToSearch" flat />
      </div>

      <div class="character-grid">
        <div
          v-for="item in guildUnits"
          :key="item.name"
          class="character-card"
          @click="openDialog(item)"
        >
          <h2 class="char-name">{{ item.name }}</h2>
          <p class="char-unlocks">
            {{ item.members.length }} <span class="total">/ {{ totalMembers }}</span>
          </p>
        </div>
      </div>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card class="dialog-card">
        <h2 class="dialog-title">{{ selectedCharacter?.name }}</h2>

        <div class="member-table">
          <div class="table-header">
            <span>Mitglied</span>
            <span>Stufe</span>
          </div>

          <div class="table-row" v-for="m in sortedMembers" :key="m.memberName">
            <span class="name">{{ m.memberName }}</span>
            <span class="tier">
              {{ formatTier(m) }}
            </span>
          </div>
        </div>

        <q-btn class="close-btn" color="primary" label="Schließen" @click="dialogOpen = false" />
      </q-card>
    </q-dialog>

    <q-dialog v-model="searchDialogOpen">
      <q-card class="dialog-card search-dialog">
        <h2 class="dialog-title">Charakter suchen</h2>

        <!-- Suchfeld -->
        <q-input
          v-model="searchQuery"
          filled
          dense
          placeholder="Charaktername suchen…"
          class="search-input mb-4"
          color="yellow"
          input-class="text-white"
          bg-color="dark"
          style="margin-bottom: 20px"
        />

        <!-- Scrollbare Liste -->
        <div class="search-list">
          <div
            v-for="unit in filteredUnits"
            :key="unit.name"
            class="search-row"
            @click="openFromSearch(unit)"
          >
            {{ unit.name }}
            <span class="count">{{ unit.members.length }}</span>
          </div>
        </div>

        <q-btn
          class="close-btn"
          color="primary"
          label="Schließen"
          @click="searchDialogOpen = false"
        />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { onMounted, ref, computed } from 'vue'
import { usePlayerStore } from 'src/stores/PlayerStore'
import { useGuildStore } from 'src/stores/GuildStore'

const $q = useQuasar()
const playerStore = usePlayerStore()
const guildStore = useGuildStore()
const guildUnits = ref([])
const allUnits = ref([])

const totalMembers = ref(0)
const dialogOpen = ref(false)
const selectedCharacter = ref(null)

const searchDialogOpen = ref(false)
const searchQuery = ref('')

const filteredUnits = computed(() => {
  if (!searchQuery.value) return allUnits.value
  return allUnits.value.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

function openDialog(item) {
  selectedCharacter.value = item
  dialogOpen.value = true
}

function goToOpponent() {
  $q.notify({
    message: 'Comming Soon...',
    type: 'negative',
  })
}

async function goToSearch() {
  $q.loading.show()
  await playerStore.loadAllUnits()
  $q.loading.hide()
  allUnits.value = playerStore.getUnitData
  console.log(guildUnits.value)
  searchDialogOpen.value = true
}

async function openFromSearch(item) {
  searchDialogOpen.value = false
  openDialog(item)
}

function formatTier(m) {
  const isShip = m.unitPrefab?.toLowerCase().includes('ship')

  if (isShip) {
    return `⭐${m.currentRarity || 0}`
  }

  // CHARACTER
  if (m.currentTier === 13) {
    const rel = m.relic?.currentTier ? m.relic.currentTier - 2 : 1
    return `R${rel}`
  }

  return `G${m.currentTier}`
}

const sortedMembers = computed(() => {
  if (!selectedCharacter.value?.members) return []

  return [...selectedCharacter.value.members].sort((a, b) => {
    const aIsShip = a.unitPrefab?.toLowerCase().includes('ship') || false
    const bIsShip = b.unitPrefab?.toLowerCase().includes('ship') || false

    // 1. CHARACTERS oben, SHIPS unten
    if (!aIsShip && bIsShip) return -1
    if (aIsShip && !bIsShip) return 1

    // 2. Wenn beide SHIP → nach Rarity sortieren
    if (aIsShip && bIsShip) {
      return (b.currentRarity || 0) - (a.currentRarity || 0)
    }

    // 3. Wenn beide UNITS → alte Relic/Gear Logik
    const aIsRelic = a.currentTier === 13
    const bIsRelic = b.currentTier === 13

    // Relics vor Gear
    if (aIsRelic && !bIsRelic) return -1
    if (!aIsRelic && bIsRelic) return 1

    // Relic → nach Relic Level sortieren
    if (aIsRelic && bIsRelic) {
      const aRel = a.relic?.currentTier || 2
      const bRel = b.relic?.currentTier || 2
      return bRel - aRel
    }

    // Gear
    return b.currentTier - a.currentTier
  })
})

onMounted(async () => {
  $q.loading.show()
  await playerStore.loadPlayerData()
  await guildStore.loadGuildData()
  $q.loading.hide()
  totalMembers.value = guildStore.getGuildData.guild.member.length
  guildUnits.value = playerStore.getPlayerData
})
</script>

<style scoped lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}
.page-container {
  min-height: 10vh;
  padding: 10px;
  background: url('/icons/BGTest.PNG') center/cover no-repeat fixed;
}

.content-wrapper {
  max-width: 1500px;
  margin: 0 auto;
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

/* Top Buttons */
.top-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 24px;

  button {
    backdrop-filter: blur(6px);
    background: rgba(0, 0, 0, 0.35) !important;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
}

/* Character grid */
.character-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 18px;

  @media (max-width: 1600px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: repeat(1, 1fr);
  }
}

.character-card {
  padding: 18px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 232, 31, 0.18);
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s;

  &:hover {
    transform: translateY(-4px);
    background: rgba(0, 0, 0, 0.65);
  }
}

.char-name {
  font-size: 1.1rem;
  margin-bottom: 6px;
  font-weight: 600;
}

.char-unlocks {
  opacity: 0.9;
  font-size: 0.95rem;

  .total {
    opacity: 0.6;
  }
}

/* Dialog Design */
.dialog-card {
  width: 420px;
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 232, 31, 0.25);
  padding: 24px;
  color: #fff;
}

.dialog-title {
  font-size: 1.6rem;
  margin-bottom: 10px;
  text-align: center;
  color: #ffe81f;
}

.member-list {
  max-height: 50vh;
  overflow-y: auto;
}

.member-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 232, 31, 0.15);

  .level {
    opacity: 0.9;
    font-weight: 600;
  }
}

.close-btn {
  max-width: 100%;
  margin-top: 15px;
  position: relative;
}

.dialog-card {
  width: 600px; /* jetzt breiter */
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 232, 31, 0.25);
  padding: 24px;
  color: #fff;
}

.member-table {
  max-height: 55vh;
  overflow-y: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1fr 80px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 232, 31, 0.15);
}

.table-header {
  font-weight: 700;
  color: #ffe81f;
  font-size: 1.1rem;
}

.table-row .name {
  opacity: 0.9;
}

.table-row .tier {
  font-weight: 700;
  color: #fff;
  padding-left: 10px;
}

.close-btn {
  width: 100%;
  margin-top: 20px;
}

.search-list {
  height: 45vh;
  overflow-y: auto;
}

.search-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 232, 31, 0.15);
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}

.search-row .count {
  opacity: 0.7;
  position: relative;
  right: 20px;
}
</style>
