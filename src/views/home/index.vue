<template>
  <div class="page-container">
    <!-- 快捷入口 -->
    <div class="quick-actions">
      <div v-for="item in quickActions" :key="item.label" class="quick-action-btn" @click="router.push(item.path)">
        <el-icon :size="28"><component :is="item.icon" /></el-icon>
        <span class="quick-action-label">{{ item.label }}</span>
      </div>
    </div>

    <!-- 业绩概览 -->
    <div class="card">
      <div class="card-header">
        <div class="header-left">
          <span class="card-title">业绩概览</span>
          <el-radio-group v-model="timeRange" size="small" class="time-range">
            <el-radio-button value="today">今天</el-radio-button>
            <el-radio-button value="week">近7天</el-radio-button>
            <el-radio-button value="month">近30天</el-radio-button>
          </el-radio-group>
        </div>
        <el-select v-model="currentStore" placeholder="门店" size="small" style="width: 140px">
          <el-option v-for="s in storeList" :key="s" :label="s" :value="s" />
        </el-select>
      </div>

      <div class="stat-cards">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div :class="['stat-trend', stat.trend > 0 ? 'up' : 'down']">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </div>

    <div class="row-grid">
      <!-- 本月目标 -->
      <div class="card target-card">
        <div class="card-header">
          <span class="card-title">本月目标</span>
          <el-radio-group v-model="targetScope" size="small">
            <el-radio-button value="store">门店</el-radio-button>
            <el-radio-button value="my">我的</el-radio-button>
          </el-radio-group>
        </div>
        <div class="target-list">
          <div v-for="t in targets" :key="t.label" class="target-item">
            <div class="target-info">
              <span class="target-label">{{ t.label }}</span>
              <span class="target-values">
                <b>{{ t.done }}</b> / {{ t.goal }}
              </span>
            </div>
            <el-progress :percentage="t.percent" :stroke-width="8" :color="t.percent >= 80 ? '#67C23A' : '#409EFF'" />
          </div>
        </div>
      </div>

      <!-- 消息提醒 -->
      <div class="card message-card">
        <div class="card-header">
          <span class="card-title">消息提醒</span>
          <el-badge :value="notifications.length" type="warning" />
        </div>
        <div class="notification-list">
          <div v-for="(n, i) in notifications" :key="i" class="notification-item">
            <el-icon :color="n.color" :size="18"><component :is="n.icon" /></el-icon>
            <div class="notification-content">
              <span class="notification-title">{{ n.title }}</span>
              <span class="notification-desc">{{ n.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势图表 -->
    <div class="card chart-card">
      <div class="card-header">
        <span class="card-title">营收趋势</span>
        <el-radio-group v-model="chartType" size="small">
          <el-radio-button value="revenue">营收</el-radio-button>
          <el-radio-button value="customer">客流</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { reportApi, messageApi, shopApi, targetApi } from '@/api'

const router = useRouter()

const quickActions = [
  { label: '预约', icon: 'Calendar', path: '/operate/appointment' },
  { label: '开单', icon: 'ShoppingCart', path: '/operate/billing' },
  { label: '顾客', icon: 'User', path: '/operate/member' },
  { label: '订单', icon: 'List', path: '/operate/order' },
]

const timeRange = ref('week')
const targetScope = ref('store')
const chartType = ref('revenue')
const currentStore = ref('')
const chartRef = ref<HTMLElement>()
const storeList = ref<string[]>(['全部门店'])
let chartInstance: echarts.ECharts | null = null

const stats = ref([
  { label: '营业额(元)', value: '0', trend: 0 },
  { label: '订单数(笔)', value: '0', trend: 0 },
  { label: '新客(人)', value: '0', trend: 0 },
  { label: '客单价(元)', value: '0', trend: 0 },
  { label: '充值(元)', value: '0', trend: 0 },
  { label: '预约(次)', value: '0', trend: 0 },
])

const targets = ref<any[]>([])

const notifications = ref<any[]>([])

// ===== Date Helpers =====
function fmtDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDateRange(): { start_date: string; end_date: string } {
  const today = new Date()
  const end = new Date(today)
  let start: Date
  switch (timeRange.value) {
    case 'today':
      start = new Date(today)
      break
    case 'week':
      start = new Date(today)
      start.setDate(start.getDate() - 6)
      break
    case 'month':
      start = new Date(today)
      start.setDate(start.getDate() - 29)
      break
    default:
      start = new Date(today)
      start.setDate(start.getDate() - 6)
  }
  return { start_date: fmtDate(start), end_date: fmtDate(end) }
}

function getPreviousRange(range: { start_date: string; end_date: string }) {
  const start = new Date(range.start_date)
  const end = new Date(range.end_date)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - days + 1)
  return { start_date: fmtDate(prevStart), end_date: fmtDate(prevEnd) }
}

function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return parseFloat((((current - previous) / previous) * 100).toFixed(1))
}

