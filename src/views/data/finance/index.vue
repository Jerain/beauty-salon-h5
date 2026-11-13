<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">财务数据</span>
        <el-button icon="Download" @click="ElMessage.info('导出功能开发中')">导出</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="营业概览" name="overview" />
        <el-tab-pane label="收款报表" name="payment" />
        <el-tab-pane label="品项卡报表" name="cardReport" />
        <el-tab-pane label="负债报表" name="debt" />
      </el-tabs>

      <div class="filter-bar">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 营业概览 -->
      <template v-if="activeTab === 'overview'">
        <div class="kpi-panel">
          <div class="kpi-item"><span class="kpi-label">总收入</span><span class="kpi-val" style="color:#67C23A">¥{{ overview.total_revenue?.toFixed(2) || '0.00' }}</span></div>
          <div class="kpi-item"><span class="kpi-label">现金收入</span><span class="kpi-val">¥{{ overview.cash_revenue?.toFixed(2) || '0.00' }}</span></div>
          <div class="kpi-item"><span class="kpi-label">卡消耗</span><span class="kpi-val">¥{{ overview.card_consumption?.toFixed(2) || '0.00' }}</span></div>
          <div class="kpi-item"><span class="kpi-label">支出</span><span class="kpi-val" style="color:#F56C6C">¥{{ overview.expense?.toFixed(2) || '0.00' }}</span></div>
          <div class="kpi-item"><span class="kpi-label">利润</span><span class="kpi-val" :style="{color: (overview.profit||0)>=0?'#67C23A':'#F56C6C'}">¥{{ overview.profit?.toFixed(2) || '0.00' }}</span></div>
        </div>
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column label="日期" prop="date" width="120" />
          <el-table-column label="收入" width="120" align="right"><template #default="{row}">¥{{ row.revenue?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="支出" width="120" align="right"><template #default="{row}">¥{{ row.expense?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="利润" width="120" align="right">
            <template #default="{row}"><span :style="{color: (row.profit||0)>=0?'#67C23A':'#F56C6C',fontWeight:700}">¥{{ row.profit?.toFixed(2) || '0.00' }}</span></template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 收款报表 -->
      <template v-if="activeTab === 'payment'">
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column label="支付方式" prop="method" width="120" />
          <el-table-column label="收款金额" width="130" align="right"><template #default="{row}">¥{{ row.amount?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="笔数" prop="count" width="80" align="center" />
          <el-table-column label="占比" width="100" align="center">
            <template #default="{row}">{{ row.percentage ? (row.percentage * 100).toFixed(1) + '%' : '—' }}</template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 品项卡报表 -->
      <template v-if="activeTab === 'cardReport'">
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column label="卡名称" prop="card_name" width="160" />
          <el-table-column label="售出数量" prop="sold_count" width="90" align="center" />
          <el-table-column label="售出金额" width="120" align="right"><template #default="{row}">¥{{ row.sold_amount?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="消耗数量" prop="consumed_count" width="90" align="center" />
          <el-table-column label="消耗金额" width="120" align="right"><template #default="{row}">¥{{ row.consumed_amount?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="剩余金额" width="120" align="right"><template #default="{row}">¥{{ row.remaining_amount?.toFixed(2) || '0.00' }}</template></el-table-column>
        </el-table>
      </template>

      <!-- 负债报表 -->
      <template v-if="activeTab === 'debt'">
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column label="类型" prop="type" width="120" />
          <el-table-column label="负债金额" width="130" align="right"><template #default="{row}">¥{{ row.amount?.toFixed(2) || '0.00' }}</template></el-table-column>
          <el-table-column label="涉及顾客" prop="customer_count" width="90" align="center" />
          <el-table-column label="说明" prop="description" min-width="200" />
        </el-table>
      </template>

      <el-empty v-if="!loading && !tableData.length && activeTab !== 'overview'" description="暂无数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api'

const activeTab = ref('overview')
const loading = ref(false)
const dateRange = ref<string[] | null>(null)
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
    const params: any = { start_date: range[0], end_date: range[1] }
    if (activeTab.value === 'overview') {
      const r: any = await reportApi.revenueSummary(params)
      overview.value = r.overview || r || {}
      tableData.value = r.items || r.daily_data || []
    } else if (activeTab.value === 'payment') {
      const r: any = await reportApi.revenueDetail(params)
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
    .kpi-val { display: block; font-size: 20px; font-weight: 700; color: #303133; }
  }
}
</style>
