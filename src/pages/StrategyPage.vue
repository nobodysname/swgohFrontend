<template>
  <q-page class="strategy-page">
    <h1 v-if="strategyLoaded" class="title">Territory War Strategy</h1>

    <!-- PASSWORD DIALOG -->
    <q-dialog v-model="passwordDialog" persistent>
      <q-card class="password-card">
        <h3 style="font-size: 1.7rem">Enter Password</h3>

        <q-input
          dark
          v-model="password"
          color="white"
          type="password"
          filled
          label="Password"
          autofocus
        />

        <div class="dialog-actions">
          <q-btn
            label="Unlock"
            style="color: black !important"
            color="yellow"
            @click="loadStrategy"
          />

          <q-btn label="Close" flat color="grey-4" @click="closePasswordDialog" />
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </q-card>
    </q-dialog>

    <!-- MAIN CONTENT -->
    <div v-if="strategyLoaded" class="strategy-layout">
      <!-- LEFT: MAP -->
      <div class="map-panel">
        <div
          v-for="zone in zones"
          :key="zone"
          class="zone-tile"
          :class="{ active: activeZone === zone }"
          @click="activeZone = zone"
        >
          <div class="zone-label">{{ zoneLabels[zone] }}</div>
        </div>
      </div>

      <!-- RIGHT: ZONE EDITOR -->
      <div class="zone-panel">
        <div class="zone-header">
          <h2 style="font-size: 1.7rem">{{ zoneLabels[activeZone] }}</h2>
          <q-btn icon="close" flat round color="grey-4" @click="closePasswordDialog" />
        </div>

        <!-- SCROLL CONTAINER -->
        <div class="zone-rows-scroll">
          <div v-for="row in zoneRows" :key="row.rowId" class="zone-row">
            <q-input
              v-model="row.team"
              label="Team"
              filled
              dense
              :readonly="!isAdmin"
              @blur="saveRow(row)"
            />

            <q-input
              v-model="row.amount"
              label="Amount"
              filled
              dense
              :readonly="!isAdmin"
              @blur="saveRow(row)"
            />

            <q-input
              v-model="row.note"
              label="Notes"
              filled
              dense
              :readonly="!isAdmin"
              @blur="saveRow(row)"
            />

            <q-btn
              v-if="isAdmin"
              icon="delete"
              flat
              round
              color="red"
              class="delete-btn"
              @click="deleteRow(row.rowId)"
            />
          </div>
        </div>

        <!-- ➕ ADD ROW -->
        <q-btn
          v-if="isAdmin"
          icon="add"
          label="Add row"
          color="yellow"
          class="add-row-btn"
          @click="addRow"
          style="color: black !important"
        />

        <div class="hint" v-if="!isAdmin">🔒 Read-only mode</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const passwordDialog = ref(true)
const password = ref('')
const error = ref(null)

const strategyLoaded = ref(false)
const strategy = ref(null)

const activeZone = ref('F1')

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

const zones = ['T1', 'B1', 'T2', 'B2', 'T3', 'B3', 'T4', 'B4', 'F1', 'F2']

const role = ref('viewer')

const isAdmin = computed(() => role.value === 'admin')

async function loadStrategy() {
  try {
    const res = await api.get('/strategy/1', {
      headers: { 'x-strategy-password': password.value },
    })

    console.log('STRATEGY RESPONSE:', res.data)

    strategy.value = res.data
    role.value = res.data.role // <- MUSS "admin" sein
    passwordDialog.value = false
    strategyLoaded.value = true
  } catch (e) {
    e
    error.value = 'Invalid password'
  }
}

const zoneRows = computed(() => {
  if (!strategy.value) return []
  return strategy.value.zones[activeZone.value] || []
})

function closePasswordDialog() {
  router.back()
  router.push('/war')
}

async function saveRow(row) {
  if (!isAdmin.value) return

  await api.put(
    `/strategy/row/${row.rowId}`,
    {
      team: row.team,
      amount: row.amount,
      note: row.note,
    },
    {
      headers: {
        'x-strategy-password': password.value,
      },
    },
  )
}

async function addRow() {
  if (!isAdmin.value) return

  const res = await api.post(
    '/strategy/row',
    {
      zone: activeZone.value,
      team: '',
      amount: '',
      note: '',
    },
    {
      headers: {
        'x-strategy-password': password.value,
      },
    },
  )

  // neue Zeile lokal anhängen
  strategy.value.zones[activeZone.value].push(res.data)
}