// ===== Data Loading =====
async function loadData() {
  try {
    const range = getDateRange()
    const prevRange = getPreviousRange(range)

    // Fetch current & previous period data in parallel
    const [current, previous] = await Promise.all([
      reportApi.businessOverview(range),
      reportApi.businessOverview(prevRange),
    ])

    const c = current as any
    const p = previous as any

    stats.value = [
      { label: '营业额(元)', value: formatNum(c.total_revenue), trend: calcTrend(c.total_revenue, p.total_revenue) },
      { label: '订单数(笔)', value: String(c.order_count), trend: calcTrend(c.order_count, p.order_count) },
      { label: '新客(人)', value: String(c.new_customers), trend: calcTrend(c.new_customers, p.new_customers) },
      { label: '客单价(元)', value: String(c.avg_order_value), trend: calcTrend(c.avg_order_value, p.avg_order_value) },
      { label: '充值(元)', value: formatNum(c.recharge_amount), trend: calcTrend(c.recharge_amount, p.recharge_amount) },
      { label: '预约(次)', value: String(c.appointment_count), trend: calcTrend(c.appointment_count, p.appointment_count) },
    ]

    // Load chart and targets after stats
    await Promise.all([loadChartData(), loadTargets()])
  } catch (e) {
    console.error('Failed to load home data:', e)
  }
}

async function loadTargets() {
  const today = new Date()
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  try {
    const data: any = await targetApi.list({ month })
    const plans = Array.isArray(data) ? data : (data?.items || [])

    // Aggregate goals from plans
    const goalMap: Record<string, number> = {}
    for (const plan of plans) {
      const t = plan.target_type
      if (t && plan.target_value) {
        goalMap[t] = (goalMap[t] || 0) + plan.target_value
      }
    }

    // Use current period stats as done values
    const range = getDateRange()
    const biz: any = await reportApi.businessOverview(range)

    const mapping: { key: string; label: string; stat: string; unit: string }[] = [
      { key: 'revenue', label: '营业额', stat: 'total_revenue', unit: '元' },
      { key: 'orders', label: '订单', stat: 'order_count', unit: '笔' },
      { key: 'customers', label: '新客', stat: 'new_customers', unit: '人' },
      { key: 'recharge', label: '充值', stat: 'recharge_amount', unit: '元' },
      { key: 'appointments', label: '预约', stat: 'appointment_count', unit: '次' },
    ]

    const items = mapping.map(m => {
      const done = biz[m.stat] || 0
      const goal = goalMap[m.key] || 0
      const percent = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0
      return {
        label: m.label,
        done: m.unit === '元' ? formatNum(done) : `${done}${m.unit}`,
        goal: goal > 0 ? (m.unit === '元' ? formatNum(goal) : `${goal}${m.unit}`) : '未设置',
        percent,
      }
    })

    targets.value = items
  } catch {
    // Target plans may not exist; show stats as progress-free items
    targets.value = [
      { label: '暂无目标', done: '-', goal: '未设置', percent: 0 },
    ]
  }
}

async function loadChartData() {
  try {
    const range = getDateRange()
    const groupBy = timeRange.value === 'today' ? 'day' : timeRange.value === 'week' ? 'day' : 'day'
    const data: any = await reportApi.revenueSummary({ ...range, group_by: groupBy })

    let labels: string[]
    let revenueData: number[]
    let countData: number[]

    if (Array.isArray(data) && data.length > 0) {
      labels = data.map((d: any) => {
        if (timeRange.value === 'today') return d.period
        return d.period ? d.period.slice(5) : ''
      })
      revenueData = data.map((d: any) => d.revenue || 0)
      countData = data.map((d: any) => d.order_count || 0)
    } else {
      // Fallback: show empty state
      const today = new Date()
      labels = [fmtDate(today)]
      revenueData = [0]
      countData = [0]
    }

    updateChart(labels, revenueData, countData)
  } catch (e) {
    console.error('Failed to load chart data:', e)
  }
}

