<template>
  <div class="page-container">
    <div class="card">
      <!-- 主标签 -->
      <el-tabs v-model="mainTab" @tab-change="onTabChange">
        <el-tab-pane label="成本核算" name="summary" />
        <el-tab-pane label="成本调整" name="adjust" />
        <el-tab-pane label="成本调整记录" name="records" />
      </el-tabs>

      <!-- ====== 成本核算标签 ====== -->
      <template v-if="mainTab === 'summary'">
        <div class="section-title">
          <span>成本核算规则</span>
          <el-tooltip content="采用移动加权平均法：每次入库重新计算加权平均单价，出库时按当前加权平均单价计算出库成本" placement="top">
            <el-icon style="cursor:pointer;color:#909399"><InfoFilled /></el-icon>
          </el-tooltip>
          <el-button type="primary" size="small" style="margin-left:auto" @click="exportReport">报表下载</el-button>
        </div>

        <!-- 筛选 -->
        <div class="filter-bar">
          <el-select v-model="costFilters.warehouse" placeholder="全部仓库" clearable filterable style="width:130px" @change="loadCostSummary">
            <el-option label="全部仓库" value="" />
            <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="costFilters.brand" placeholder="全部品牌" clearable filterable style="width:120px" @change="loadCostSummary">
            <el-option label="全部品牌" value="" />
            <el-option v-for="b in brandList" :key="b.id" :label="b.name" :value="b.name" />
          </el-select>
          <el-select v-model="costFilters.category" placeholder="请选择产品类别" clearable style="width:140px" @change="loadCostSummary">
            <el-option v-for="c in categoryList" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-date-picker v-model="costFilters.dateRange" type="daterange" range-separator="~" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:260px" :shortcuts="dateShortcuts" @change="loadCostSummary" />
          <el-input v-model="costFilters.keyword" placeholder="产品名称/编号" clearable prefix-icon="Search" style="width:170px" />
          <el-button type="primary" @click="loadCostSummary">查询</el-button>
        </div>

        <!-- 成本汇总卡片 -->
        <div class="cost-cards">
          <div class="cost-card"><span class="cost-label">期初成本总额</span><span class="cost-value">￥{{ formatMoney(costSummary.opening_cost) }}</span></div>
          <div class="cost-card"><span class="cost-label">入库成本总额</span><span class="cost-value">￥{{ formatMoney(costSummary.inbound_cost) }}</span></div>
          <div class="cost-card"><span class="cost-label">出库成本总额</span><span class="cost-value">￥{{ formatMoney(costSummary.outbound_cost) }}</span></div>
          <div class="cost-card highlight"><span class="cost-label">期末成本总额</span><span class="cost-value">￥{{ formatMoney(costSummary.closing_cost) }}</span></div>
        </div>
      </template>

      <!-- ====== 成本调整标签 ====== -->
      <template v-if="mainTab === 'adjust'">
        <div class="filter-bar">
          <el-select v-model="adjustFilters.warehouse" placeholder="全部仓库" clearable filterable style="width:140px">
            <el-option label="全部仓库" value="" />
            <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="adjustFilters.operator" placeholder="负责人" clearable filterable style="width:130px">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </div>

        <div class="action-bar">
          <el-button @click="exportAdjust">导出调整</el-button>
          <el-button @click="importAdjust">导入调整</el-button>
          <el-button @click="showProductPicker = true">添加产品</el-button>
        </div>

        <el-table :data="adjustItems" stripe border size="small" style="width:100%">
          <el-table-column prop="product_code" label="产品编码" width="100">
            <template #default="{row}">{{ row.product_code || '—' }}</template>
          </el-table-column>
          <el-table-column prop="product_name" label="产品名称" min-width="140" />
          <el-table-column prop="unit" label="单位" width="60" align="center">
            <template #default="{row}">{{ row.unit || '—' }}</template>
          </el-table-column>
          <el-table-column prop="stock_quantity" label="库存余量" width="80" align="center" />
          <el-table-column label="成本单价" width="120" align="center">
            <template #default="{row}">
              <el-input-number v-model="row.new_cost_price" :min="0" :precision="2" size="small" controls-position="right" style="width:100px" @change="calcAdjustRow(row)" />
            </template>
          </el-table-column>
          <el-table-column label="成本总额" width="110" align="right">
            <template #default="{row}">{{ (row.cost_total || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="备注" width="140">
            <template #default="{row}">
              <el-input v-model="row.remark" size="small" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="adjustItems.splice($index, 1)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 合计行 -->
        <div v-if="adjustItems.length" class="adjust-total">
          合计 | 库存余量：{{ adjustTotalQty }} | 成本总额：￥{{ adjustTotalCost.toFixed(2) }}
        </div>

        <!-- 底部 -->
        <div class="adjust-footer">
          <el-input v-model="adjustRemark" placeholder="备注" style="width:400px" />
          <div style="display:flex;gap:8px">
            <el-button @click="mainTab = 'summary'">取消</el-button>
            <el-button type="primary" :loading="adjustSaving" @click="submitAdjustment">提交</el-button>
          </div>
        </div>
      </template>

      <!-- ====== 成本调整记录标签 ====== -->
      <template v-if="mainTab === 'records'">
        <div class="filter-bar">
          <el-select v-model="recordFilters.warehouse" placeholder="全部仓库" clearable style="width:130px">
            <el-option label="全部仓库" value="" />
            <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-date-picker v-model="recordFilters.dateRange" type="daterange" range-separator="~" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:260px" />
          <el-input v-model="recordFilters.keyword" placeholder="产品名称/编号" clearable style="width:170px" />
          <el-button type="primary" @click="loadRecords">查询</el-button>
        </div>

        <el-table :data="records" v-loading="recordLoading" stripe border style="width:100%">
          <el-table-column prop="order_no" label="单号" width="180" />
          <el-table-column prop="warehouse_name" label="所属仓库" width="140" />
          <el-table-column prop="created_at" label="调整时间" width="170" sortable>
            <template #default="{row}">{{ row.created_at?.slice(0,16).replace('T',' ') || '—' }}</template>
          </el-table-column>
          <el-table-column prop="creator_name" label="制单人" width="100" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-button link type="primary" size="small" @click="viewRecord(row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination v-model:current-page="recordPage" :total="recordTotal" :page-size="20" layout="total,prev,pager,next" @current-change="loadRecords" />
        </div>
      </template>
    </div>

    <!-- 产品选择弹窗 -->
    <el-dialog v-model="showProductPicker" title="添加产品" width="550px" destroy-on-close>
      <el-input v-model="productSearch" placeholder="搜索产品" prefix-icon="Search" @input="searchProducts" style="margin-bottom:12px" />
      <el-table :data="productOptions" v-loading="productLoading" stripe border size="small" @row-click="addAdjustProduct" highlight-current-row style="cursor:pointer">
        <el-table-column prop="product_name" label="产品名称" />
        <el-table-column prop="stock_quantity" label="库存余量" width="80" align="center" />
        <el-table-column label="当前成本价" width="100" align="right">
          <template #default="{row}">{{ (row.cost_price || 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 调整详情弹窗 -->
    <el-dialog v-model="showRecordDlg" title="调整详情" width="700px" destroy-on-close>
      <template v-if="recordDetail">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="单号">{{ recordDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ recordDetail.warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="经办人">{{ recordDetail.operator_name }}</el-descriptions-item>
          <el-descriptions-item label="制单人">{{ recordDetail.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ recordDetail.created_at?.slice(0,16).replace('T',' ') }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ recordDetail.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="recordDetail.items" stripe border size="small" style="margin-top:12px">
          <el-table-column prop="product_name" label="产品名称" />
          <el-table-column prop="stock_quantity" label="库存余量" width="80" align="center" />
          <el-table-column label="调整前单价" width="100" align="right">
            <template #default="{row}">{{ (row.old_cost_price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="调整后单价" width="100" align="right">
            <template #default="{row}">{{ (row.new_cost_price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="成本总额" width="100" align="right">
            <template #default="{row}">{{ (row.cost_total || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" width="120" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { costApi, shopApi, brandApi, categoryApi, staffApi, inventoryApi } from '@/api'

const mainTab = ref('summary')

// === Options ===
const shopList = ref<any[]>([])
const brandList = ref<any[]>([])
const categoryList = ref<any[]>([])
const staffList = ref<any[]>([])

const dateShortcuts = [
  { text: '本月', value: () => { const d = new Date(); return [new Date(d.getFullYear(), d.getMonth(), 1), d] } },
  { text: '近30天', value: () => { const d = new Date(); const s = new Date(d); s.setDate(s.getDate() - 29); return [s, d] } },
]

// === 成本核算 ===
const costFilters = ref({
  warehouse: '', brand: '', category: '', keyword: '',
  dateRange: null as string[] | null,
})

const costSummary = ref({ opening_cost: 0, inbound_cost: 0, outbound_cost: 0, closing_cost: 0 })

const formatMoney = (n: number) => (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

const loadCostSummary = async () => {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const params: any = {
    start_date: costFilters.value.dateRange?.[0] || fmt(firstDay),
    end_date: costFilters.value.dateRange?.[1] || fmt(today),
  }
  if (costFilters.value.warehouse) params.warehouse = costFilters.value.warehouse
  if (costFilters.value.brand) params.brand = costFilters.value.brand
  if (costFilters.value.category) params.category = costFilters.value.category

  try {
    const r: any = await costApi.summary(params)
    costSummary.value = r
  } catch {}
}

const exportReport = () => { ElMessage.info('报表下载功能开发中') }

// === 成本调整 ===
const adjustFilters = ref({ warehouse: '', operator: '' })
const adjustItems = ref<any[]>([])
const adjustRemark = ref('')
const adjustSaving = ref(false)

const adjustTotalQty = computed(() => adjustItems.value.reduce((s, i) => s + (i.stock_quantity || 0), 0))
const adjustTotalCost = computed(() => adjustItems.value.reduce((s, i) => s + (i.cost_total || 0), 0))

const calcAdjustRow = (row: any) => {
  row.cost_total = (row.stock_quantity || 0) * (row.new_cost_price || 0)
}

// Product picker
const showProductPicker = ref(false)
const productSearch = ref('')
const productLoading = ref(false)
const productOptions = ref<any[]>([])

const searchProducts = async () => {
  productLoading.value = true
  try {
    const r: any = await costApi.adjustableProducts({ warehouse: adjustFilters.value.warehouse })
    const list = Array.isArray(r) ? r : []
    productOptions.value = productSearch.value
      ? list.filter((p: any) => (p.product_name || '').includes(productSearch.value))
      : list
  } catch { productOptions.value = [] }
  finally { productLoading.value = false }
}

const addAdjustProduct = (prod: any) => {
  if (adjustItems.value.some(i => i.product_id === prod.product_id)) {
    ElMessage.warning('该产品已添加')
    return
  }
  adjustItems.value.push({
    product_id: prod.product_id,
    product_code: prod.product_code,
    product_name: prod.product_name,
    unit: prod.unit,
    stock_quantity: prod.stock_quantity,
    old_cost_price: prod.cost_price || 0,
    new_cost_price: prod.cost_price || 0,
    cost_total: (prod.stock_quantity || 0) * (prod.cost_price || 0),
    remark: '',
  })
  showProductPicker.value = false
}

const submitAdjustment = async () => {
  if (!adjustItems.value.length) { ElMessage.warning('请添加产品'); return }
  adjustSaving.value = true
  try {
    await costApi.submitAdjustment({
      warehouse_name: adjustFilters.value.warehouse,
      operator_name: adjustFilters.value.operator,
      remark: adjustRemark.value,
      items: adjustItems.value.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_code: i.product_code,
        unit: i.unit,
        stock_quantity: i.stock_quantity,
        new_cost_price: i.new_cost_price,
        remark: i.remark,
      })),
    })
    ElMessage.success('成本调整提交成功')
    adjustItems.value = []
    adjustRemark.value = ''
    mainTab.value = 'summary'
    loadCostSummary()
  } catch {}
  finally { adjustSaving.value = false }
}

const exportAdjust = () => { ElMessage.info('导出调整功能开发中') }
const importAdjust = () => { ElMessage.info('导入调整功能开发中') }

// === 调整记录 ===
const recordFilters = ref({ warehouse: '', dateRange: null as string[] | null, keyword: '' })
const records = ref<any[]>([])
const recordLoading = ref(false)
const recordPage = ref(1)
const recordTotal = ref(0)
const showRecordDlg = ref(false)
const recordDetail = ref<any>(null)

const loadRecords = async () => {
  recordLoading.value = true
  try {
    const params: any = { page: recordPage.value, page_size: 20 }
    if (recordFilters.value.warehouse) params.warehouse = recordFilters.value.warehouse
    if (recordFilters.value.dateRange) {
      params.start_date = recordFilters.value.dateRange[0]
      params.end_date = recordFilters.value.dateRange[1]
    }
    const r: any = await costApi.adjustmentRecords(params)
    records.value = r.items || []
    recordTotal.value = r.total || 0
  } catch { records.value = [] }
  finally { recordLoading.value = false }
}

const viewRecord = async (id: string) => {
  try {
    const r: any = await costApi.adjustmentDetail(id)
    recordDetail.value = r
    showRecordDlg.value = true
  } catch {}
}

const onTabChange = () => {
  if (mainTab.value === 'summary') loadCostSummary()
  if (mainTab.value === 'records') loadRecords()
  if (mainTab.value === 'adjust') searchProducts()
}

onMounted(async () => {
  const [shops, brands, cats, staffs] = await Promise.all([
    shopApi.list(), brandApi.list(), categoryApi.list(), staffApi.list(),
  ])
  shopList.value = (shops as any) || []
  brandList.value = (brands as any) || []
  categoryList.value = ((cats as any)?.items || (cats as any) || [])
  staffList.value = ((staffs as any)?.items || (staffs as any) || [])
  loadCostSummary()
})
</script>

<style lang="scss" scoped>
.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 600; margin-bottom: 16px;
}
.filter-bar {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
}
.cost-cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px;
  .cost-card {
    background: #F5F7FA; border: 1px solid #EBEEF5; border-radius: 8px;
    padding: 16px; text-align: center;
    .cost-label { display: block; font-size: 13px; color: #909399; margin-bottom: 8px; }
    .cost-value { display: block; font-size: 22px; font-weight: 700; color: #303133; }
    &.highlight { background: #ECF5FF; border-color: #B3D8FF; .cost-value { color: #409EFF; } }
  }
}
.action-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.adjust-total {
  margin-top: 8px; text-align: right; font-size: 13px; color: #606266;
  padding: 8px 12px; background: #FAFAFA; border: 1px solid #EBEEF5; border-radius: 4px;
}
.adjust-footer {
  margin-top: 16px; display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px solid #EBEEF5;
}
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
