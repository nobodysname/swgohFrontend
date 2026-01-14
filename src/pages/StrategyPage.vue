<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div v-if="strategyLoaded" class="header-section text-center q-mb-md">
        <h1 class="text-h4 text-uppercase text-weight-bold glow-text q-my-none mobile-title">
          <q-icon name="public" color="accent" class="q-mr-sm" />
          TW Strategy Board
        </h1>
        <div class="text-caption text-grey-4">Tactical Deployment Plan</div>
      </div>

      <q-dialog v-model="passwordDialog" persistent transition-show="scale" transition-hide="scale">
        <q-card class="glass-card password-card">
          <div class="text-center q-mb-md">
            <q-icon name="lock" size="xl" color="warning" />
            <div class="text-h5 text-uppercase q-mt-sm" style="color: white">Restricted Access</div>
          </div>

          <q-input
            dark
            filled
            v-model="password"
            color="accent"
            type="password"
            label="Security Code"
            class="high-contrast-input q-mb-md"
            autofocus
            @keyup.enter="loadStrategy"
          >
            <template v-slot:prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <div class="row justify-between">
            <q-btn flat label="Abort" color="grey-5" @click="closePasswordDialog" />
            <q-btn
              label="Access Terminal"
              color="accent"
              text-color="black"
              @click="loadStrategy"
            />
          </div>

          <div v-if="error" class="error-msg q-mt-md text-center">
            <q-icon name="warning" class="q-mr-xs" /> {{ error }}
          </div>
        </q-card>
      </q-dialog>

      <div v-if="strategyLoaded" class="strategy-grid">
        <div class="glass-card map-card">
          <div class="card-header">
            <q-icon name="map" color="primary" />
            <span>Battlefield Zones</span>
          </div>

          <div class="map-layout custom-scroll">
            <div class="map-group">
              <div class="group-label">Space</div>
              <div class="zone-row centered-row">
                <div
                  v-for="zone in ['F1', 'F2']"
                  :key="zone"
                  class="zone-tile"
                  :class="{ active: activeZone === zone }"
                  @click="activeZone = zone"
                >
                  <div class="zone-code">{{ zone }}</div>
                  <div class="zone-name">{{ getShortLabel(zone) }}</div>
                </div>
              </div>
            </div>

            <div class="map-group q-mt-md">
              <div class="group-label">Ground</div>
              <div class="ground-scroll-container">
                <div class="ground-grid">
                  <div class="lane-label text-blue-3">TOP</div>
                  <div
                    v-for="zone in ['T1', 'T2', 'T3', 'T4']"
                    :key="zone"
                    class="zone-tile"
                    :class="{ active: activeZone === zone }"
                    @click="activeZone = zone"
                  >
                    <div class="zone-code">{{ zone }}</div>
                  </div>

                  <div class="lane-label text-orange-3">BOT</div>
                  <div
                    v-for="zone in ['B1', 'B2', 'B3', 'B4']"
                    :key="zone"
                    class="zone-tile"
                    :class="{ active: activeZone === zone }"
                    @click="activeZone = zone"
                  >
                    <div class="zone-code">{{ zone }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card editor-card">
          <div class="editor-header row justify-between items-center wrap">
            <div class="col-xs-12 col-sm-auto q-mb-xs-sm q-mb-sm-none">
              <div class="text-caption text-accent text-uppercase text-weight-bold">
                Active Sector
              </div>
              <div class="text-h5 text-white text-weight-bolder header-glow">
                {{ zoneLabels[activeZone] }}
              </div>
            </div>
            <q-chip
              :color="isAdmin ? 'positive' : 'grey-9'"
              text-color="white"
              icon="shield"
              class="self-start"
            >
              {{ isAdmin ? 'Admin Mode' : 'View Only' }}
            </q-chip>
          </div>

          <div class="zone-content custom-scroll">
            <transition-group name="list-anim" tag="div">
              <div
                v-if="zoneRows.length === 0"
                class="empty-state text-center q-pa-lg text-grey-5"
                key="empty"
              >
                <q-icon name="layers_clear" size="md" />
                <div class="q-mt-sm">Keine Befehle für diese Zone.</div>
              </div>

              <div v-for="row in zoneRows" :key="row.rowId" class="strategy-row">
                <div class="row-inputs">
                  <q-input
                    v-model="row.team"
                    label="Team / Flotte"
                    filled
                    dark
                    dense
                    class="high-contrast-input team-input"
                    :readonly="!isAdmin"
                    @blur="saveRow(row)"
                  >
                    <template v-slot:prepend>
                      <q-icon name="groups" size="xs" color="grey-4" />
                    </template>
                  </q-input>

                  <q-input
                    v-model="row.amount"
                    label="Anzahl"
                    filled
                    dark
                    dense
                    class="high-contrast-input amount-input"
                    :readonly="!isAdmin"
                    @blur="saveRow(row)"
                  />

                  <q-input
                    v-model="row.note"
                    label="Anmerkungen / Counter"
                    filled
                    dark
                    dense
                    class="high-contrast-input note-input"
                    :readonly="!isAdmin"
                    @blur="saveRow(row)"
                  />
                </div>

                <q-btn
                  v-if="isAdmin"
                  icon="delete"
                  flat
                  round
                  dense
                  color="red-4"
                  class="delete-btn self-center"
                  @click="deleteRow(row.rowId)"
                >
                  <q-tooltip>Löschen</q-tooltip>
                </q-btn>
              </div>
            </transition-group>
          </div>

          <div v-if="isAdmin" class="editor-footer">
            <q-btn
              icon="add"
              label="Neuer Befehl"
              color="accent"
              text-color="black"
              class="full-width shadow-3 text-weight-bold"
              @click="addRow"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- STATE ---
const passwordDialog = ref(true)
const password = ref('')
const error = ref(null)
const strategyLoaded = ref(false)
const strategy = ref({
  zones: { F1: [], F2: [], T1: [], T2: [], T3: [], T4: [], B1: [], B2: [], B3: [], B4: [] },
}) // Mock Init
const role = ref('viewer')
const activeZone = ref('F1')

// --- DATA DEFINITIONS ---
const zoneLabels = {
  F1: 'Flotten vorne',
  F2: 'Flotten hinten',
  T1: 'Erste Reihe oben',
  T2: 'Zweite Reihe oben',
  T3: 'Coole Teams',
  T4: 'Letzte Reihe mitte',
  B1: 'Erste Reihe unten',
  B2: 'Zweite Reihe unten',
  B3: 'Dritte Reihe unten',
  B4: 'Letzte Reihe unten',
}

const getShortLabel = (zone) => {
  if (zone === 'F1') return 'Vorne'
  if (zone === 'F2') return 'Hinten'
  return ''
}

const isAdmin = computed(() => role.value === 'admin')
const zoneRows = computed(() => strategy.value?.zones?.[activeZone.value] || [])

// --- API ACTIONS (Mock-ready structure) ---
async function loadStrategy() {
  // Simulierter Login für Demo-Zwecke (Falls keine API da ist)
  if (password.value === 'demo') {
    role.value = 'admin'
    strategyLoaded.value = true
    passwordDialog.value = false
    return
  }

  try {
    error.value = null
    const res = await api.get('/strategy/1', {
      headers: { 'x-strategy-password': password.value },
    })
    strategy.value = res.data
    role.value = res.data.role
    passwordDialog.value = false
    strategyLoaded.value = true
  } catch (e) {
    // Fallback für Demo, falls API failt
    if (password.value) e.value = 'Zugriff verweigert (Mock: nutze "demo")'
  }
}

function closePasswordDialog() {
  router.back()
  setTimeout(() => router.push('/'), 100)
}

async function saveRow(row) {
  if (!isAdmin.value) return
  try {
    await api.put(
      `/strategy/row/${row.rowId}`,
      { team: row.team, amount: row.amount, note: row.note },
      { headers: { 'x-strategy-password': password.value } },
    )
  } catch (e) {
    console.error(e)
  }
}

async function addRow() {
  if (!isAdmin.value) return
  // Mock Logic für UI Test
  const newRow = { rowId: Date.now(), team: '', amount: '', note: '' }
  if (!strategy.value.zones[activeZone.value]) strategy.value.zones[activeZone.value] = []
  strategy.value.zones[activeZone.value].push(newRow)

  try {
    const res = await api.post(
      '/strategy/row',
      { zone: activeZone.value, team: '', amount: '', note: '' },
      { headers: { 'x-strategy-password': password.value } },
    )
    // Replace mock with real
    strategy.value.zones[activeZone.value].pop()
    strategy.value.zones[activeZone.value].push(res.data)
  } catch (e) {
    console.error(e)
  }
}

async function deleteRow(rowId) {
  // Optimistic UI update
  strategy.value.zones[activeZone.value] = strategy.value.zones[activeZone.value].filter(
    (r) => r.rowId !== rowId,
  )

  try {
    await api.delete(`/strategy/row/${rowId}`, {
      headers: { 'x-strategy-password': password.value },
    })
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped lang="scss">
/* --- GLOBAL --- */
.page-container {
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(rgba(5, 5, 8, 0.4), rgba(5, 5, 8, 0.9)),
    url('/icons/BGTest.webp') center/cover no-repeat fixed;
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif;

  /* Wichtig für Mobile: Kein Overflow Hidden auf Body-Level */
  overflow-x: hidden;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;

  /* Desktop: Feste Höhe für App-Feeling */
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.glow-text {
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.3),
    0 0 20px rgba(79, 195, 247, 0.2);
  letter-spacing: 2px;
}

/* --- GLASS CARD SHARED --- */
.glass-card {
  background: rgba(20, 20, 26, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
  color: #90caf9;
  font-weight: 800;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
}

/* --- PASSWORD DIALOG --- */
.password-card {
  padding: 30px;
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--q-warning);
}
.error-msg {
  color: #ff6b6b;
  font-weight: bold;
  background: rgba(255, 0, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
}

/* --- MAIN GRID LAYOUT --- */
.strategy-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 340px 1fr; /* Etwas breiter für die Map */
  gap: 20px;
  min-height: 0; /* Wichtig für Nested Scroll */
  max-height: 70%;
}

/* --- LEFT: MAP PANEL --- */
.map-card {
  overflow: hidden; /* Header bleibt, Content scrollt */
}

.map-layout {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.map-group {
  margin-bottom: 24px;
}

.group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #aaa;
  font-weight: bold;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.zone-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap; /* Erlaubt Umbruch wenn nötig */
}
.centered-row {
  justify-content: center;
}

/* Ground Grid Container - für horizontales Scrollen auf Mobile */
.ground-scroll-container {
  width: 100%;
}

.ground-grid {
  display: grid;
  grid-template-columns: auto repeat(4, 1fr);
  gap: 8px;
  align-items: center;
}

.lane-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 0.75rem;
  font-weight: 900;
  text-align: center;
  letter-spacing: 2px;
  padding: 5px 0;
}

/* Zone Tile Styling */
.zone-tile {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px; /* Mindestbreite */
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.active {
    background: rgba(79, 195, 247, 0.25);
    border-color: var(--q-accent);
    box-shadow: 0 0 15px rgba(79, 195, 247, 0.2);
    transform: scale(1.02);
  }
}

.zone-code {
  font-weight: 900;
  font-size: 1.1rem;
  color: #fff;
}
.zone-name {
  font-size: 0.7rem;
  color: #ccc;
  font-weight: 500;
  white-space: nowrap;
}
.active .zone-code,
.active .zone-name {
  color: var(--q-accent);
}

/* --- RIGHT: EDITOR PANEL --- */
.editor-card {
  overflow: hidden;
}

.editor-header {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 80px;
}
.header-glow {
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  word-break: break-word; /* Verhindert Überlauf langer Namen */
  line-height: 1.2;
}

.zone-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Custom Scrollbar */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px; /* Für horizontalen Scroll */
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

/* Strategy Rows */
.strategy-row {
  display: flex;
  align-items: stretch; /* Dehnt Inhalt vertikal */
  gap: 12px;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: transform 0.2s;
}

.row-inputs {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 0.8fr 3fr;
  gap: 12px;
}

.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__control) {
  background: transparent;
}
.high-contrast-input :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.7) !important;
}
.high-contrast-input :deep(.q-field__native) {
  color: #ffffff !important;
}
.high-contrast-input :deep(.q-field--focused .q-field__control) {
  border-color: var(--q-accent);
  background: rgba(0, 0, 0, 0.5);
}