function updateChart(labels: string[], revenueData: number[], countData: number[]) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const isRevenue = chartType.value === 'revenue'
  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#DCDFE6' } } },
    yAxis: {
      type: 'value',
      name: isRevenue ? '元' : '笔',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#EBEEF5' } },
    },
    series: [
      {
        name: isRevenue ? '营业额' : '订单数',
        type: 'line',
        smooth: true,
        data: isRevenue ? revenueData : countData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' },
          ]),
        },
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' },
      },
    ],
  }, true)
}

async function loadNotifications() {
  try {
    const [overview, cardExpire, birthdays] = await Promise.all([
      messageApi.overview(),
      messageApi.cardExpire(),
      messageApi.customerBirthday(),
    ])
    const ov = overview as any
    const expireList = (cardExpire as any) || []
    const birthdayList = (birthdays as any) || []

    const items: any[] = []
    if (ov.birthday > 0) {
      items.push({ icon: 'Present', color: '#E6A23C', title: '顾客生日', desc: `${ov.birthday}位顾客即将过生日` })
    }
    if (ov.appointment > 0) {
      items.push({ icon: 'Calendar', color: '#409EFF', title: '预约提醒', desc: `${ov.appointment}条预约待处理` })
    }
    if (ov.card_expire > 0) {
      items.push({ icon: 'Warning', color: '#F56C6C', title: '会员卡到期', desc: `${ov.card_expire}张会员卡即将到期` })
    }
    if (ov.no_visit > 0) {
      items.push({ icon: 'User', color: '#67C23A', title: '顾客回访', desc: `${ov.no_visit}位顾客久未到店的` })
    }

    // Fallback defaults when no data
    if (items.length === 0) {
      items.push(
        { icon: 'Present', color: '#E6A23C', title: '顾客生日', desc: birthdayList.length > 0 ? `${birthdayList.length}位顾客即将过生日` : '暂无生日提醒' },
        { icon: 'Calendar', color: '#409EFF', title: '预约提醒', desc: '暂无待处理预约' },
        { icon: 'Warning', color: '#F56C6C', title: '会员卡到期', desc: expireList.length > 0 ? `${expireList.length}张会员卡即将到期` : '暂无到期提醒' },
      )
    }
    notifications.value = items
  } catch (e) {
    console.error('Failed to load notifications:', e)
    notifications.value = [
      { icon: 'Present', color: '#E6A23C', title: '消息', desc: '加载失败，请刷新重试' },
    ]
  }
}

async function loadShops() {
  try {
    const data: any = await shopApi.list()
    if (Array.isArray(data) && data.length > 0) {
      storeList.value = ['全部门店', ...data.map((s: any) => s.name)]
    }
    if (!currentStore.value) {
      currentStore.value = storeList.value[0]
    }
  } catch (e) {
    console.error('Failed to load shops:', e)
  }
}

// ===== Watchers for reactive refresh =====
watch([timeRange, currentStore], () => {
  loadData()
})

watch(chartType, () => {
  loadChartData()
})

// ===== Lifecycle =====
const handleResize = () => chartInstance?.resize()

onMounted(async () => {
  await loadShops()
  await loadData()
  await loadNotifications()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: $text-regular;

  &:hover {
    border-color: #409EFF;
    color: #409EFF;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
  }

  .quick-action-label {
    font-size: 14px;
    font-weight: 500;
  }
}

.row-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-range {
  margin-left: 8px;
}

.target-card {
  .target-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .target-item {
    .target-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .target-label { font-size: 13px; color: $text-regular; }
    .target-values { font-size: 13px; color: $text-secondary; b { color: $text-primary; } }
  }
}

.message-card {
  .notification-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid $border-lighter;
    &:last-child { border-bottom: none; }
  }
  .notification-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .notification-title { font-size: 13px; font-weight: 500; color: $text-primary; }
  .notification-desc { font-size: 12px; color: $text-secondary; }
}

.chart-card {
  margin-top: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}
</style>
