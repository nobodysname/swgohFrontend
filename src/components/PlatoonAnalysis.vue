<template>
  <div class="priority-section">
    <div class="header-row">
      <div>
        <h2 class="subtitle">Priority Farming List</h2>
      </div>

      <div class="controls">
        <q-input
          v-model="search"
          dense
          filled
          dark
          label="Search unit..."
          class="search-input"
          color="yellow"
        >
          <template v-slot:append>
            <q-icon name="search" color="yellow" />
          </template>
        </q-input>

        <q-select
          v-model="phaseFilter"
          dense
          filled
          dark
          :options="phaseOptions"
          label="Phase Filter"
          class="filter-select"
          emit-value
          map-options
          color="yellow"
          clearable
        />
      </div>
    </div>

    <q-table
      class="prio-table"
      flat
      dark
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      :pagination="{ rowsPerPage: 15 }"
      :rows-per-page-options="[15, 30, 50, 0]"
      virtual-scroll
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props" class="custom-head">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>

      <template #body-cell-unit="props">
        <q-td :props="props">
          <div class="unit-wrapper">
            <span class="unit-name">{{ props.row.name }}</span>
            <q-badge :class="getRelicClass(props.row.relic)" class="relic-badge" rounded>
              R{{ props.row.relic }}
            </q-badge>
          </div>
        </q-td>
      </template>

      <template #body-cell-count="props">
        <q-td :props="props">
          <div class="count-badge">{{ props.row.count }}x</div>
        </q-td>
      </template>

      <template #body-cell-locations="props">
        <q-td :props="props" class="loc-cell">
          <div class="loc-wrapper">
            <q-badge
              v-for="(loc, i) in props.row.locations"
              :key="i"
              text-color="yellow"
              outline
              dark
              class="loc-badge"
            >
              {{ loc }}
            </q-badge>
          </div>
        </q-td>
      </template>

      <template #body-cell-score="props">
        <q-td :props="props">
          <span class="score-val">{{ formatNumber(props.row.score) }}</span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  analysis: { type: Object, required: true },
})

const search = ref('')
const phaseFilter = ref(null)

// 1. Flatten Data: Wandelt die Phasen-Struktur in eine flache Tabellen-Liste um
const flatPriorityList = computed(() => {
  // Erwarte Struktur: analysis.priorityList = [{ phase: 1, units: [...] }, ...]
  const groupedList = props.analysis.priorityList || []
  const rows = []

  groupedList.forEach((group) => {
    if (group.units) {
      group.units.forEach((u, index) => {
        rows.push({
          id: `${group.phase}_${u.name}_${u.relic}_${index}`,
          phase: group.phase,
          name: u.name,
          relic: u.relic,
          count: u.totalCount,
          score: u.score,
          locations: u.locations || [], // Array von Strings
        })
      })
    }
  })

  return rows
})

// 2. Filter & Sort Logic
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()

  return flatPriorityList.value.filter((row) => {
    // Phase Filter
    if (phaseFilter.value && row.phase !== phaseFilter.value) return false

    // Search Filter
    if (q) {
      const inName = row.name.toLowerCase().includes(q)
      const inLoc = row.locations.some((l) => l.toLowerCase().includes(q))
      if (!inName && !inLoc) return false
    }

    return true
  })
})

// 3. Columns Definition
const columns = [
  {
    name: 'phase',
    label: 'Phase',
    field: 'phase',
    sortable: true,
    align: 'center',
    style: 'width: 80px; font-weight: bold; color: #ffe81f;',
  },
  {
    name: 'unit',
    label: 'Unit Requirement',
    field: 'name',
    sortable: true,
    align: 'left',
  },
  {
    name: 'count',
    label: 'Missing Qty',
    field: 'count',
    sortable: true,
    align: 'center',
  },
  {
    name: 'locations',
    label: 'Required At',
    field: 'locations',
    align: 'left',
  },
  {
    name: 'score',
    label: 'Priority Score',
    field: 'score',
    sortable: true,
    align: 'right',
    sort: (a, b) => parseInt(a) - parseInt(b),
  },
]

// 4. Options for Select
const phaseOptions = computed(() => {
  // Extrahiere verfügbare Phasen aus den Daten
  const phases = new Set(flatPriorityList.value.map((r) => r.phase))
  const opts = Array.from(phases)
    .sort()
    .map((p) => ({ label: `Phase ${p}`, value: p }))
  return opts
})

// Helpers
function formatNumber(val) {
  if (!val) return 0
  return new Intl.NumberFormat('en-US').format(val)
}

function getRelicClass(tier) {
  if (tier >= 8) return 'relic-red'
  if (tier >= 5) return 'relic-gold'
  return 'relic-base'
}
</script>

<style scoped lang="scss">
.priority-section {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 232, 31, 0.2);
  padding-bottom: 15px;
}

.subtitle {
  font-family: 'Star Jedi', sans-serif;
  font-size: 1.8rem;
  margin: 0;
  color: #ffe81f;
  text-shadow: 0 0 10px rgba(255, 232, 31, 0.3);
}

.subtitle-desc {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-top: 4px;
}

.controls {
  display: flex;
  gap: 12px;
}

.search-input,
.filter-select {
  width: 220px;
}

/* TABLE STYLING */
.prio-table {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 232, 31, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  flex-grow: 1; /* Füllt den Rest der Höhe */
}

/* Custom Header */
.custom-head {
  font-size: 1rem !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

/* Unit Cell */
.unit-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unit-name {
  font-weight: 700;
  font-size: 1.05rem;
}

/* Relic Badges */
.relic-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.relic-base {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
}
.relic-gold {
  background: rgba(255, 165, 0, 0.2);
  border-color: rgba(255, 165, 0, 0.5);
  color: #ffca28;
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.2);
}
.relic-red {
  background: rgba(255, 50, 50, 0.25);
  border-color: rgba(255, 50, 50, 0.6);
  color: #ff8a80;
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.3);
}

/* Count Badge */
.count-badge {
  display: inline-block;
  background: rgba(255, 232, 31, 0.15);
  color: #ffe81f;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 232, 31, 0.3);
}

/* Locations */
.loc-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.loc-badge {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Score */
.score-val {
  font-family: monospace;
  font-size: 1.1rem;
  opacity: 0.8;
}

/* Override Quasar Defaults */
:deep(.q-table__top),
:deep(.q-table__bottom),
:deep(thead tr:first-child th) {
  background: rgba(0, 0, 0, 0.6) !important;
}

:deep(tbody tr:hover) {
  background: rgba(255, 232, 31, 0.08) !important;
}
</style>
