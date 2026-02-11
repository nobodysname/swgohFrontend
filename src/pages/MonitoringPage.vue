<template>
  <q-page class="page-container">
    <div class="content-wrapper">
      <div class="header-section">
        <div>
          <div class="eyebrow">System Telemetry</div>
          <h1 class="page-title">API Monitoring</h1>
          <div class="subtitle">Aggregierte Nutzung nach Zeit-Bucket, Route und Methode</div>
        </div>
        <div class="header-actions">
          <q-chip
            v-if="isAuthenticated"
            :color="isAdmin ? 'positive' : 'grey-8'"
            text-color="white"
            icon="shield"
          >
            {{ isAdmin ? 'Admin' : 'Viewer' }}
          </q-chip>
          <q-btn
            flat
            icon="key"
            label="Key ändern"
            class="ghost-btn"
            @click="openPasswordDialog"
          />
          <q-btn
            unelevated
            color="accent"
            text-color="black"
            icon="refresh"
            label="Refresh"
            :loading="loading"
            @click="fetchMonitoring"
          />
        </div>
      </div>

      <q-dialog v-model="passwordDialog" persistent transition-show="scale" transition-hide="scale">
        <q-card class="glass-card password-card">
          <div class="text-center q-mb-md">
            <q-icon name="lock" size="xl" color="warning" />
            <div class="text-h5 text-uppercase q-mt-sm" style="color: white">
              Monitoring Zugriff
            </div>
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
            @keyup.enter="submitPassword"
          >
            <template v-slot:prepend>
              <q-icon name="key" />
            </template>
          </q-input>

          <div class="row justify-between">
            <q-btn flat label="Abbrechen" color="grey-5" @click="closePasswordDialog" />
            <q-btn label="Zugriff" color="accent" text-color="black" @click="submitPassword" />
          </div>

          <div v-if="error" class="error-msg q-mt-md text-center">
            <q-icon name="warning" class="q-mr-xs" /> {{ error }}
          </div>
        </q-card>
      </q-dialog>

      <div v-if="isAuthenticated" class="dashboard">
        <q-card class="glass-card filters-card">
          <div class="card-header">
            <q-icon name="tune" color="accent" />
            <span>Filter</span>
          </div>
          <div class="filters-grid">
            <q-select
              v-model="filters.bucket"
              :options="bucketOptions"
              label="Bucket"
              dense
              filled
              dark
              class="high-contrast-input"
            />
            <q-input
              v-model="filters.from"
              label="Von"
              type="datetime-local"
              dense
              filled
              dark
              class="high-contrast-input"
            />
            <q-input
              v-model="filters.to"
              label="Bis"
              type="datetime-local"
              dense
              filled
              dark
              class="high-contrast-input"
            />
            <q-input
              v-model="filters.route"
              label="Route enthält"
              dense
              filled
              dark
              class="high-contrast-input"
            />
            <q-select
              v-model="filters.method"
              :options="methodOptions"
              label="Methode"
              dense
              filled
              dark
              clearable
              class="high-contrast-input"
            />
          </div>
          <div class="filters-actions">
            <q-btn
              outline
              color="grey-4"
              label="Reset"
              class="ghost-btn"
              @click="resetFilters"
            />
            <q-btn
              unelevated
              color="accent"
              text-color="black"
              icon="search"
              label="Anwenden"
              :loading="loading"
              @click="applyFilters"
            />
          </div>
        </q-card>

        <div class="metrics-grid">
          <q-card class="glass-card metric-card">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value">{{ totalRequests.toLocaleString('de-DE') }}</div>
            <div class="metric-foot">{{ timeSpanLabel }}</div>
          </q-card>
          <q-card class="glass-card metric-card">
            <div class="metric-label">Unique Routes</div>
            <div class="metric-value">{{ uniqueRoutes }}</div>
            <div class="metric-foot">Top: {{ topRouteLabel }}</div>
          </q-card>
          <q-card class="glass-card metric-card">
            <div class="metric-label">HTTP Methoden</div>
            <div class="metric-value">{{ uniqueMethods }}</div>
            <div class="metric-foot">Peak: {{ peakBucketLabel }}</div>
          </q-card>
        </div>

        <div class="charts-grid">
          <q-card class="glass-card chart-card">
            <div class="card-header">
              <q-icon name="show_chart" color="info" />
              <span>Traffic over time</span>
            </div>
            <div class="chart-body">
              <svg v-if="bucketSeries.length" viewBox="0 0 1000 220" class="line-chart">
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="areaPath" fill="url(#lineFill)" />
                <polyline
                  :points="linePoints"
                  fill="none"
                  stroke="#5eead4"
                  stroke-width="6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <g class="chart-dots">
                  <circle
                    v-for="(point, idx) in chartDots"
                    :key="idx"
                    :cx="point.x"
                    :cy="point.y"
                    r="6"
                  />
                </g>
              </svg>
              <div v-else class="empty-state">Keine Daten für den Zeitraum.</div>
              <div class="bucket-labels" v-if="bucketSeries.length">
                <span>{{ bucketSeries[0]?.label }}</span>
                <span>{{ bucketSeries[bucketSeries.length - 1]?.label }}</span>
              </div>
            </div>
          </q-card>

          <q-card class="glass-card chart-card">
            <div class="card-header">
              <q-icon name="route" color="secondary" />
              <span>Top Routes</span>
            </div>
            <div class="chart-body">
              <div v-if="topRoutes.length" class="bar-list">
                <div v-for="route in topRoutes" :key="route.label" class="bar-row">
                  <div class="bar-label">{{ route.label }}</div>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: route.width + '%' }"></div>
                  </div>
                  <div class="bar-value">{{ route.count.toLocaleString('de-DE') }}</div>
                </div>
              </div>
              <div v-else class="empty-state">Keine Routen gefunden.</div>
            </div>
          </q-card>

          <q-card class="glass-card chart-card">
            <div class="card-header">
              <q-icon name="call_split" color="warning" />
              <span>Methoden-Mix</span>
            </div>
            <div class="chart-body">
              <div v-if="topMethods.length" class="pill-grid">
                <div v-for="method in topMethods" :key="method.label" class="method-pill">
                  <div class="pill-name">{{ method.label }}</div>
                  <div class="pill-count">{{ method.count }}</div>
                </div>
              </div>
              <div v-else class="empty-state">Keine Methoden-Daten.</div>
            </div>
          </q-card>
        </div>

        <q-card class="glass-card table-card">
          <div class="card-header">
            <q-icon name="table_view" color="accent" />
            <span>Details</span>
          </div>
          <q-table
            :rows="tableRows"
            :columns="columns"
            row-key="id"
            flat
            dark
            :rows-per-page-options="[10, 25, 50, 0]"
            class="monitoring-table"
            :loading="loading"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-bucket="props">
              <q-td :props="props">
                {{ formatBucket(props.row.bucket) }}
              </q-td>
            </template>
            <template v-slot:body-cell-count="props">
              <q-td :props="props" class="text-right text-weight-bold text-accent">
                {{ props.row.count.toLocaleString('de-DE') }}
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <div v-else class="locked-state">
        <q-icon name="lock" size="lg" color="grey-7" />
        <div>Bitte Monitoring Key eingeben, um Daten zu sehen.</div>
        <q-btn outline label="Key eingeben" color="accent" class="q-mt-md" @click="openPasswordDialog" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { api } from 'src/boot/axios'
