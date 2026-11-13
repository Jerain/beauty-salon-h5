<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">订单管理</span>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="订单列表" name="all" />
        <el-tab-pane label="未完成订单" name="pending" />
        <el-tab-pane label="尾款单" name="arrears" />
      </el-tabs>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input v-model="search" placeholder="顾客姓名/手机号" prefix-icon="Search" style="width: 200px" clearable @keyup.enter="loadData" />
        <el-select v-model="filterStatus" placeholder="订单状态" style="width: 130px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="已完成" value="completed" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已取消" value="cancelled" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-select v-model="filterType" placeholder="消费类型" style="width: 130px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="服务" value="service" />
          <el-option label="产品" value="product" />
          <el-option label="开卡" value="card_open" />
          <el-option label="充值" value="card_recharge" />
        </el-select>
        <el-select v-model="filterVerify" placeholder="核对状态" style="width: 120px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="已核对" value="verified" />
          <el-option label="未核对" value="unverified" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 260px" @change="loadData" />
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column label="顾客信息" min-width="140">
          <template #default="{ row }">
            <div class="customer-cell">
              <span class="customer-name">{{ row.customer_name || '散客' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单编号" prop="order_no" width="180" sortable />
        <el-table-column label="订单时间" width="170" sortable sort-by="created_at">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="订单内容" min-width="220">
          <template #default="{ row }">
            <div class="order-items">
              <span v-for="(item, i) in (row.items || []).slice(0, 3)" :key="i" class="item-tag">
                {{ item.item_name }} x{{ item.quantity }}
              </span>
              <span v-if="(row.items || []).length > 3" class="item-more">+{{ row.items.length - 3 }}项</span>
              <span v-if="!row.items?.length" style="color: #C0C4CC;">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单合计" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.total_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实付" width="110" align="right">
          <template #default="{ row }">
            <span style="color: #67C23A; font-weight: 600;">¥{{ row.paid_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核对" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.verify_status === 'verified' ? 'success' : 'info'" size="small">
              {{ row.verify_status === 'verified' ? '✓' : '○' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
            <el-button v-if="row.status === 'completed'" link type="warning" @click="handleRefund(row)">退单</el-button>
            <el-button v-if="row.status === 'in_progress'" link type="danger" @click="handleCancel(row)">撤销</el-button>
            <el-button v-if="row.verify_status === 'unverified'" link type="primary" @click="handleVerify(row)">核对</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="showDetail" title="订单详情" width="720px" destroy-on-close>
      <div v-if="currentOrder" class="detail-content">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="顾客">{{ currentOrder.customer_name || '散客' }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ currentOrder.order_type }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="statusType(currentOrder.status)" size="small">{{ statusLabel(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentOrder.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="核对状态">{{ currentOrder.verify_status === 'verified' ? '已核对' : '未核对' }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ currentOrder.total_amount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥{{ currentOrder.discount_amount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span style="color: #67C23A; font-weight: 700;">¥{{ currentOrder.paid_amount?.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ currentOrder.remark || '—' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 项目明细 -->
        <h4 style="margin: 16px 0 8px;">项目明细</h4>
        <el-table :data="currentOrder.items || []" size="small" border>
          <el-table-column prop="item_name" label="项目名称" />
          <el-table-column prop="item_type" label="类型" width="80" />
          <el-table-column prop="quantity" label="数量" width="60" align="center" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">¥{{ row.unit_price?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="折扣" width="70" align="center">
            <template #default="{ row }">{{ row.discount?.toFixed(0) }}%</template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <!-- 支付明细 -->
        <h4 style="margin: 16px 0 8px;">支付明细</h4>
        <el-table :data="currentOrder.payments || []" size="small" border>
          <el-table-column prop="payment_method_name" label="支付方式" />
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi } from '@/api'

const router = useRouter()

const tableData = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const activeTab = ref('all')
const search = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterVerify = ref('')
const dateRange = ref<string[] | null>(null)

const showDetail = ref(false)
const currentOrder = ref<any>(null)

const statusMap: Record<string, { label: string; type: string }> = {
  completed: { label: '已完成', type: 'success' },
  paid: { label: '已支付', type: 'success' },
  in_progress: { label: '进行中', type: 'warning' },
  pending: { label: '待处理', type: 'warning' },
  cancelled: { label: '已取消', type: 'info' },
  refunded: { label: '已退款', type: 'danger' },
  held: { label: '挂单', type: '' },
  partial_refund: { label: '部分退款', type: 'warning' },
}
const statusLabel = (v: string) => statusMap[v]?.label || v
const statusType = (v: string): any => statusMap[v]?.type || 'info'

const formatDate = (d: string) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterType.value) params.order_type = filterType.value
    if (filterVerify.value) params.verify_status = filterVerify.value
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    if (activeTab.value === 'pending') params.status = 'in_progress'
    if (activeTab.value === 'arrears') params.has_arrears = 'true'

    const res: any = await orderApi.list(params)
    tableData.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    console.error('加载订单列表失败', e)
  } finally {
    loading.value = false
  }
}

const goDetail = async (id: string) => {
  try {
    currentOrder.value = await orderApi.detail(id) as any
    showDetail.value = true
  } catch (e: any) {
    console.error(e)
  }
}

const handleCancel = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定撤销订单「${row.order_no}」？`, '确认撤销', { type: 'warning' })
    await orderApi.cancel(row.id)
    ElMessage.success('订单已撤销')
    loadData()
  } catch { /* cancelled */ }
}

const handleRefund = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定退单「${row.order_no}」？将全额退款 ¥${row.paid_amount?.toFixed(2)}`, '确认退单', { type: 'warning' })
    await orderApi.refund(row.id, { refund_type: 'full', refund_amount: row.paid_amount, refund_method: 'original' })
    ElMessage.success('退单成功')
    loadData()
  } catch { /* cancelled */ }
}

const handleVerify = async (row: any) => {
  try {
    await orderApi.verify(row.id)
    ElMessage.success('已核对')
    loadData()
  } catch (e: any) {
    console.error(e)
  }
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.customer-cell {
  .customer-name { font-weight: 600; color: #303133; }
}
.order-items {
  display: flex; flex-wrap: wrap; gap: 4px;
  .item-tag {
    display: inline-block; padding: 2px 8px; background: #F5F7FA;
    border-radius: 4px; font-size: 12px; color: #606266;
  }
  .item-more { font-size: 12px; color: #909399; }
}
.amount { font-weight: 700; color: #303133; }
.detail-content { max-height: 70vh; overflow-y: auto; }
</style>
