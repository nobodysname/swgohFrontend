<template>
  <q-page class="p-6 starwars-bg">
    <div class="max-w-5xl mx-auto space-y-8 text-white">
      <h1 class="text-4xl font-bold text-center mb-6 starwars-title">Charakter-Übersicht</h1>

      <div class="flex gap-4 justify-end mb-6">
        <q-btn color="primary" label="Gegneranalyse" @click="goToOpponent" />
        <q-btn color="secondary" label="Charakter suchen" @click="goToSearch" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div
          v-for="item in characterStats"
          :key="item.name"
          class="bg-black/40 border border-yellow-500 rounded-xl p-4 hover:bg-black/60 cursor-pointer"
          @click="openDialog(item)"
        >
          <h2 class="text-xl font-semibold mb-2">{{ item.name }}</h2>
          <p class="opacity-80">Freigeschaltet: {{ item.count }} / {{ totalMembers }}</p>
        </div>
      </div>
    </div>

    <q-dialog v-model="dialogOpen">
      <q-card
        class="bg-black text-white p-4 w-96 max-h-[80vh] overflow-y-auto border border-yellow-500"
      >
        <h2 class="text-2xl font-semibold mb-4">{{ selectedCharacter?.name }}</h2>
        <div
          v-for="m in selectedCharacter?.members"
          :key="m.name"
          class="flex justify-between py-1 border-b border-yellow-600/30"
        >
          <span>{{ m.name }}</span>
          <span>{{ m.level }}</span>
        </div>
        <q-btn class="mt-4" color="primary" label="Schließen" @click="dialogOpen = false" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useDataStore } from 'src/stores/DataStore'
import { onMounted, ref, computed } from 'vue'
import { usePlayerStore } from 'src/stores/PlayerStore'

const dataStore = useDataStore()
const $q = useQuasar()
const dataData = ref([])
const playerStore = usePlayerStore()
const players = computed(() => playerStore.getPlayerData)

const totalMembers = computed(() => players.value.length)

const targetCharacters = [
  'Supreme Leader Kylo Ren',
  'Rey',
  'Jedi Master Luke',
  'Sith Eternal Emperor',
  'Jedi Master Kenobi',
  'Lord Vader',
  'Jabba',
  'Leia',
  'Ahsoka Tano',
  'Piratking Hondo Onaka',
  'Leviathan',
  'Executor',
  'Profundity',
]

const characterStats = computed(() => {
  return targetCharacters.map((name) => {
    const members = []

    players.value.forEach((p) => {
      const unit = p.units?.find((u) => u.name === name)
      if (unit) {
        members.push({
          name: p.name,
          level: unit.power || unit.level || 0,
        })
      }
    })

    return {
      name,
      count: members.length,
      members: members.sort((a, b) => b.level - a.level),
    }
  })
})

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

onMounted(async () => {
  $q.loading.show()
  await dataStore.loadDataData()
  $q.loading.hide()
  dataData.value = dataStore.getDataData
  console.log(dataData.value)
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  background: url('./public/icons/BGTest.PNG') center/cover no-repeat fixed;
  color: #eee;
  min-height: 100vh;

  > * {
    backdrop-filter: blur(4px);
    background: #1a1a1aa4;
  }
}
.starwars-title {
  font-family: 'Star Jedi', sans-serif;
  letter-spacing: 2px;
  color: #ffe81f;
  text-shadow: 0 0 10px #ffe81f;
}

.starwars-bg {
  background: url('/assets/BGTest-PNG') center/cover no-repeat fixed;
}
</style>
