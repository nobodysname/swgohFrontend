<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <h1 class="title">Charakter-Übersicht</h1>

      <div class="top-buttons">
        <q-btn color="primary" label="Gegneranalyse" @click="goToOpponent" flat />
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
              {{ m.currentTier == 13 ? 'R' + (m.relic.currentTier - 2) : 'G' + m.currentTier }}
            </span>
          </div>
        </div>

        <q-btn class="close-btn" color="primary" label="Schließen" @click="dialogOpen = false" />
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

const totalMembers = ref(0)
const dialogOpen = ref(false)
const selectedCharacter = ref(null)

function openDialog(item) {
  selectedCharacter.value = item
  dialogOpen.value = true
}

function goToOpponent() {
  console.log('Gegneranalyse öffnen…')
}

function goToSearch() {
  console.log('Charaktersuche öffnen…')
}

const sortedMembers = computed(() => {
  if (!selectedCharacter.value?.members) return []

  return [...selectedCharacter.value.members].sort((a, b) => {
    const aIsRelic = a.currentTier === 13
    const bIsRelic = b.currentTier === 13

    // 1. Relics zuerst
    if (aIsRelic && !bIsRelic) return -1
    if (!aIsRelic && bIsRelic) return 1

    // 2. Wenn beides Relics → nach Relic Tier sortieren
    if (aIsRelic && bIsRelic) {
      const aRel = a.relic?.currentTier || 2
      const bRel = b.relic?.currentTier || 2
      return bRel - aRel
    }

    // 3. Wenn beide Gear → nach Gear absteigend
    return b.currentTier - a.currentTier
  })
})

onMounted(async () => {
  $q.loading.show()
  await playerStore.loadPlayerData()
  await guildStore.loadGuildData()
  $q.loading.hide()
  console.log(guildStore.getGuildData)
  totalMembers.value = guildStore.getGuildData.guild.member.length
  guildUnits.value = playerStore.getPlayerData
  console.log(guildUnits.value)
})
</script>

<style scoped lang="scss">
.page-container {
  min-height: 110vh;
  padding: 32px;
  background: url('/icons/BGTest.PNG') center/cover no-repeat fixed;
  color: #fff;
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
  margin-bottom: 14px;
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
  width: 100%;
  margin-top: 14px;
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
</style>