.editor-footer {
  padding: 16px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* --- ANIMATIONS --- */
.list-anim-move,
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.4s ease;
}
.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.list-anim-leave-active {
  position: absolute;
}

/* ========================================= */
/* === RESPONSIVE BREAKPOINTS (Mobile) === */
/* ========================================= */

@media (max-width: 959px) {
  /* Layout Switch: Von Grid zu Stacked */
  .page-container {
    padding: 10px; /* Weniger Padding am Rand */
    height: auto; /* Höhe freigeben */
  }

  .content-wrapper {
    height: auto; /* Scrollen auf Body-Ebene erlauben */
    display: block;
  }

  .strategy-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Karte anpassen */
  .map-card {
    max-height: none;
    overflow: visible;
  }

  /* Horizontaler Scroll für Ground Map auf Mobile */
  .ground-scroll-container {
    overflow-x: auto;
    padding-bottom: 10px; /* Platz für Scrollbar */
  }

  .ground-grid {
    min-width: 400px; /* Stellt sicher, dass Grid nicht kollabiert */
    padding-right: 5px;
  }

  /* Editor Bereich */
  .editor-card {
    height: auto;
    min-height: 400px;
  }

  .zone-content {
    max-height: 60vh; /* Verhindert unendliches Wachstum */
  }

  /* Inputs stapeln sich auf Tablet/Mobile */
  .row-inputs {
    grid-template-columns: 1fr; /* Alles untereinander */
    gap: 16px;
  }

  .strategy-row {
    flex-direction: column; /* Delete Button unter die Inputs */
  }

  .delete-btn {
    align-self: flex-end; /* Rechtsbündig */
    margin-top: -10px;
  }

  /* Font Anpassungen */
  .mobile-title {
    font-size: 1.8rem;
    line-height: 1.2;
    margin-bottom: 5px;
  }

  .editor-header h5 {
    font-size: 1.25rem;
  }
}

/* Kleine Smartphones Tweaks */
@media (max-width: 400px) {
  .zone-tile {
    padding: 8px 2px;
  }
  .zone-code {
    font-size: 1rem;
  }
}
</style>
