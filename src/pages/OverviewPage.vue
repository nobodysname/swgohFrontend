<template>
  <q-page class="page-container" v-if="guildData">
    <div class="overview-grid">
      <div class="overview-card">
        <div class="circle-wrapper">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path
              class="circle-bg"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="circle"
              :stroke-dasharray="memberPercentage + ', 100'"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" class="percentage-text">{{ memberPercentage }}%</text>
          </svg>
        </div>
        <div class="stats-text">
          <div class="stat-label">Members</div>
          <div class="stat-value">{{ guildData.member.length }}/50</div>
          <div class="stat-label">Total GP</div>
          <div class="stat-value">
            {{
              guildData.profile.guildGalacticPower.substring(0, 3) +
              '.' +
              guildData.profile.guildGalacticPower.substring(3, 6) +
              '.' +
              guildData.profile.guildGalacticPower.substring(6, 9)
            }}
          </div>
        </div>
      </div>

      <div class="ranking-card">
        <h2>Top 5 Members (Galactic Power)</h2>
        <div v-for="m in topMembers" :key="m.playerId" class="rank-item">
          <span>{{ m.playerName }}</span>
          <span>{{ Number(m.galacticPower).toLocaleString() }}</span>
        </div>
      </div>
    </div>
    <!--
    <div class="section">
      <h2>Recent Territory Battles</h2>
      <div v-if="guildData.recentTerritoryWarResult?.length === 0" class="empty-text">
        No Territory Battle data available.
      </div>
      <div v-for="b in guildData.recentTerritoryWarResult || []" :key="b.id" class="info-row">
        <span>{{ b.name }}</span>
        <span>{{ b.result }}</span>
      </div>
    </div>
  -->
    <div class="section">
      <h2>Recent Territory Wars</h2>
      <div v-if="guildData.recentTerritoryWarResult.length === 0" class="empty-text">
        No Territory War data available.
      </div>
      <div class="info-row">
        <span><strong>Win/Loss</strong></span>
        <span><strong>Guild Score</strong></span>
        <span><strong>Opponent Score</strong></span>
        <span><strong>Guild GP</strong></span>
      </div>
      <div v-for="w in guildData.recentTerritoryWarResult" :key="w.territoryWarId" class="info-row">
        <span> {{ w.score - w.opponentScore > 0 ? 'Win' : 'Loss' }} </span>
        <span>{{ w.score }}</span>
        <span>{{ w.opponentScore }}</span>
        <span>{{
          String(w.power).substring(0, 3) +
          '.' +
          String(w.power).substring(3, 6) +
          '.' +
          String(w.power).substring(6, 9)
        }}</span>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useGuildStore } from 'src/stores/GuildStore'
import { onMounted, ref, computed } from 'vue'

const guildStore = useGuildStore()

const guildData = ref()

onMounted(async () => {
  await guildStore.loadGuildData()
  guildData.value = guildStore.getGuildData.guild
})

const memberPercentage = computed(() => {
  if (!guildData.value) return 0
  return Math.round((guildData.value.member.length / 50) * 100)
})

const topMembers = computed(() => {
  return [...guildData.value.member]
    .sort((a, b) => Number(b.galacticPower) - Number(a.galacticPower))
    .slice(0, 5)
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  background: url('/icons/BGTest.webp') center/cover no-repeat fixed;
  color: #eee;
  min-height: 100vh;
}

.overview-card,
.ranking-card,
.section {
  backdrop-filter: blur(4px);
  background: #1a1a1aa4;
}

/* --- GRID --- */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 20px;
  margin-bottom: 40px;
}

/* RESPONSIVE Breakpoints */
@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns: 1fr; /* 1 Spalte */
  }

  .overview-card,
  .ranking-card {
    flex-direction: column;
    text-align: center;
  }

  .circle-wrapper {
    margin: 0 auto;
  }
}

/* --- Cards --- */
.overview-card {
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #333;
}

.ranking-card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #333;
}

/* --- Circle --- */
.circle-wrapper {
  width: clamp(100px, 25vw, 140px);
  height: clamp(100px, 25vw, 140px);
}

.circular-chart {
  width: 100%;
  height: 100%;
  fill: none;
}

.circle-bg {
  stroke: #333;
  stroke-width: 3.8;
}

.circle {
  stroke: #f5d742;
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}

.percentage-text {
  fill: #f5d742;
  font-size: 0.5em;
  text-anchor: middle;
}

/* --- Text --- */
.stats-text {
  display: flex;
  flex-direction: column;
  font-size: 1rem;
}

.stat-label {
  opacity: 0.7;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

/* --- Ranking --- */
.rank-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #333;
}

@media (max-width: 550px) {
  .rank-item {
    font-size: 0.9rem;
  }
}

/* --- Section --- */
.section {
  margin-top: 40px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #333;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px 0;
  border-bottom: 1px solid #333;
  text-align: center;
}

@media (max-width: 800px) {
  .info-row {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 8px;
  }
}

.empty-text {
  opacity: 0.6;
  padding: 10px 0;
}
</style>

<style scoped>
.bg-dark {
  background: radial-gradient(circle at center, #0c0c10, #000000);
}
</style>