async function deleteRow(rowId) {
  await api.delete(`/strategy/row/${rowId}`, {
    headers: {
      'x-strategy-password': password.value,
    },
  })

  strategy.value.zones[activeZone.value] = strategy.value.zones[activeZone.value].filter(
    (r) => r.rowId !== rowId,
  )
}
</script>

<style scoped>
.strategy-page {
  max-height: 100%; /* 🔥 entscheidend */
  overflow: hidden; /* Scroll NICHT hier */
  padding: 20px;
  color: #ffe81f;
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
}

.strategy-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('/icons/BGTest.webp') center / cover no-repeat;
  filter: blur(4px);
  z-index: -1;
}

.title {
  text-align: center;
}

/* =========================
   LAYOUT
   ========================= */

.strategy-layout {
  flex: 1; /* nimmt Resthöhe der Page */
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  min-height: 0; /* 🔥 extrem wichtig */
}

.map-panel {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.strategy-layout,
.map-panel,
.zone-panel {
  pointer-events: auto;
}

/* =========================
   ZONE TILES (LEFT)
   ========================= */

.zone-tile {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 232, 31, 0.35);
  border-radius: 12px;
  padding: 22px;
  text-align: center;
  cursor: pointer;

  font-size: 1.1rem;
  font-weight: 600;
  color: #ffe81f;

  backdrop-filter: blur(6px);
  transition: 0.15s ease;
}

.zone-tile:hover {
  background: rgba(255, 255, 255, 0.15);
}

.zone-tile.active {
  background: rgba(255, 232, 31, 0.25);
  color: #e0e0e0;
}

.zone-label {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-top: 4px;
}

/* =========================
   RIGHT PANEL
   ========================= */

.zone-panel {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 232, 31, 0.35);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
  min-height: 0; /* 🔥 */
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

/* =========================
   SCROLL AREA
   ========================= */

.zone-rows-scroll {
  flex: 1;
  min-height: 0; /* 🔥 */
  overflow-y: auto;
  padding-right: 6px;
  -webkit-overflow-scrolling: touch;
}

/* Scrollbar */
.zone-rows-scroll::-webkit-scrollbar {
  width: 6px;
}

.zone-rows-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 232, 31, 0.5);
  border-radius: 4px;
}

/* =========================
   ZONE ROWS
   ========================= */

.zone-row {
  position: relative;
  display: grid;
  grid-template-columns: 2fr 1fr 3fr auto;
  gap: 12px;

  padding: 14px;
  margin-bottom: 12px;

  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.zone-row :deep(.q-field__native) {
  color: #ffffff !important;
}

.zone-row :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.7) !important;
}

.zone-row :deep(.q-field--readonly) {
  opacity: 0.8;
}

.delete-btn {
  align-self: center;
  opacity: 0.85;
}

.delete-btn:hover {
  opacity: 1;
}

/* =========================
   ADD ROW BUTTON
   ========================= */

.add-row-btn {
  position: sticky;
  bottom: 0;
  margin-top: 12px;
  padding-top: 10px;

  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0));

  z-index: 10;
}

/* =========================
   PASSWORD DIALOG
   ========================= */

.password-card {
  padding: 30px;
  width: 420px;
  border-radius: 18px;

  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 232, 31, 0.4);

  backdrop-filter: blur(12px);
  color: #ffe81f;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.zone-header h2 {
  line-height: 1.15;
  margin: 0;
  word-break: break-word;
}

.zone-rows-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.error {
  color: #ff6666;
  margin-top: 10px;
}

.hint {
  margin-top: 12px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
}

/* =========================
   RESPONSIVE
   ========================= */

@media (max-width: 1024px) {
  .strategy-layout {
    grid-template-columns: 1fr;
  }

  .map-panel {
    grid-template-columns: repeat(5, minmax(140px, 1fr));
    overflow-x: auto;
    padding-bottom: 10px;
  }

  .zone-panel {
    height: auto;
  }

  .zone-rows-scroll {
    max-height: 60vh;
  }
}

@media (max-width: 600px) {
  .strategy-layout {
    grid-template-columns: 1fr;
  }

  .map-panel {
    display: flex;
    gap: 10px;
    overflow-x: auto;
  }
}

@media (max-width: 600px) {
  .map-panel {
    display: flex;
    gap: 10px;
    overflow-x: auto;
  }
  .title {
    font-size: 3.6rem;
  }

  .zone-panel {
    height: auto;
    max-height: calc(100vh - 120px); /* Platz für Header + Tabs */
  }

  .zone-rows-scroll {
    max-height: calc(100vh - 260px); /* Header + Add Button */
  }

  .zone-tile {
    min-width: 140px;
    padding: 14px 10px;
    font-size: 0.6rem;
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
}
</style>
