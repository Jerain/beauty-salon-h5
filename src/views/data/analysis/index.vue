<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">经营数据</span>
        <el-button icon="Download" @click="ElMessage.info('导出功能开发中')">导出报表</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="经营数据表" name="business" />
        <el-tab-pane label="新客数据表" name="newCustomer" />
        <el-tab-pane label="客户盘点表" name="inventory" />
        <el-tab-pane label="品项卡报表" name="cardReport" />
      </el-tabs>

      <div class="filter-bar">
        <el-radio-group v-model="dateMode" size="small" @change="loadData">
          <el-radio-button value="day">日维度</el-radio-button>
          <el-radio-button value="month">月维度</el-radio-button>
        </el-radio-group>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 汇总卡片 -->
      <div class="kpi-panel" v-if="activeTab === 'business'">
        <div class="kpi-item"><span class="kpi-label">总收入</span><span class="kpi-val" style="color:#67C23A">¥{{ overview.total_revenue?.toFixed(2) || '0.00' }}</span></div>
        <div class="kpi-item"><span class="kpi-label">订单数</span><span class="kpi-val">{{ overview.total_orders || 0 }}</span></div>
        <div class="kpi-item"><span class="kpi-label">新客数</span><span class="kpi-val" style="color:#409EFF">{{ overview.new_customers || 0 }}</span></div>
        <div class="kpi-item"><span class="kpi-label">客单价</span><span class="kpi-val">¥{{ overview.avg_order_amount?.toFixed(2) || '0.00' }}</span></div>
        <div class="kpi-item"><span class="kpi-label">客流量</span><span class="kpi-val">{{ overview.total_visits || 0 }}</span></div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column v-if="activeTab === 'business'" label="日期" prop="date" width="120" />
        <el-table-column v-if="activeTab === 'business'" label="现金收入" width="120" align="right">
          <template #default="{row}">¥{{ row.cash_revenue?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'business'" label="实操收入" width="120" align="right">
          <template #default="{row}">¥{{ row.service_revenue?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'business'" label="产品收入" width="120" align="right">
          <template #default="{row}">¥{{ row.product_revenue?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'business'" label="订单数" prop="order_count" width="80" align="center" />
        <el-table-column v-if="activeTab === 'business'" label="客流量" prop="visitor_count" width="80" align="center" />

        <template v-if="activeTab === 'newCustomer'">
          <el-table-column label="日期" prop="date" width="120" />
          <el-table-column label="新客数" prop="new_count" width="80" align="center" />
          <el-table-column label="来源" prop="source" width="120" />
          <el-table-column label="转化率" width="100" align="center">
            <template #default="{row}">{{ row.conversion_rate ? (row.conversion_rate * 100).toFixed(1) + '%' : '—' }}</template>
          </el-table-column>
        </template>

        <template v-if="activeTab === 'cardReport'">
          <el-table-column label="卡名称" prop="card_name" width="160" />
          <el-table-column label="卡类型" prop="card_type" width="100" />
          <el-table-column label="已售" prop="sold_count" width="80" align="center" />
          <el-table-column label="已消耗" prop="consumed_count" width="80" align="center" />
          <el-table-column label="剩余金额" width="120" align="right">
            <template #default="{row}">¥{{ row.remaining_amount?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
        </template>
      </el-table>

      <el-empty v-if="!tableData.length && !loading" description="暂无数据，请选择日期范围查询" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api'

const activeTab = ref('business')
const dateMode = ref('day')
const dateRange = ref<string[] | null>(null)
const loading = ref(false)
const tableData = ref<any[]>([])
const overview = ref<any>({})

const getDefaultRange = () => {
  const end = new Date()
  const start = new Date(); start.setDate(start.getDate() - 30)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

const loadData = async () => {
  loading.value = true
  const range = dateRange.value || getDefaultRange()
  try {
    const params: any = { start_date: range[0], end_date: range[1], mode: dateMode.value }
    if (activeTab.value === 'business') {
      const r: any = await reportApi.businessOverview(params)
      overview.value = r.overview || r || {}
      tableData.value = r.items || r.daily_data || []
    } else if (activeTab.value === 'newCustomer') {
      const r: any = await reportApi.businessCustomer(params)
      tableData.value = r.items || (Array.isArray(r) ? r : [])
    } else if (activeTab.value === 'cardReport') {
      const r: any = await reportApi.cardConsumption(params)
      tableData.value = r.items || (Array.isArray(r) ? r : [])
    } else {
      tableData.value = []
    }
  } catch { tableData.value = []; overview.value = {} } finally { loading.value = false }
}

onMounted(() => { dateRange.value = getDefaultRange(); loadData() })
</script>

<style lang="scss" scoped>
.kpi-panel {
  display: flex; gap: 16px; margin-bottom: 20px;
  .kpi-item {
    flex: 1; text-align: center; padding: 16px; background: #F5F7FA;
    border-radius: 8px; border: 1px solid #EBEEF5;
    .kpi-label { display: block; font-size: 13px; color: #909399; margin-bottom: 4px; }
    .kpi-val { display: block; font-size: 22px; font-weight: 700; color: #303133; }
  }
}
</style>
