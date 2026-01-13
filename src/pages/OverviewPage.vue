<template>
  <q-page class="page-container">
    <div v-if="guildData" class="content-wrapper">
      <div class="header-section text-center q-mb-lg">
        <h1 class="text-h3 text-weight-bold q-my-none text-uppercase glow-text">
          {{ guildData.profile?.name }}
        </h1>

        <div class="milestone-container q-mt-md">
          <div class="row justify-between text-caption text-grey-4 q-mb-xs">
            <span
              >Current:
              {{ (Number(guildData.profile?.guildGalacticPower) / 1000000).toFixed(1) }}M</span
            >
            <span class="text-cyan-4 text-weight-bold"
              >Next Goal: {{ (nextMilestone / 1000000).toFixed(0) }}M</span
            >
          </div>
          <q-linear-progress
            size="10px"
            :value="milestoneProgress"
            color="cyan-4"
            track-color="dark"
            class="milestone-bar shadow-2"
            rounded
          />
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="glass-card member-card">
          <div class="card-header">
            <q-icon name="groups" size="sm" color="primary" />
            <span>Membership</span>
          </div>
          <div class="row items-center justify-around full-height">
            <div class="circle-wrapper">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path
                  class="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="circle"
                  :stroke-dasharray="memberPercentage + ', 100'"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" class="percentage-text">{{ memberPercentage }}%</text>
              </svg>
            </div>
            <div class="column text-right">
              <div class="stat-group">
                <div class="label text-grey-5">Members</div>
                <div class="value text-h5">
                  {{ guildData.member?.length }}<span class="text-grey-6 text-body1">/50</span>
                </div>
              </div>
              <div class="stat-group q-mt-md">
                <div class="label text-grey-5">Avg. GP</div>
                <div class="value text-h6 text-cyan-4 font-mono">{{ formatGP(averageGP) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card tw-card">
          <div class="card-header">
            <q-icon name="military_tech" size="sm" color="negative" />
            <span>War Performance</span>
          </div>
          <div class="tw-stats-container">
            <div class="win-rate-box">
              <div
                class="text-h3 text-weight-bolder"
                :class="winRate > 50 ? 'text-positive' : 'text-negative'"
              >
                {{ winRate }}%
              </div>
              <div class="text-caption text-uppercase text-grey-5">
                Win Rate (Last {{ totalWars }})
              </div>
            </div>
            <div class="tw-history-list">
              <div
                v-for="(w, index) in sortedTerritoryWars.slice(0, 5)"
                :key="index"
                class="tw-mini-row"
              >
                <div class="tw-indicator" :class="w.isWin ? 'bg-positive' : 'bg-negative'"></div>
                <div class="tw-score">
                  <span :class="w.isWin ? 'text-green-3' : 'text-red-3'">{{ w.score }}</span>
                  <span class="text-grey-6"> vs </span>
                  <span class="text-grey-5">{{ w.opponentScore }}</span>
                </div>
                <div class="tw-date text-grey-6">{{ formatDate(w.endTimeSeconds) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card ranking-card" style="grid-row: span 2">
          <div class="card-header">
            <q-icon name="emoji_events" size="sm" color="warning" />
            <span>Top 5 Galactic Power</span>
          </div>
          <div class="ranking-list q-mt-sm">
            <div v-for="(m, index) in topMembers" :key="m.playerId" class="rank-item">
              <div class="rank-pos">
                <q-icon v-if="index === 0" name="military_tech" color="yellow-8" size="sm" />
                <q-icon v-else-if="index === 1" name="military_tech" color="grey-5" size="sm" />
                <q-icon v-else-if="index === 2" name="military_tech" color="brown-5" size="sm" />
                <span v-else class="text-grey-6">#{{ index + 1 }}</span>
              </div>
              <div class="rank-name text-weight-medium">{{ m.playerName }}</div>
              <div class="rank-gp text-accent font-mono text-cyan-4">
                {{ formatGP(m.galacticPower) }}
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card composition-card">
          <div class="card-header">
            <q-icon name="bar_chart" size="sm" color="secondary" />
            <span>Roster Depth</span>
          </div>
          <div class="composition-list full-height column justify-center">
            <div v-for="range in rosterComposition" :key="range.label" class="comp-row q-mb-sm">
              <div class="row justify-between text-caption q-mb-xs">
                <span>{{ range.label }}</span>
                <span class="text-weight-bold"
                  >{{ range.count }}
                  <span class="text-grey-6">/ {{ guildData.member?.length }}</span></span
                >
              </div>
              <q-linear-progress
                :value="range.count / guildData.member?.length"
                color="secondary"
                track-color="dark"
                class="comp-bar"
                rounded
              />
            </div>
          </div>
        </div>

        <div class="glass-card event-card">
          <div class="card-header">
            <q-icon name="stars" size="sm" color="info" />
            <span>Latest TB Stars</span>
          </div>
          <div class="row items-center justify-center full-height">
            <div v-if="lastEventStars" class="text-center">
              <div class="text-h2 text-warning glow-text">{{ lastEventStars }}</div>
              <div class="text-caption text-grey-4">Stars Collected</div>
            </div>
            <div v-else class="text-grey-6 text-center">No recent event data</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="absolute-center">
      <q-spinner-orbit color="accent" size="4em" />
    </div>
  </q-page>
</template>

<script setup>
import { useGuildStore } from 'src/stores/GuildStore'
import { onMounted, ref, computed } from 'vue'
import { date } from 'quasar'

const guildStore = useGuildStore()
const guildData = ref(null)

onMounted(async () => {
  await guildStore.loadGuildData()
  guildData.value = guildStore.getGuildData.guild
})

// --- FORMATTING HELPERS ---
const formatGP = (val) => {
  if (!val) return '0'
  return Number(val).toLocaleString('de-DE')
}

const formatDate = (seconds) => {
  return date.formatDate(seconds * 1000, 'DD.MM')
}

// --- COMPUTED STATS ---

const memberPercentage = computed(() => {
  if (!guildData.value?.member) return 0
  return Math.round((guildData.value.member.length / 50) * 100)
})

const averageGP = computed(() => {
  if (!guildData.value?.profile?.guildGalacticPower || !guildData.value?.member?.length) return 0
  return Math.floor(guildData.value.profile.guildGalacticPower / guildData.value.member.length)
})

const topMembers = computed(() => {
  if (!guildData.value?.member) return []
  return [...guildData.value.member]
    .sort((a, b) => Number(b.galacticPower) - Number(a.galacticPower))
    .slice(0, 10)
})

// --- NEU: Roster Composition Logic ---
const rosterComposition = computed(() => {
  if (!guildData.value?.member) return []
  const members = guildData.value.member

  // Definiere die Bereiche (Buckets)
  const buckets = [
    { label: '11M+ GP', min: 11000000, count: 0 },
    { label: '9M - 11M GP', min: 9000000, max: 11000000, count: 0 },
    { label: '7M - 9M GP', min: 7000000, max: 9000000, count: 0 },
    { label: '< 7M GP', max: 7000000, count: 0 },
  ]

  members.forEach((m) => {
    const gp = Number(m.galacticPower)
    for (const bucket of buckets) {
      if (
        (bucket.min === undefined || gp >= bucket.min) &&
        (bucket.max === undefined || gp < bucket.max)
      ) {
        bucket.count++
        break
      }
    }
  })
  return buckets
})

// --- NEU: Milestone Logic ---
const nextMilestone = computed(() => {
  const current = Number(guildData.value?.profile?.guildGalacticPower || 0)
  // Berechnet das nächste Vielfache von 50.000.000 (50 Mio)
  const step = 50000000
  return Math.ceil((current + 1) / step) * step
})

const milestoneProgress = computed(() => {
  const current = Number(guildData.value?.profile?.guildGalacticPower || 0)
  const step = 50000000
  const previousMilestone = Math.floor(current / step) * step

  // Fortschritt innerhalb des aktuellen 50Mio Blocks
  return (current - previousMilestone) / step
})

// Territory War Logic
const sortedTerritoryWars = computed(() => {
  if (!guildData.value?.recentTerritoryWarResult) return []

  return [...guildData.value.recentTerritoryWarResult]
    .sort((a, b) => b.endTimeSeconds - a.endTimeSeconds)
    .map((war) => ({
      ...war,
      score: Number(war.score),
      opponentScore: Number(war.opponentScore),
      isWin: Number(war.score) > Number(war.opponentScore),
    }))
})

const totalWars = computed(() => sortedTerritoryWars.value.length)

const winRate = computed(() => {
  const wars = sortedTerritoryWars.value
  if (!wars.length) return 0
  const wins = wars.filter((w) => w.isWin).length
  return Math.round((wins / wars.length) * 100)
})

// Raid Logic
const lastEventStars = computed(() => {
  const events = guildData.value?.profile?.guildEventTracker
  if (!events || events.length === 0) return null
  return events[0].completedStars
})
</script>

<style scoped lang="scss">
/* Unveränderter Style Block */
.page-container {
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(rgba(10, 10, 14, 0), rgba(10, 10, 14, 0.781)),
    url('/icons/BGTest.webp') center/cover no-repeat fixed;
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  .status-message {
    font-size: 1.1rem;
    font-style: italic;
    color: #b0b0b0;
    background: rgba(0, 0, 0, 0.3);
    display: inline-block;
    padding: 8px 24px;
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.milestone-container {
  max-width: 500px;
  margin: 20px auto 0;
}

.milestone-bar {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
}

.glow-text {
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(79, 195, 247, 0.2);
  letter-spacing: 2px;
}

.border-accent {
  border: 1px solid var(--q-accent);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 24px;
}

.member-card {
  grid-column: span 1;
}
.ranking-card {
  grid-column: span 1;
  grid-row: span 2;
}
.tw-card {
  grid-column: span 1;
}
.composition-card {
  grid-column: span 1;
}
.event-card {
  grid-column: span 1;
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .ranking-card {
    grid-column: span 1;
    grid-row: span 2;
    order: 2;
  }
  .member-card {
    order: 1;
  }
  .tw-card {
    order: 3;
  }
  .composition-card {
    order: 4;
  }
  .event-card {
    order: 5;
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .ranking-card {
    grid-row: auto;
  }
  .event-card {
    grid-column: span 1;
  }
}

.glass-card {
  background: rgba(30, 30, 35, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  color: #90caf9;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
}

.composition-list {
  padding: 0 10px;
}
.comp-bar {
  opacity: 0.9;
}

.circle-wrapper {
  width: 100px;
  height: 100px;
}
.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 80%;
  max-height: 250px;
}
.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.05);
  stroke-width: 3.8;
}
.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke: var(--q-accent);
  filter: drop-shadow(0 0 3px var(--q-accent));
  animation: progress 1s ease-out forwards;
}
.percentage-text {
  fill: #fff;
  font-family: sans-serif;
  font-weight: bold;
  font-size: 0.6em;
  text-anchor: middle;
}

.tw-stats-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.win-rate-box {
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.tw-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tw-mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.tw-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
.font-mono {
  font-family: 'Roboto Mono', monospace;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rank-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid transparent;
  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
  }
}
.rank-pos {
  width: 30px;
  display: flex;
  justify-content: center;
}
.rank-name {
  flex-grow: 1;
  margin-left: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rank-gp {
  font-size: 0.95rem;
}

/* Rank Tabs */
.rank-tabs {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 2px;
}

.list-anim-move,
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.4s ease;
}
.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-anim-leave-active {
  position: absolute;
  width: 100%;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0 100;
  }
}
</style>
