<template>
  <div class="page-container">
    <!-- 主标签：入库记录 / 出库记录 -->
    <el-tabs v-model="mainTab" @tab-change="onMainTabChange">
      <el-tab-pane label="入库记录" name="inbound" />
      <el-tab-pane label="出库记录" name="outbound" />
    </el-tabs>

    <!-- 子标签 -->
    <el-tabs v-model="subTab" type="card" @tab-change="onSubTabChange" class="sub-tabs">
      <template v-if="mainTab === 'inbound'">
        <el-tab-pane label="入库明细" name="detail" />
        <el-tab-pane label="入库单记录" name="order" />
      </template>
      <template v-else>
        <el-tab-pane label="出库明细" name="detail" />
        <el-tab-pane label="出库单记录" name="order" />
      </template>
    </el-tabs>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <div class="action-left">
        <template v-if="mainTab === 'inbound'">
          <el-button link type="primary" @click="$router.push('/operate/inventory/warehousing?type=inbound')">导入入库</el-button>
          <el-button link type="primary" @click="$router.push('/operate/inventory/warehousing?type=inbound')">产品入库</el-button>
        </template>
        <template v-else>
          <el-button link type="primary" @click="$router.push('/operate/inventory/warehousing?type=outbound')">产品出库</el-button>
        </template>
      </div>
      <div class="action-right">
        <el-button type="primary" link>报表下载</el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-bar">
      <template v-if="subTab === 'detail'">
        <!-- 明细筛选 -->
        <el-select v-model="filters.warehouse" placeholder="全部门店" clearable style="width:140px" @change="loadData">
          <el-option label="全部门店" value="" />
          <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
        </el-select>
        <el-select v-model="filters.stockType" :placeholder="mainTab === 'inbound' ? '请选择入库类型' : '请选择类型'" clearable style="width:150px" @change="loadData">
          <template v-if="mainTab === 'inbound'">
            <el-option v-for="t in inboundTypes" :key="t" :label="t" :value="t" />
          </template>
          <template v-else>
            <el-option v-for="t in outboundTypes" :key="t" :label="t" :value="t" />
          </template>
        </el-select>
        <el-select v-model="filters.brand" placeholder="请选择品牌" clearable style="width:130px" @change="loadData">
          <el-option v-for="b in brandList" :key="b.id" :label="b.name" :value="b.name" />
        </el-select>
        <el-select v-model="filters.category" placeholder="请选择分类" clearable style="width:130px" @change="loadData">
          <el-option v-for="c in categoryList" :key="c.id" :label="c.name" :value="c.name" />
        </el-select>
        <el-date-picker v-model="filters.dateRange" type="daterange" :range-separator="'~'" :start-placeholder="mainTab === 'inbound' ? '入库开始日期' : '出库开始日期'" :end-placeholder="mainTab === 'inbound' ? '入库结束日期' : '出库结束日期'" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-input v-model="filters.keyword" placeholder="产品名称/编号/单据号" prefix-icon="Search" clearable style="width:200px" @keyup.enter="loadData" @clear="loadData" />
      </template>
      <template v-else>
        <!-- 单据记录筛选 -->
        <el-select v-model="filters.warehouse" placeholder="全部仓库" clearable style="width:140px" @change="loadData">
          <el-option label="全部仓库" value="" />
          <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
        </el-select>
        <template v-if="mainTab === 'inbound'">
          <el-select v-model="filters.supplier" placeholder="请选择供应商" clearable filterable style="width:150px" @change="loadData">
            <el-option v-for="s in supplierList" :key="s" :label="s" :value="s" />
          </el-select>
        </template>
        <template v-else>
          <el-select v-model="filters.customer" placeholder="请选择客户" clearable filterable style="width:150px" @change="loadData">
            <el-option v-for="c in customerList" :key="c" :label="c" :value="c" />
          </el-select>
        </template>
        <el-date-picker v-model="filters.dateRange" type="daterange" :range-separator="'~'" :start-placeholder="mainTab === 'inbound' ? '入库开始日期' : '出库开始日期'" :end-placeholder="mainTab === 'inbound' ? '入库结束日期' : '出库结束日期'" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-input v-model="filters.orderNo" placeholder="单据号" clearable style="width:160px" @keyup.enter="loadData" @clear="loadData" />
      </template>
    </div>

    <!-- 汇总信息（仅明细标签） -->
    <div v-if="subTab === 'detail'" class="summary-bar">
      <span>{{ mainTab === 'inbound' ? '入库数量' : '出库数量' }}</span>
      <span>当前页汇总：<b>{{ pageQty }}</b></span>
      <span>|</span>
      <span>汇总：<b>{{ totalQty }}</b></span>
    </div>

    <!-- 明细表格 -->
    <template v-if="subTab === 'detail'">
      <el-table :data="detailData" v-loading="loading" stripe border :default-sort="{ prop: 'created_at', order: 'descending' }" @sort-change="onSortChange" style="width:100%">
        <el-table-column prop="order_no" :label="mainTab === 'inbound' ? '入库单号' : '出库单号'" width="150" fixed />
        <el-table-column prop="created_at" label="操作时间" width="160" sortable="custom">
          <template #default="{row}">{{ row.created_at?.slice(0,16).replace('T',' ') || '—' }}</template>
        </el-table-column>
        <el-table-column prop="order_time" :label="mainTab === 'inbound' ? '入库时间' : '出库时间'" width="160" sortable="custom">
          <template #default="{row}">{{ row.order_time?.slice(0,16).replace('T',' ') || '—' }}</template>
        </el-table-column>
        <el-table-column prop="warehouse_name" :label="mainTab === 'inbound' ? '入库仓库' : '出库仓库'" width="110" />
        <el-table-column prop="stock_type" :label="mainTab === 'inbound' ? '入库类型' : '出库类型'" width="90">
          <template #default="{row}">
            <el-tag size="small" :type="row.stock_type === '采购' ? 'success' : (row.stock_type === '退单' || row.stock_type === '盘盈' ? 'warning' : '')">{{ row.stock_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand_name" label="产品品牌" width="90" />
        <el-table-column prop="category_name" label="产品品类" width="90" />
        <el-table-column prop="product_name" label="产品信息" min-width="150" show-overflow-tooltip />
        <el-table-column prop="quantity" :label="mainTab === 'inbound' ? '入库数量' : '出库数量'" width="90" align="center" />
        <el-table-column prop="production_date" label="生产日期" width="110">
          <template #default="{row}">{{ row.production_date || '—' }}</template>
        </el-table-column>
        <el-table-column prop="shelf_life_months" label="保质期/月" width="90" align="center">
          <template #default="{row}">{{ row.shelf_life_months || '—' }}</template>
        </el-table-column>
        <el-table-column prop="expire_date" label="到期时间" width="110">
          <template #default="{row}">{{ row.expire_date || '—' }}</template>
        </el-table-column>
        <el-table-column prop="batch_no" label="批次" width="90">
          <template #default="{row}">{{ row.batch_no || '—' }}</template>
        </el-table-column>
        <el-table-column prop="creator_name" label="制单人" width="90" />
        <el-table-column label="操作" width="70" fixed="right">
          <template #default><el-button link type="primary" size="small">查看</el-button></template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 单据记录表格 -->
    <template v-if="subTab === 'order'">
      <el-table :data="orderData" v-loading="loading" stripe border :default-sort="{ prop: 'created_at', order: 'descending' }" @sort-change="onSortChange" style="width:100%">
        <el-table-column prop="order_no" :label="mainTab === 'inbound' ? '入库单号' : '出库单号'" width="180" />
        <el-table-column prop="created_at" label="操作时间" width="160" sortable="custom">
          <template #default="{row}">{{ row.created_at?.slice(0,16).replace('T',' ') || '—' }}</template>
        </el-table-column>
        <el-table-column prop="order_time" :label="mainTab === 'inbound' ? '入库时间' : '出库时间'" width="160" sortable="custom">
          <template #default="{row}">{{ row.order_time?.slice(0,16).replace('T',' ') || '—' }}</template>
        </el-table-column>
        <el-table-column prop="warehouse_name" :label="mainTab === 'inbound' ? '入库仓库' : '出库仓库'" width="130" />
        <el-table-column prop="stock_type" :label="mainTab === 'inbound' ? '入库类型' : '出库类型'" width="100">
          <template #default="{row}">
            <el-tag size="small">{{ row.stock_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="制单人" width="100" />
        <el-table-column label="操作" width="80">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="viewOrder(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" @size-change="loadData" @current-change="loadData" />
    </div>

    <!-- 单据详情弹窗 -->
    <el-dialog v-model="showOrderDlg" title="单据详情" width="700px" destroy-on-close>
      <template v-if="orderDetail">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="单据号">{{ orderDetail.order_no }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ orderDetail.stock_type }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ orderDetail.warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="经办人">{{ orderDetail.operator_name }}</el-descriptions-item>
          <el-descriptions-item label="制单人">{{ orderDetail.creator_name }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ orderDetail.order_time?.slice(0,16).replace('T',' ') }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ orderDetail.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="orderDetail.items" stripe border size="small" style="margin-top:12px">
          <el-table-column prop="product_name" label="产品名称" />
          <el-table-column prop="product_code" label="编号" width="100" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="cost_price" label="成本价" width="90" align="right" />
          <el-table-column prop="cost_total" label="成本总额" width="100" align="right" />
          <el-table-column prop="batch_no" label="批次" width="90" />
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { stockOrderApi, shopApi, brandApi, categoryApi } from '@/api'

const mainTab = ref('inbound')
const subTab = ref('detail')
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const pageQty = ref(0)
const totalQty = ref(0)
const sortField = ref('created_at')
const sortOrder = ref('desc')

const detailData = ref<any[]>([])
const orderData = ref<any[]>([])

const filters = ref({
  warehouse: '',
  stockType: '',
  brand: '',
  category: '',
  dateRange: null as string[] | null,
  keyword: '',
  supplier: '',
  customer: '',
  orderNo: '',
})

const inboundTypes = ['采购', '调拨', '退单', '盘盈', '调拨拒收', '出库撤销', '其他']
const outboundTypes = ['销售', '盘亏', '报损', '调拨', '其他']
const shopList = ref<any[]>([])
const brandList = ref<any[]>([])
const categoryList = ref<any[]>([])
const supplierList = ref<string[]>([])
const customerList = ref<string[]>([])

const showOrderDlg = ref(false)
const orderDetail = ref<any>(null)

// Load options
const loadOptions = async () => {
  try {
    const [shops, brands, cats] = await Promise.all([
      shopApi.list(), brandApi.list(), categoryApi.list(),
    ])
    shopList.value = (shops as any) || []
    brandList.value = (brands as any) || []
    categoryList.value = ((cats as any)?.items || (cats as any) || [])
  } catch {}
}

// Load data
const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      order_type: mainTab.value,
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.value.warehouse) params.warehouse = filters.value.warehouse
    if (filters.value.stockType) params.stock_type = filters.value.stockType
    if (filters.value.brand) params.brand = filters.value.brand
    if (filters.value.category) params.category = filters.value.category
    if (filters.value.dateRange) {
      params.start_date = filters.value.dateRange[0]
      params.end_date = filters.value.dateRange[1]
    }
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.supplier) params.supplier = filters.value.supplier
    if (filters.value.customer) params.customer = filters.value.customer
    if (filters.value.orderNo) params.order_no = filters.value.orderNo
    if (sortField.value) {
      params.sort_field = sortField.value
      params.sort_order = sortOrder.value
    }

    if (subTab.value === 'detail') {
      const r: any = await stockOrderApi.details(params)
      detailData.value = r.items || []
      total.value = r.total || 0
      pageQty.value = r.page_qty || 0
      totalQty.value = r.total_qty || 0
    } else {
      const r: any = await stockOrderApi.list(params)
      orderData.value = r.items || []
      total.value = r.total || 0
    }
  } catch {
    detailData.value = []
    orderData.value = []
  } finally {
    loading.value = false
  }
}

const onMainTabChange = () => {
  page.value = 1
  subTab.value = 'detail'
  loadData()
}

const onSubTabChange = () => {
  page.value = 1
  loadData()
}

const onSortChange = ({ prop, order }: any) => {
  sortField.value = prop || 'created_at'
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  loadData()
}

const viewOrder = async (id: string) => {
  try {
    const r: any = await stockOrderApi.detail(id)
    orderDetail.value = r
    showOrderDlg.value = true
  } catch {}
}

onMounted(() => {
  loadOptions()
  loadData()
})
</script>

<style lang="scss" scoped>
.sub-tabs { margin-top: -8px; }
.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
  .action-left { display: flex; gap: 12px; }
}
.filter-bar {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;
}
.summary-bar {
  display: flex; gap: 8px; align-items: center;
  margin-bottom: 8px; font-size: 13px; color: #606266;
  b { color: #303133; }
}
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
