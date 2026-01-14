<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="header-section text-center q-mb-lg">
        <h1 class="text-h4 text-uppercase text-weight-bold glow-text q-my-none">
          <q-icon name="groups" color="accent" class="q-mr-sm" />
          Guild Intelligence
        </h1>
        <div class="text-caption text-grey-4">Unit Roster & Analysis</div>
      </div>

      <div
        class="glass-card filter-bar row items-center justify-between q-col-gutter-md q-px-lg q-py-md q-mb-lg"
      >
        <div class="col-12 col-sm-6 text-center">
          <q-btn
            icon="travel_explore"
            label="Opponent Analysis"
            color="white"
            text-color="black"
            class="full-width"
            @click="goToOpponent"
          />
        </div>
        <div class="col-12 col-sm-6 text-center">
          <q-btn
            icon="search"
            label="Search Global Unit"
            color="accent"
            text-color="white"
            class="full-width"
            @click="goToSearch"
          />
        </div>
      </div>

      <div class="character-grid">
        <div
          v-for="item in guildUnits"
          :key="item.baseId || item.name"
          class="glass-card character-card q-pa-lg cursor-pointer relative-position"
          @click="openFromGrid(item)"
        >
          <div class="row items-center no-wrap">
            <div class="col-auto">
              <q-avatar size="90px" class="shadow-3">
                <UnitIcon :unit-name="item.name" :all-unit-data="allUnitData" size="100%" />
              </q-avatar>
            </div>

            <div class="col q-pl-lg overflow-hidden">
              <div class="text-h5 text-white ellipsis text-weight-bold q-mb-sm" :title="item.name">
                {{ item.name }}
              </div>
              <div class="row items-center">
                <q-linear-progress
                  :value="getMemberCount(item) / totalMembers"
                  color="accent"
                  track-color="grey-8"
                  class="col-grow q-mr-md"
                  rounded
                  size="10px"
                />
                <span class="text-h6 text-accent text-weight-bold">
                  {{ getMemberCount(item)
                  }}<span class="text-grey-5 text-subtitle1">/{{ totalMembers }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="dialogOpen" backdrop-filter="blur(4px)">
      <q-card class="glass-card dialog-card column no-wrap" style="max-height: 85vh">
        <q-card-section class="row items-center q-pb-none bg-dark-transparent">
          <q-avatar size="80px" class="q-mr-md border-accent">
            <UnitIcon
              v-if="selectedCharacter"
              :unit-name="selectedCharacter.name"
              :all-unit-data="allUnitData"
              size="100%"
            />
          </q-avatar>
          <div class="col overflow-hidden">
            <div class="text-h4 text-accent text-uppercase ellipsis">
              {{ selectedCharacter?.name }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="scroll col member-table-container q-pt-md custom-scroll">
          <div class="member-list">
            <div class="row text-grey-4 text-uppercase text-caption q-mb-sm q-px-sm">
              <div class="col">Member</div>
              <div class="col-auto" style="width: 80px; text-align: right">Power/Tier</div>
            </div>

            <template v-if="sortedMembers.length > 0">
              <div
                v-for="m in sortedMembers"
                :key="m.playerId || m.memberName"
                class="member-row row items-center q-py-sm q-px-sm rounded-borders"
              >
                <div class="col text-white">{{ m.memberName }}</div>
                <div class="col-auto text-right">
                  <q-badge :color="getTierColor(m)" text-color="black" class="text-weight-bold">
                    {{ formatTier(m) }}
                  </q-badge>
                </div>
              </div>
            </template>
            <div v-else class="text-center text-grey-5 q-mt-xl">
              <q-icon name="group_off" size="xl" class="q-mb-sm" />
              <div>No members found for this unit.</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md bg-dark-transparent border-top-accent">
          <q-btn
            :label="cameFromSearch ? 'Zurück zur Suche' : 'Zurück zur Übersicht'"
            icon="arrow_back"
            color="accent"
            text-color="black"
            class="full-width text-weight-bold"
            size="md"
            @click="handleBack"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="searchDialogOpen" backdrop-filter="blur(4px)">
      <q-card class="glass-card dialog-card">
        <q-card-section>
          <div class="text-h6 text-accent">Search Global Unit</div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div class="q-pa-md">
            <q-input
              v-model="searchQuery"
              filled
              dense
              dark
              placeholder="Unit Name..."
              class="high-contrast-input"
              autofocus
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="custom-scroll" style="height: 50vh; overflow-y: auto">
            <q-virtual-scroll
              style="height: 100%"
              :items="filteredUnits"
              separator
              class="bg-transparent"
            >
              <template v-slot="{ item }">
                <q-item
                  :key="item.baseId || item.name"
                  clickable
                  v-ripple
                  @click="openFromSearch(item)"
                  class="rounded-borders"
                  dense
                >
                  <q-item-section avatar>
                    <q-avatar rounded size="50px">
                      <UnitIcon :unit-name="item.name" :all-unit-data="allUnitData" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section class="text-body1 text-white">{{ item.name }}</q-item-section>

                  <q-item-section side>
                    <q-badge
                      :color="getMemberCount(item) > 0 ? 'accent' : 'grey-8'"
                      :text-color="getMemberCount(item) > 0 ? 'black' : 'white'"
                      class="text-weight-bold"
                    >
                      {{ getMemberCount(item) }}
                    </q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-virtual-scroll>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="grey-4" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="opponentDialog" backdrop-filter="blur(4px)">
      <q-card class="glass-card dialog-card">
        <q-card-section><div class="text-h6 text-accent">Opponent Analysis</div></q-card-section>
        <q-card-section>
          <q-input
            v-model="searchGuild"
            label="Enter Guild Name"
            filled
            dark
            dense
            class="high-contrast-input q-mb-md"
            @keyup.enter="searchOpponentGuild"
          >
            <template #append>
              <q-btn flat dense round icon="search" @click="searchOpponentGuild" />
            </template>
          </q-input>
          <div class="results-container scroll custom-scroll" style="height: 300px">
            <q-list dark separator v-if="guildResults.length > 0">
              <q-item
                v-for="g in guildResults"
                :key="g.id"
                clickable
                v-ripple
                @click="selectOpponentGuild(g)"
              >
                <q-item-section>
                  <q-item-label class="text-accent text-body1">{{ g.name }}</q-item-label>
                  <q-item-label caption class="text-grey-5">{{ g.id }}</q-item-label>
                </q-item-section>
                <q-item-section side><q-icon name="chevron_right" color="grey" /></q-item-section>
              </q-item>
            </q-list>
            <div v-else-if="searchPerformed" class="flex flex-center full-height text-grey-5">
              <q-icon name="search_off" size="md" class="q-mr-sm" /> No Guild found
            </div>
            <div v-else class="flex flex-center full-height text-grey-6 text-caption">
              Enter a name to search swgoh.gg
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="grey-4" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from 'src/stores/PlayerStore'
import { useGuildStore } from 'src/stores/GuildStore'
import { useGetGuildsStore } from 'src/stores/GetGuildStore'
import { api } from 'src/boot/axios'
import UnitIcon from 'components/UnitIcon.vue'

const $q = useQuasar()
const router = useRouter()
const playerStore = usePlayerStore()
const guildStore = useGuildStore()
const getGuildStore = useGetGuildsStore()

// --- State ---
const guildUnits = ref([])
const allGameUnits = ref([])
const totalMembers = ref(0)
const allUnitData = ref([])

// --- Dialogs ---
const dialogOpen = ref(false)
const selectedCharacter = ref(null)
const searchDialogOpen = ref(false)
const searchQuery = ref('')
const opponentDialog = ref(false)
const searchGuild = ref('')
const guildResults = ref([])
const searchPerformed = ref(false)

// --- NAVIGATION STATE ---
const cameFromSearch = ref(false)

// --- ACTIONS ---

async function goToSearch() {
  $q.loading.show()
  await playerStore.loadAllUnits()
  allGameUnits.value = playerStore.getUnitData
  $q.loading.hide()
  searchDialogOpen.value = true
}

const filteredUnits = computed(() => {
  if (!searchQuery.value) return allGameUnits.value
  return allGameUnits.value.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

function getMemberCount(unit) {
  if (!unit) return 0
  let guildItem = null
  if (guildUnits.value && unit.baseId) {
    guildItem = guildUnits.value.find((g) => g.baseId === unit.baseId)
  }
  if (!guildItem && guildUnits.value) {
    guildItem = guildUnits.value.find((g) => g.name === unit.name)
  }
  if (guildItem && guildItem.members) {
    return guildItem.members.length
  }
  if (unit.members) {
    return unit.members.length
  }
  return 0
}

function openFromSearch(item) {
  let guildItem = guildUnits.value.find((u) => u.name === item.name)

  if (!guildItem) {
    guildItem = guildUnits.value.find((u) => u.name === item.name)
  }

  cameFromSearch.value = true
  searchDialogOpen.value = false

  if (guildItem) {
    openDialog(guildItem)
  } else {
    openDialog(item)
  }
}

function openFromGrid(item) {
  cameFromSearch.value = false
  openDialog(item)
}

function openDialog(item) {
  selectedCharacter.value = item
  dialogOpen.value = true
}

function handleBack() {
  dialogOpen.value = false
  if (cameFromSearch.value) {
    requestAnimationFrame(() => {
      searchDialogOpen.value = true
    })
  }
}

function goToOpponent() {
  opponentDialog.value = true
}

async function searchOpponentGuild() {
  if (!searchGuild.value.trim()) return
  searchPerformed.value = false
  guildResults.value = []
  try {
    $q.loading.show()
    await getGuildStore.loadGuildNames(searchGuild.value)
    guildResults.value = getGuildStore.getGuildNames
    searchPerformed.value = true
  } catch (e) {
    console.error(e)
  } finally {
    $q.loading.hide()
  }
}

async function selectOpponentGuild(guild) {
  await getGuildStore.setName(guild.name)
  router.push({ name: 'opponent-analysis', params: { id: guild.id } })
}

const sortedMembers = computed(() => {
  if (!selectedCharacter.value?.members) return []
  return [...selectedCharacter.value.members].sort((a, b) => {
    const aIsShip = a.unitPrefab?.toLowerCase().includes('ship') || false
    const bIsShip = b.unitPrefab?.toLowerCase().includes('ship') || false
    if (!aIsShip && bIsShip) return -1
    if (aIsShip && !bIsShip) return 1
    if (aIsShip && bIsShip) return (b.currentRarity || 0) - (a.currentRarity || 0)
    const aIsRelic = a.currentTier === 13
    const bIsRelic = b.currentTier === 13
    if (aIsRelic && !bIsRelic) return -1
    if (!aIsRelic && bIsRelic) return 1
    if (aIsRelic && bIsRelic) {
      const aRel = a.relic?.currentTier || 2
      const bRel = b.relic?.currentTier || 2
      return bRel - aRel
    }
    return b.currentTier - a.currentTier
  })
})

function formatTier(m) {
  const isShip = m.unitPrefab?.toLowerCase().includes('ship')
  if (isShip) return `⭐${m.currentRarity || 0}`
  if (m.currentTier === 13) {
    const rel = m.relic?.currentTier ? m.relic.currentTier - 2 : 1
    return `R${rel}`
  }
  return `G${m.currentTier}`
}
function getTierColor(m) {
  const isShip = m.unitPrefab?.toLowerCase().includes('ship')
  if (isShip) return 'blue-3'
  if (m.currentTier === 13) {
    const rel = m.relic?.currentTier ? m.relic.currentTier - 2 : 1
    if (rel >= 7) return 'red-5'
    if (rel >= 5) return 'orange-4'
    return 'cyan-4'
  }
  if (m.currentTier >= 12) return 'yellow-8'
  return 'purple-3'
}

onMounted(async () => {
  $q.loading.show()
  try {
    await Promise.all([playerStore.loadPlayerData(), guildStore.loadGuildData()])
    const res = await api.get('/unitNames')
    allUnitData.value = res.data

    totalMembers.value = guildStore.getGuildData.guild.member.length
    guildUnits.value = playerStore.getPlayerData
  } catch (e) {
    console.error(e)
  } finally {
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
    linear-gradient(rgba(10, 10, 14, 0.089), rgba(10, 10, 14, 0.781)),
    url('/icons/BGTest.webp') center/cover no-repeat fixed;
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif;
}
.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
}
.glow-text {
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(79, 195, 247, 0.2);
  letter-spacing: 2px;
}
.glass-card {
  background: rgba(20, 20, 25, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}
.filter-bar {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 24px auto;
  border-radius: 12px;
}
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}
.character-card {
  transition:
    transform 0.2s,
    background 0.2s;
  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--q-accent);
  }
}
.dialog-card {
  width: 700px;
  max-width: 95vw;
}
.member-table-container {
  max-height: 60vh;
}
.member-row {
  transition: background 0.1s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
}
.border-accent {
  border: 2px solid var(--q-accent);
}
.border-top-accent {
  border-top: 1px solid rgba(255, 232, 31, 0.3);
}
.bg-dark-transparent {
  background: rgba(0, 0, 0, 0.3);
}
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label) {
  color: #ffffff !important;
}
.search-list {
  max-height: 50vh;
}

/* --- SCROLLBAR --- */
.custom-scroll {
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
}

/* Chrome / Edge / Safari */
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--q-accent);
}
</style>
