<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">系统日志</span>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadLogs">
        <el-tab-pane label="订单操作" name="order" />
        <el-tab-pane label="顾客操作" name="customer" />
        <el-tab-pane label="会员卡操作" name="card" />
        <el-tab-pane label="品项操作" name="item" />
        <el-tab-pane label="员工操作" name="staff" />
        <el-tab-pane label="其他操作" name="other" />
      </el-tabs>

      <div class="filter-bar">
        <el-input v-model="search" placeholder="搜索事件/操作人" prefix-icon="Search" style="width:200px" clearable @keyup.enter="loadLogs" @clear="loadLogs" />
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadLogs" />
        <el-button icon="Search" @click="loadLogs">查询</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column label="时间" width="170">
          <template #default="{row}">{{ row.created_at?.slice(0,19).replace('T',' ') }}</template>
        </el-table-column>
        <el-table-column label="操作类型" width="100">
          <template #default="{row}">
            <el-tag :type="tagType(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column label="对象" width="120" prop="target_type" />
        <el-table-column prop="description" label="操作内容" min-width="240" show-overflow-tooltip />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20,50,100]" layout="total,sizes,prev,pager,next" @size-change="loadLogs" @current-change="loadLogs" />
      </div>

      <el-empty v-if="!loading && !tableData.length" description="暂无日志记录" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const activeTab = ref('order')
const loading = ref(false)
const tableData = ref<any[]>([])
const search = ref('')
const dateRange = ref<string[] | null>(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const actionLabel = (action: string) => {
  const m: Record<string, string> = { create: '新增', update: '修改', delete: '删除', refund: '退款', verify: '核销', login: '登录' }
  return m[action] || action
}

const tagType = (action: string) => {
  if (action === 'create' || action === 'login') return 'success'
  if (action === 'delete' || action === 'refund') return 'danger'
  if (action === 'update' || action === 'verify') return 'warning'
  return 'info'
}

const loadLogs = async () => {
  loading.value = true
  try {
    // 日志API暂未实现，展示空数据
    tableData.value = []
    total.value = 0
  } catch { tableData.value = [] } finally { loading.value = false }
}

onMounted(() => loadLogs())
</script>

<style lang="scss" scoped>
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