import { date } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()

const passwordDialog = ref(true)
const password = ref('')
const error = ref(null)
const loading = ref(false)
const role = ref('viewer')
const rawRows = ref([])
const hasAccess = ref(false)

const filters = reactive({
  bucket: 'hour',
  from: '',
  to: '',
  route: '',
  method: null,
})

const appliedFilters = ref({ ...filters })

const bucketOptions = ['minute', 'hour', 'day']
const methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const isAuthenticated = computed(() => hasAccess.value)
const isAdmin = computed(() => role.value === 'admin')

const columns = [
  { name: 'bucket', label: 'Bucket', field: 'bucket', sortable: true, align: 'left' },
  { name: 'route', label: 'Route', field: 'route', sortable: true, align: 'left' },
  { name: 'method', label: 'Methode', field: 'method', sortable: true, align: 'left' },
  { name: 'count', label: 'Hits', field: 'count', sortable: true, align: 'right' },
]

const normalizedRows = computed(() => {
  return extractRows(rawRows.value)
    .map((row, idx) => {
      const bucket =
        row.bucket ||
        row.time_bucket ||
        row.timeBucket ||
        row.time ||
        row.date ||
        row.created_at ||
        row.createdAt ||
        ''
      const route = row.route || row.path || row.endpoint || ''
      const method = row.method || row.http_method || ''
      const count = Number(row.count ?? row.total ?? row.hits ?? row.usage ?? row.requests ?? 0)
      return {
        id: row.id ?? `${bucket}-${route}-${method}-${idx}`,
        bucket,
        route,
        method,
        count,
      }
    })
    .filter((row) => row.bucket || row.route || row.method)
})

