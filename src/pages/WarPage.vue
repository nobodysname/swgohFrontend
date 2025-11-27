<template>
  <q-page class="page-container"> </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { usePlayerStore } from 'src/stores/PlayerStore'
import { useQuasar } from 'quasar'

const playerStore = usePlayerStore()
const playerData = ref()
const $q = useQuasar()

onMounted(async () => {
  $q.loading.show()
  await playerStore.loadPlayerData()
  $q.loading.hide()
  playerData.value = playerStore.getPlayerData
  console.log(playerData.value)
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
</style>
