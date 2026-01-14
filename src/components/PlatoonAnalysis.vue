<template>
  <div class="priority-section column full-height">
    <div
      class="header-row row justify-between items-end q-mb-md q-pb-sm border-bottom-accent wrap q-gutter-y-sm"
    >
      <div class="col-12 col-sm-auto"></div>

      <div class="controls col-12 col-sm-auto row q-gutter-md no-wrap-sm wrap">
        <q-input
          v-model="search"
          dense
          filled
          dark
          label="Search unit..."
          class="search-input high-contrast-input col-12 col-sm-auto"
          color="accent"
        >
          <template v-slot:append>
            <q-icon name="search" color="accent" />
          </template>
        </q-input>

        <q-select
          v-model="phaseFilter"
          dense
          filled
          dark
          :options="phaseOptions"
          label="Phase Filter"
          class="filter-select high-contrast-input col-12 col-sm-auto"
          emit-value
          map-options
          color="accent"
          clearable
          options-dense
        />
      </div>
    </div>

    <div class="table-container col custom-scroll">
      <q-table
        class="prio-table sticky-header-table"
        flat
        dark
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 15 }"
        :rows-per-page-options="[15, 30, 50, 0]"
        virtual-scroll
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        :visible-columns="
          $q.screen.lt.sm
            ? ['unit', 'count', 'score']
            : ['phase', 'unit', 'count', 'locations', 'score']
        "
      >
        <template v-slot:header="props">
          <q-tr :props="props" class="header-row-bg text-uppercase text-grey-4">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-weight-bold">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <template #body-cell-unit="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-x-sm no-wrap">
              <span
                class="text-white text-weight-bold ellipsis"
                style="font-size: 1.05rem; max-width: 200px"
                >{{ props.row.name }}</span
              >
              <q-badge :class="getRelicClass(props.row.relic)" class="relic-badge shadow-1" rounded>
                R{{ props.row.relic }}
              </q-badge>
            </div>
            <div v-if="$q.screen.lt.sm" class="text-caption text-grey-5 ellipsis">
              {{ props.row.locations.join(', ') }}
            </div>
          </q-td>
        </template>

        <template #body-cell-count="props">
          <q-td :props="props">
            <div class="count-badge text-weight-bold">{{ props.row.count }}x</div>
          </q-td>
        </template>

        <template #body-cell-locations="props">
          <q-td :props="props" class="loc-cell">
            <div class="loc-wrapper">
              <q-badge
                v-for="(loc, i) in props.row.locations"
                :key="i"
                color="grey-9"
                text-color="white"
                class="loc-badge border-grey"
              >
                {{ loc }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template #body-cell-score="props">
          <q-td :props="props">
            <span class="score-val text-accent text-weight-bold">{{
              formatNumber(props.row.score)
            }}</span>
          </q-td>
        </template>
      </q-table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
  analysis: { type: Object, required: true },
})

const search = ref('')
const phaseFilter = ref(null)

// 1. Flatten Data
const flatPriorityList = computed(() => {
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
          locations: u.locations || [],
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
    if (phaseFilter.value && row.phase !== phaseFilter.value) return false
    if (q) {
      const inName = row.name.toLowerCase().includes(q)
      const inLoc = row.locations.some((l) => l.toLowerCase().includes(q))
      if (!inName && !inLoc) return false
    }
    return true
  })
})

// 3. Columns
const columns = [
  {
    name: 'phase',
    label: 'Phase',
    field: 'phase',
    sortable: true,
    align: 'center',
    style: 'width: 60px; font-weight: bold; color: #fff;',
  },
  {
    name: 'unit',
    label: 'Unit Requirement',
    field: 'name',
    sortable: true,
    align: 'left',
    style: 'min-width: 150px; max-width: 300px; white-space: normal;', // Umbruch erlauben
  },
  {
    name: 'count',
    label: 'Qty', // Kürzeres Label für Mobile
    field: 'count',
    sortable: true,
    align: 'center',
    style: 'width: 50px;',
  },
  {
    name: 'locations',
    label: 'Required At',
    field: 'locations',
    align: 'left',
    style: 'min-width: 200px; white-space: normal;', // Umbruch der Badges erlauben
  },
  {
    name: 'score',
    label: 'Score', // Kürzer
    field: 'score',
    sortable: true,
    align: 'right',
    sort: (a, b) => parseInt(a) - parseInt(b),
    style: 'width: 100px;',
  },
]

// 4. Options
const phaseOptions = computed(() => {
  const phases = new Set(flatPriorityList.value.map((r) => r.phase))
  const opts = Array.from(phases)
    .sort()
    .map((p) => ({ label: `Phase ${p}`, value: p }))
  return opts
})

// Helpers
function formatNumber(val) {
  if (!val) return 0
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    val,
  )
}

function getRelicClass(tier) {
  if (tier >= 8) return 'relic-red'
  if (tier >= 5) return 'relic-gold'
  return 'relic-base'
}
</script>

<style scoped lang="scss">
/* --- FONTS --- */
.font-jedi {
  margin-top: -5px;
  font-family: 'Star Jedi', sans-serif;
  letter-spacing: 1px;
}

/* --- COLORS & BORDERS --- */
.border-bottom-accent {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.border-grey {
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.bg-dark-transparent {
  background: rgba(0, 0, 0, 0.4);
}

/* --- INPUTS --- */
.high-contrast-input {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 4px;
}
.high-contrast-input :deep(.q-field__native),
.high-contrast-input :deep(.q-field__label),
.high-contrast-input :deep(.q-icon) {
  color: #ffffff !important;
}

/* Responsive Input Widths */
.search-input,
.filter-select {
  width: 200px;
}
@media (max-width: 600px) {
  .search-input,
  .filter-select {
    width: 100%; /* Volle Breite auf Handy */
  }
}

/* --- TABLE --- */
.table-container {
  overflow: hidden;
}

.prio-table {
  background: rgba(15, 15, 20, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  height: 100%;

  display: flex;
  flex-direction: column;
}

.prio-table :deep(.q-table__middle) {
  flex: 1;
  overflow: auto;
}

/* Header Styling */
.header-row-bg {
  background: #1a1a1f !important;
}

.prio-table :deep(thead tr th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #1a1a1f !important;
  color: #eee;
}

/* --- CELL ELEMENTS --- */
.relic-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
  font-weight: 800;
  border: 1px solid transparent;
}

.relic-base {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
  border-color: rgba(255, 255, 255, 0.2);
}
.relic-gold {
  background: rgba(255, 165, 0, 0.15);
  border-color: rgba(255, 165, 0, 0.5);
  color: #ffca28;
}
.relic-red {
  background: rgba(255, 50, 50, 0.15);
  border-color: rgba(255, 50, 50, 0.6);
  color: #ff8a80;
}

.count-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loc-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.loc-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
}

.score-val {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: bold;
}

/* Override Quasar Table Colors */
:deep(.q-table__bottom) {
  background: transparent !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #ccc;
}
:deep(tbody tr:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* SCROLLBAR */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--q-accent);
}
</style>