const filteredRows = computed(() => {
  const routeFilter = appliedFilters.value.route?.trim().toLowerCase()
  const methodFilter = appliedFilters.value.method?.trim().toLowerCase()
  return normalizedRows.value.filter((row) => {
    const matchesRoute = !routeFilter || row.route.toLowerCase().includes(routeFilter)
    const matchesMethod = !methodFilter || row.method.toLowerCase() === methodFilter
    return matchesRoute && matchesMethod
  })
})

const tableRows = computed(() => filteredRows.value)

const bucketSeries = computed(() => {
  const map = new Map()
  filteredRows.value.forEach((row) => {
    if (!row.bucket) return
    map.set(row.bucket, (map.get(row.bucket) || 0) + row.count)
  })

  const entries = Array.from(map.entries()).map(([bucket, count]) => ({
    bucket,
    count,
    label: formatBucket(bucket),
    sortKey: toSortableKey(bucket),
  }))

  entries.sort((a, b) => a.sortKey - b.sortKey)
  return entries
})

const totalRequests = computed(() => filteredRows.value.reduce((sum, row) => sum + row.count, 0))

const uniqueRoutes = computed(() => new Set(filteredRows.value.map((row) => row.route)).size)
const uniqueMethods = computed(() => new Set(filteredRows.value.map((row) => row.method)).size)

const topRoutes = computed(() => {
  const map = new Map()
  filteredRows.value.forEach((row) => {
    if (!row.route) return
    map.set(row.route, (map.get(row.route) || 0) + row.count)
  })
  const sorted = Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
  const max = sorted[0]?.count || 1
  return sorted.map((entry) => ({
    ...entry,
    width: Math.round((entry.count / max) * 100),
  }))
})

const topMethods = computed(() => {
  const map = new Map()
  filteredRows.value.forEach((row) => {
    if (!row.method) return
    map.set(row.method, (map.get(row.method) || 0) + row.count)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
})

const linePoints = computed(() => buildLinePoints(bucketSeries.value))
const areaPath = computed(() => buildAreaPath(bucketSeries.value))
const chartDots = computed(() => buildChartDots(bucketSeries.value))

const timeSpanLabel = computed(() => {
  if (!bucketSeries.value.length) return 'Kein Zeitraum'
  return `${bucketSeries.value[0].label} → ${bucketSeries.value[bucketSeries.value.length - 1].label}`
})

const topRouteLabel = computed(() => topRoutes.value[0]?.label || '—')
const peakBucketLabel = computed(() => {
  if (!bucketSeries.value.length) return '—'
  const peak = bucketSeries.value.reduce((best, cur) => (cur.count > best.count ? cur : best))
  return `${peak.label} (${peak.count.toLocaleString('de-DE')})`
})

function extractRows(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload) return []
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.usage)) return payload.usage
  if (payload.result && Array.isArray(payload.result)) return payload.result
  return []
}

function toSortableKey(value) {
  const parsed = Date.parse(value)
  if (!Number.isNaN(parsed)) return parsed
  return value
    .toString()
    .split('')
    .reduce((sum, char, idx) => sum + char.charCodeAt(0) * (idx + 1), 0)
}

function formatBucket(value) {
  if (!value) return '-'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  const format =
    appliedFilters.value.bucket === 'minute'
      ? 'DD.MM HH:mm'
      : appliedFilters.value.bucket === 'hour'
        ? 'DD.MM HH:00'
        : 'DD.MM.YYYY'
  return date.formatDate(parsed, format)
}

function buildLinePoints(series) {
  if (!series.length) return ''
  const max = Math.max(...series.map((entry) => entry.count), 1)
  const points = series.map((entry, idx) => {
    const x = series.length === 1 ? 500 : (idx / (series.length - 1)) * 1000
    const y = 200 - (entry.count / max) * 160 - 20
    return `${x},${Math.max(20, y)}`
  })
  return points.join(' ')
}

function buildAreaPath(series) {
  if (!series.length) return ''
  const points = buildLinePoints(series)
  const parts = points.split(' ')
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `M ${first} L ${points} L ${last.split(',')[0]},200 L ${first.split(',')[0]},200 Z`
}

function buildChartDots(series) {
  if (!series.length) return []
  const max = Math.max(...series.map((entry) => entry.count), 1)
  return series.map((entry, idx) => {
    const x = series.length === 1 ? 500 : (idx / (series.length - 1)) * 1000
    const y = 200 - (entry.count / max) * 160 - 20
    return { x, y: Math.max(20, y) }
  })
}

function buildParams(filterState) {
  const params = {}
  if (filterState.bucket) params.bucket = filterState.bucket
  if (filterState.from) params.from = filterState.from
  if (filterState.to) params.to = filterState.to
  if (filterState.route) params.route = filterState.route
  if (filterState.method) params.method = filterState.method
  return params
}

