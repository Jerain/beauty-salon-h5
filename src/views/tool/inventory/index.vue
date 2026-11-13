<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">库存管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Upload" @click="openOperate('inbound')">产品入库</el-button>
          <el-button icon="Download" @click="openOperate('outbound')">产品出库</el-button>
        </div>
      </div>

      <!-- 状态面板 -->
      <div class="status-panel">
        <div class="status-item"><span class="status-num">{{ totalItems }}</span><span class="status-label">库存品类</span></div>
        <div class="status-item"><span class="status-num">{{ totalQty }}</span><span class="status-label">库存总量</span></div>
        <div class="status-item warning"><span class="status-num">{{ alertCount }}</span><span class="status-label">库存预警</span></div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="库存列表" name="list" />
        <el-tab-pane label="出入库记录" name="logs" />
        <el-tab-pane label="库存预警" name="alerts" />
      </el-tabs>

      <!-- 库存列表 -->
      <template v-if="activeTab === 'list'">
        <div class="filter-bar">
          <el-input v-model="search" placeholder="产品名称搜索" prefix-icon="Search" style="width:200px" clearable @keyup.enter="loadList" @clear="loadList" />
          <el-button icon="Search" @click="loadList">查询</el-button>
        </div>
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column prop="product_name" label="产品名称" min-width="160" />
          <el-table-column prop="brand_name" label="品牌" width="100" />
          <el-table-column label="当前库存" width="100" align="center">
            <template #default="{row}">
              <span :style="{color: row.quantity <= (row.stock_alert_value||5) ? '#F56C6C' : '#303133', fontWeight:700}">{{ row.quantity }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock_alert_value" label="预警值" width="80" align="center" />
          <el-table-column label="最后入库" width="120">
            <template #default="{row}">{{ row.last_inbound_at?.slice(0,10) || '—' }}</template>
          </el-table-column>
          <el-table-column label="最后出库" width="120">
            <template #default="{row}">{{ row.last_outbound_at?.slice(0,10) || '—' }}</template>
          </el-table-column>
          <el-table-column label="到期日" width="110">
            <template #default="{row}">{{ row.expire_date || '—' }}</template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" @size-change="loadList" @current-change="loadList" />
        </div>
      </template>

      <!-- 出入库记录 -->
      <template v-if="activeTab === 'logs'">
        <div class="filter-bar">
          <el-date-picker v-model="logDateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadLogs" />
          <el-button icon="Search" @click="loadLogs">查询</el-button>
        </div>
        <el-table :data="logData" v-loading="logLoading" stripe border>
          <el-table-column label="时间" width="160"><template #default="{row}">{{ row.created_at?.slice(0,16).replace('T',' ') }}</template></el-table-column>
          <el-table-column prop="product_name" label="产品" width="160" />
          <el-table-column label="类型" width="90">
            <template #default="{row}">
              <el-tag :type="row.change_type==='inbound'?'success':(row.change_type==='outbound'?'danger':'warning')" size="small">
                {{ ({inbound:'入库',outbound:'出库',adjust:'调整',return:'退货'})[row.change_type] || row.change_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="80" align="center">
            <template #default="{row}">
              <span :style="{color: row.change_type==='inbound'||row.change_type==='return'?'#67C23A':'#F56C6C'}">
                {{ row.change_type==='inbound'||row.change_type==='return'?'+':'-' }}{{ Math.abs(row.change_quantity) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="变动前" width="70" align="center" prop="before_quantity" />
          <el-table-column label="变动后" width="70" align="center" prop="after_quantity" />
          <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
        </el-table>
      </template>

      <!-- 库存预警 -->
      <template v-if="activeTab === 'alerts'">
        <el-table :data="alertData" v-loading="alertLoading" stripe border>
          <el-table-column prop="product_name" label="产品名称" min-width="160" />
          <el-table-column label="当前库存" width="100" align="center">
            <template #default="{row}"><span style="color:#F56C6C;font-weight:700">{{ row.stock_quantity }}</span></template>
          </el-table-column>
          <el-table-column prop="stock_alert_value" label="预警值" width="80" align="center" />
          <el-table-column label="预警类型" width="100">
            <template #default="{row}">
              <el-tag type="danger" size="small">{{ row.alert_type === 'low_stock' ? '库存不足' : '即将过期' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{row}">
              <el-button link type="primary" @click="quickInbound(row)">快速入库</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>

    <!-- 入库/出库弹窗 -->
    <el-dialog v-model="showOperateDlg" :title="operateForm.change_type === 'inbound' ? '产品入库' : '产品出库'" width="480px" destroy-on-close>
      <el-form :model="operateForm" label-width="80px">
        <el-form-item label="产品">
          <el-select v-model="operateForm.product_id" filterable placeholder="搜索产品" remote :remote-method="searchProduct" :loading="productLoading">
            <el-option v-for="p in productOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量"><el-input-number v-model="operateForm.quantity" :min="1" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="operateForm.reason" placeholder="入库/出库原因" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOperateDlg=false">取消</el-button>
        <el-button type="primary" :loading="operateSaving" @click="saveOperate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { inventoryApi, productApi } from '@/api'

const activeTab = ref('list')
const loading = ref(false)
const tableData = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const search = ref('')

const totalItems = computed(() => total.value)
const totalQty = computed(() => tableData.value.reduce((s, r) => s + (r.quantity || 0), 0))
const alertCount = ref(0)

const loadList = async () => {
  loading.value = true
  try {
    const p: any = { page: page.value, page_size: pageSize.value }
    if (search.value) p.search = search.value
    const r: any = await inventoryApi.list(p)
    tableData.value = r.items || []
    total.value = r.total || 0
  } catch { tableData.value = [] } finally { loading.value = false }
}

// 出入库记录
const logData = ref<any[]>([])
const logLoading = ref(false)
const logDateRange = ref<string[] | null>(null)

const loadLogs = async () => {
  logLoading.value = true
  try {
    const p: any = {}
    if (logDateRange.value) { p.start_date = logDateRange.value[0]; p.end_date = logDateRange.value[1] }
    const r: any = await inventoryApi.logs(p)
    logData.value = r.items || r || []
  } catch { logData.value = [] } finally { logLoading.value = false }
}

// 预警
const alertData = ref<any[]>([])
const alertLoading = ref(false)

const loadAlerts = async () => {
  alertLoading.value = true
  try {
    const r: any = await inventoryApi.alerts()
    alertData.value = Array.isArray(r) ? r : (r.items || [])
    alertCount.value = alertData.value.length
  } catch { alertData.value = [] } finally { alertLoading.value = false }
}

const onTabChange = () => {
  if (activeTab.value === 'list') loadList()
  if (activeTab.value === 'logs') loadLogs()
  if (activeTab.value === 'alerts') loadAlerts()
}

// 入库/出库
const showOperateDlg = ref(false)
const operateSaving = ref(false)
const operateForm = ref<any>({})
const productOptions = ref<any[]>([])
const productLoading = ref(false)

const openOperate = (type: string) => {
  operateForm.value = { product_id: null, change_type: type, quantity: 1, reason: '' }
  productOptions.value = []
  showOperateDlg.value = true
}

const quickInbound = (row: any) => {
  operateForm.value = { product_id: row.product_id, change_type: 'inbound', quantity: 10, reason: '补货入库' }
  productOptions.value = [{ id: row.product_id, name: row.product_name }]
  showOperateDlg.value = true
}

const searchProduct = async (q: string) => {
  if (!q) return
  productLoading.value = true
  try {
    const r: any = await productApi.list({ search: q, page: 1, page_size: 10 })
    productOptions.value = r.items || []
  } catch {} finally { productLoading.value = false }
}

const saveOperate = async () => {
  if (!operateForm.value.product_id) { ElMessage.warning('请选择产品'); return }
  operateSaving.value = true
  try {
    await inventoryApi.operate(operateForm.value)
    ElMessage.success(operateForm.value.change_type === 'inbound' ? '入库成功' : '出库成功')
    showOperateDlg.value = false
    loadList()
    loadAlerts()
  } catch {} finally { operateSaving.value = false }
}

onMounted(() => { loadList(); loadAlerts() })
</script>

<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
.status-panel {
  display: flex; gap: 16px; margin-bottom: 20px;
  .status-item {
    flex: 1; text-align: center; padding: 16px; border-radius: 8px;
    background: #F5F7FA; border: 1px solid #EBEEF5;
    .status-num { display: block; font-size: 24px; font-weight: 700; color: #303133; }
    .status-label { font-size: 13px; color: #909399; }
    &.warning .status-num { color: #E6A23C; }
  }
}
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
