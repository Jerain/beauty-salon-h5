<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header"><span class="card-title">报表中心</span></div>

      <div class="filter-bar">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" />
      </div>

      <div class="report-grid">
        <div v-for="r in reports" :key="r.name" class="report-card">
          <el-icon :size="32" :color="r.color || '#409EFF'"><component :is="r.icon || 'Document'" /></el-icon>
          <div class="report-info">
            <div class="report-name">{{ r.name }}</div>
            <div class="report-desc">{{ r.desc }}</div>
          </div>
          <el-button type="primary" size="small" icon="Download" :loading="exporting === r.key" @click="exportReport(r)">导出</el-button>
        </div>
      </div>

      <!-- 预览弹窗 -->
      <el-dialog v-model="showPreview" :title="previewTitle" width="80%" top="5vh" destroy-on-close>
        <el-table :data="previewData" stripe border max-height="480" size="small">
          <el-table-column v-for="col in previewCols" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" show-overflow-tooltip />
        </el-table>
        <template #footer>
          <el-button @click="showPreview=false">关闭</el-button>
          <el-button type="primary" icon="Download" @click="downloadCsv">下载CSV</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api'

const dateRange = ref<string[]>([])
const exporting = ref<string | null>(null)

const reports = [
  { key: 'customer_asset', name: '顾客剩余资产', desc: '导出所有顾客剩余卡、券、赠品、积分等资产', icon: 'User', color: '#409EFF' },
  { key: 'staff_performance', name: '员工业绩与提成', desc: '导出员工的业绩和提成明细', icon: 'DataAnalysis', color: '#67C23A' },
  { key: 'order_flow', name: '门店流水', desc: '导出指定时间段和门店的订单明细', icon: 'Money', color: '#E6A23C' },
  { key: 'card_consumption', name: '卡消耗列表', desc: '导出卡消耗项目/卡买卡/赠品消耗明细', icon: 'Tickets', color: '#F56C6C' },
  { key: 'payment_detail', name: '订单支付明细', desc: '按支付方式维度统计每笔支付金额', icon: 'Wallet', color: '#909399' },
]

// 预览
const showPreview = ref(false)
const previewTitle = ref('')
const previewData = ref<any[]>([])
const previewCols = ref<any[]>([])

const getDefaultRange = () => {
  const end = new Date()
  const start = new Date(); start.setDate(start.getDate() - 30)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

const exportReport = async (r: any) => {
  exporting.value = r.key
  const range = dateRange.value?.length ? dateRange.value : getDefaultRange()
  try {
    const params: any = { start_date: range[0], end_date: range[1] }
    let data: any[] = []
    let cols: any[] = []

    if (r.key === 'staff_performance') {
      const res: any = await reportApi.staffPerformance(params)
      data = res.items || (Array.isArray(res) ? res : [])
      cols = [
        { prop: 'staff_name', label: '员工', width: 100 },
        { prop: 'service_count', label: '服务次数', width: 80 },
        { prop: 'revenue', label: '业绩', width: 100 },
        { prop: 'commission', label: '提成', width: 100 },
      ]
    } else if (r.key === 'card_consumption') {
      const res: any = await reportApi.cardConsumption(params)
      data = res.items || (Array.isArray(res) ? res : [])
      cols = [
        { prop: 'card_name', label: '卡名称', width: 160 },
        { prop: 'sold_count', label: '已售', width: 80 },
        { prop: 'consumed_count', label: '已消耗', width: 80 },
        { prop: 'remaining_amount', label: '剩余金额', width: 100 },
      ]
    } else {
      const res: any = await reportApi.businessOverview(params)
      data = res.items || res.daily_data || []
      cols = [
        { prop: 'date', label: '日期', width: 120 },
        { prop: 'revenue', label: '收入', width: 100 },
        { prop: 'order_count', label: '订单数', width: 80 },
      ]
    }

    previewTitle.value = r.name
    previewData.value = data
    previewCols.value = cols
    showPreview.value = true
  } catch {
    ElMessage.error('获取报表数据失败')
  } finally {
    exporting.value = null
  }
}

const downloadCsv = () => {
  if (!previewData.value.length) { ElMessage.warning('无数据可导出'); return }
  const header = previewCols.value.map(c => c.label).join(',')
  const rows = previewData.value.map(row => previewCols.value.map(c => row[c.prop] ?? '').join(','))
  const csv = '\uFEFF' + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${previewTitle.value}.csv`
  a.click(); URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(() => { dateRange.value = getDefaultRange() })
</script>

<style lang="scss" scoped>
.report-grid { display: flex; flex-direction: column; gap: 12px; }
.report-card {
  display: flex; align-items: center; gap: 16px; padding: 20px;
  border: 1px solid #EBEEF5; border-radius: 8px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
}
.report-info { flex: 1; }
.report-name { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.report-desc { font-size: 13px; color: #909399; }
</style>