async function fetchMonitoring() {
  if (!password.value) {
    passwordDialog.value = true
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/monitoring', {
      headers: { 'x-strategy-password': password.value },
      params: buildParams(appliedFilters.value),
    })
    const payload = res.data
    role.value = payload?.role || payload?.meta?.role || role.value || 'viewer'
    rawRows.value = payload?.rows || payload?.data || payload?.items || payload || []
    hasAccess.value = true
  } catch (err) {
    error.value = 'Zugriff verweigert oder Monitoring nicht erreichbar.'
    rawRows.value = []
    hasAccess.value = false
  } finally {
    loading.value = false
  }
}

async function submitPassword() {
  appliedFilters.value = { ...filters }
  await fetchMonitoring()
  if (!error.value) passwordDialog.value = false
}

function applyFilters() {
  appliedFilters.value = { ...filters }
  fetchMonitoring()
}

function resetFilters() {
  filters.bucket = 'hour'
  filters.from = ''
  filters.to = ''
  filters.route = ''
  filters.method = null
  applyFilters()
}

function openPasswordDialog() {
  passwordDialog.value = true
}

function closePasswordDialog() {
  router.back()
  setTimeout(() => router.push('/'), 100)
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

.page-container {
  min-height: 100vh;
  padding: 24px;
  color: #e9f2ff;
  font-family: 'Space Grotesk', sans-serif;
  background:
    radial-gradient(circle at top, rgba(34, 211, 238, 0.12), transparent 55%),
    radial-gradient(circle at 20% 20%, rgba(94, 234, 212, 0.12), transparent 45%),
    linear-gradient(135deg, rgba(6, 10, 20, 0.98), rgba(10, 20, 30, 0.98));
  position: relative;
  overflow-x: hidden;
}

.page-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.2;
  pointer-events: none;
}

.content-wrapper {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  z-index: 1;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.9);
}

.page-title {
  font-size: 2.6rem;
  margin: 6px 0 0;
  font-weight: 700;
}

.subtitle {
  color: rgba(226, 232, 240, 0.7);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.glass-card {
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(18px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1.5px;
  color: rgba(226, 232, 240, 0.75);
  font-weight: 700;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.filters-card {
  padding-bottom: 16px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px 20px 4px;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 20px 16px;
}

.high-contrast-input {
  background: rgba(15, 23, 42, 0.5) !important;
  border-radius: 6px;
}

.high-contrast-input :deep(.q-field__control) {
  background: transparent;
}

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 18px 20px;
  display: grid;
  gap: 6px;
}

.metric-label {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.8);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #5eead4;
}

.metric-foot {
  color: rgba(226, 232, 240, 0.6);
  font-size: 0.85rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.chart-card {
  min-height: 260px;
}

.chart-body {
  padding: 18px 20px 20px;
}

.line-chart {
  width: 100%;
  height: 180px;
}

.chart-dots circle {
  fill: #0f172a;
  stroke: #5eead4;
  stroke-width: 4;
}

.bucket-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.6);
  margin-top: 6px;
}

.bar-list {
  display: grid;
  gap: 12px;
}

.bar-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 12px;
  align-items: center;
  font-size: 0.85rem;
}

.bar-label {
  color: rgba(226, 232, 240, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #5eead4, #2dd4bf);
}

.bar-value {
  font-weight: 600;
  color: #f8fafc;
}

.pill-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.method-pill {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(94, 234, 212, 0.3);
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pill-name {
  font-weight: 600;
  color: #5eead4;
}

.pill-count {
  color: rgba(226, 232, 240, 0.7);
}

.table-card {
  overflow: hidden;
}

.monitoring-table :deep(th) {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(226, 232, 240, 0.8);
}

.monitoring-table :deep(.q-table__bottom) {
  border-top: 1px solid rgba(148, 163, 184, 0.15);
}

.password-card {
  padding: 30px;
  width: 100%;
  max-width: 420px;
}

.error-msg {
  color: #f87171;
  font-weight: bold;
  background: rgba(248, 113, 113, 0.1);
  padding: 8px;
  border-radius: 6px;
}

.empty-state {
  color: rgba(226, 232, 240, 0.6);
  text-align: center;
  padding: 24px 0;
}

.locked-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(226, 232, 240, 0.7);
  display: grid;
  gap: 8px;
  justify-items: center;
}

@media (max-width: 900px) {
  .page-container {
    padding: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .filters-actions {
    justify-content: flex-start;
  }

  .bar-row {
    grid-template-columns: 1fr;
  }

  .bar-value {
    text-align: right;
  }
}
</style>
