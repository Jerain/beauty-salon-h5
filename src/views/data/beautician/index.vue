<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">美容师统计</span>
        <el-button icon="Download" @click="ElMessage.info('导出功能开发中')">导出</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="数据汇总" name="summary" />
        <el-tab-pane label="业绩汇总" name="performance" />
        <el-tab-pane label="提成汇总" name="commission" />
        <el-tab-pane label="服务评价" name="review" />
      </el-tabs>

      <div class="filter-bar">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-select v-model="filterStaff" placeholder="全部员工" style="width:140px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 数据汇总表 -->
      <template v-if="activeTab === 'summary'">
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column label="服务次数" prop="service_count" width="90" align="center" />
          <el-table-column label="业绩金额" width="120" align="right">
            <template #default="{row}">¥{{ row.revenue?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="新客数" prop="new_customer_count" width="80" align="center" />
          <el-table-column label="回头客" prop="return_customer_count" width="80" align="center" />
          <el-table-column label="好评数" prop="good_review_count" width="80" align="center" />
          <el-table-column label="提成" width="110" align="right">
            <template #default="{row}">¥{{ row.commission?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 业绩汇总 -->
      <template v-if="activeTab === 'performance'">
        <el-table :data="perfData" v-loading="loading" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column label="现金业绩" width="120" align="right">
            <template #default="{row}">¥{{ row.cash_revenue?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="实操业绩" width="120" align="right">
            <template #default="{row}">¥{{ row.service_revenue?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="卡项销售" width="120" align="right">
            <template #default="{row}">¥{{ row.card_revenue?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="产品销售" width="120" align="right">
            <template #default="{row}">¥{{ row.product_revenue?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="总业绩" width="120" align="right">
            <template #default="{row}"><span style="color:#67C23A;font-weight:700">¥{{ row.total_revenue?.toFixed(2) || '0.00' }}</span></template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 提成汇总 -->
      <template v-if="activeTab === 'commission'">
        <el-table :data="commData" v-loading="loading" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column label="项目提成" width="120" align="right">
            <template #default="{row}">¥{{ row.project_commission?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="产品提成" width="120" align="right">
            <template #default="{row}">¥{{ row.product_commission?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="卡提成" width="120" align="right">
            <template #default="{row}">¥{{ row.card_commission?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="总提成" width="120" align="right">
            <template #default="{row}"><span style="color:#67C23A;font-weight:700">¥{{ row.total_commission?.toFixed(2) || '0.00' }}</span></template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 服务评价 -->
      <template v-if="activeTab === 'review'">
        <el-table :data="reviewData" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column prop="customer_name" label="顾客" width="120" />
          <el-table-column label="评分" width="100" align="center">
            <template #default="{row}"><el-rate v-model="row.score" disabled :max="5" size="small" /></template>
          </el-table-column>
          <el-table-column prop="content" label="评价内容" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间" width="160"><template #default="{row}">{{ row.created_at?.slice(0,10) }}</template></el-table-column>
        </el-table>
      </template>

      <el-empty v-if="!loading && !getActiveTableData().length" description="暂无数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi, staffApi } from '@/api'

const activeTab = ref('summary')
const loading = ref(false)
const dateRange = ref<string[] | null>(null)
const filterStaff = ref('')
const staffList = ref<any[]>([])

const tableData = ref<any[]>([])
const perfData = ref<any[]>([])
const commData = ref<any[]>([])
const reviewData = ref<any[]>([])

const getDefaultRange = () => {
  const end = new Date()
  const start = new Date(); start.setDate(start.getDate() - 30)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

const getActiveTableData = () => {
  if (activeTab.value === 'summary') return tableData.value
  if (activeTab.value === 'performance') return perfData.value
  if (activeTab.value === 'commission') return commData.value
  return reviewData.value
}

const loadData = async () => {
  loading.value = true
  const range = dateRange.value || getDefaultRange()
  try {
    const params: any = { start_date: range[0], end_date: range[1] }
    if (filterStaff.value) params.staff_id = filterStaff.value

    if (activeTab.value === 'summary' || activeTab.value === 'performance') {
      const r: any = await reportApi.staffPerformance(params)
      const items = r.items || (Array.isArray(r) ? r : [])
      if (activeTab.value === 'summary') tableData.value = items
      else perfData.value = items
    } else if (activeTab.value === 'commission') {
      const r: any = await reportApi.staffPerformance({ ...params, type: 'commission' })
      commData.value = r.items || (Array.isArray(r) ? r : [])
    } else {
      reviewData.value = []
    }
  } catch {} finally { loading.value = false }
}

onMounted(async () => {
  try { const r: any = await staffApi.list({ page: 1, page_size: 100 }); staffList.value = r.items || [] } catch {}
  dateRange.value = getDefaultRange()
  loadData()
})
</script>

<style lang="scss" scoped>
</style>
