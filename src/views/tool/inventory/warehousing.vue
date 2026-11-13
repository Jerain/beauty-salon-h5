<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">{{ isInbound ? '产品入库' : '产品出库' }}</span>
      </div>

      <el-form :model="form" label-width="90px" class="order-form">
        <div class="form-row">
          <el-form-item :label="isInbound ? '入库仓库' : '出库仓库'" required>
            <el-select v-model="form.warehouse_name" placeholder="请选择仓库" style="width:200px">
              <el-option v-for="s in shopList" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
          </el-form-item>
          <el-form-item :label="isInbound ? '入库时间' : '出库时间'" required>
            <el-date-picker v-model="form.order_time" type="datetime" placeholder="选择时间" value-format="YYYY-MM-DDTHH:mm:ss" style="width:200px" />
          </el-form-item>
          <el-form-item :label="isInbound ? '入库类型' : '出库类型'" required>
            <el-select v-model="form.stock_type" :placeholder="isInbound ? '请选择入库类型' : '请选择出库类型'" style="width:180px">
              <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="经办人">
            <el-input v-model="form.operator_name" placeholder="经办人" style="width:200px" />
          </el-form-item>
          <el-form-item label="制单人">
            <el-input v-model="form.operator_name" disabled style="width:200px" />
          </el-form-item>
          <template v-if="isInbound">
            <el-form-item label="供应商">
              <el-input v-model="form.supplier_name" placeholder="供应商（选填）" style="width:200px" />
            </el-form-item>
          </template>
        </div>
        <div class="form-row">
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注说明（选填）" style="width:500px" />
          </el-form-item>
        </div>
      </el-form>

      <!-- 产品明细表 -->
      <div class="detail-section">
        <div class="detail-header">
          <span class="detail-title">产品明细</span>
          <el-button type="primary" icon="Plus" @click="showProductPicker = true">添加产品</el-button>
        </div>

        <el-table :data="items" stripe border size="small" style="width:100%">
          <el-table-column type="index" label="#" width="40" />
          <el-table-column prop="product_code" label="编号" width="100">
            <template #default="{row}">{{ row.product_code || '—' }}</template>
          </el-table-column>
          <el-table-column prop="product_name" label="产品名称" min-width="140" />
          <el-table-column prop="unit" label="单位" width="60" align="center" />
          <el-table-column prop="current_stock" label="当前库存" width="80" align="center" />
          <el-table-column :label="isInbound ? '入库数量' : '出库数量'" width="110" align="center">
            <template #default="{row, $index}">
              <el-input-number v-model="row.quantity" :min="0.01" :precision="2" size="small" controls-position="right" style="width:90px" @change="calcRowTotal(row)" />
            </template>
          </el-table-column>
          <el-table-column label="成本价" width="110" align="center">
            <template #default="{row}">
              <el-input-number v-if="isInbound" v-model="row.cost_price" :min="0" :precision="2" size="small" controls-position="right" style="width:90px" @change="calcRowTotal(row)" />
              <span v-else>{{ row.cost_price?.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="成本总额" width="100" align="right">
            <template #default="{row}">{{ (row.cost_total || 0).toFixed(2) }}</template>
          </el-table-column>
          <template v-if="isInbound">
            <el-table-column label="生产日期" width="140">
              <template #default="{row}">
                <el-date-picker v-model="row.production_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" size="small" style="width:120px" />
              </template>
            </el-table-column>
            <el-table-column label="保质期(月)" width="100" align="center">
              <template #default="{row}">
                <el-input-number v-model="row.shelf_life_months" :min="0" size="small" controls-position="right" style="width:80px" />
              </template>
            </el-table-column>
            <el-table-column label="批次" width="100">
              <template #default="{row}">
                <el-input v-model="row.batch_no" size="small" placeholder="批次号" />
              </template>
            </el-table-column>
          </template>
          <el-table-column label="备注" width="120">
            <template #default="{row}">
              <el-input v-model="row.remark" size="small" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="items.length > 0" class="total-bar">
          合计：{{ totalQty.toFixed(2) }} | 成本总额：￥{{ totalCost.toFixed(2) }}
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="form-footer">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitOrder">
          {{ isInbound ? '提交入库' : '提交出库' }}
        </el-button>
      </div>
    </div>

    <!-- 产品选择弹窗 -->
    <el-dialog v-model="showProductPicker" title="选择产品" width="600px" destroy-on-close>
      <el-input v-model="productSearch" placeholder="搜索产品名称" prefix-icon="Search" clearable style="margin-bottom:12px" @input="searchProducts" />
      <el-table :data="productOptions" v-loading="productLoading" stripe border size="small" @row-click="addProduct" highlight-current-row style="cursor:pointer">
        <el-table-column prop="name" label="产品名称" />
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column label="当前库存" width="80" align="center">
          <template #default="{row}">{{ row.stock_quantity || 0 }}</template>
        </el-table-column>
        <el-table-column label="成本价" width="90" align="right">
          <template #default="{row}">{{ (row.cost_price || 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { stockOrderApi, shopApi, inventoryApi } from '@/api'

const route = useRoute()
const router = useRouter()
const isInbound = computed(() => route.query.type === 'inbound')

const inboundTypes = ['采购', '调拨', '退单', '盘盈', '调拨拒收', '出库撤销', '其他']
const outboundTypes = ['销售', '盘亏', '报损', '调拨', '其他']
const typeOptions = computed(() => isInbound.value ? inboundTypes : outboundTypes)

const shopList = ref<any[]>([])
const saving = ref(false)

const form = ref({
  warehouse_name: '',
  order_time: new Date().toISOString().slice(0, 19),
  stock_type: '',
  operator_name: '',
  supplier_name: '',
  remark: '',
})

const items = ref<any[]>([])

const totalQty = computed(() => items.value.reduce((s, i) => s + (i.quantity || 0), 0))
const totalCost = computed(() => items.value.reduce((s, i) => s + (i.cost_total || 0), 0))

const calcRowTotal = (row: any) => {
  row.cost_total = (row.quantity || 0) * (row.cost_price || 0)
}

const removeItem = (index: number) => {
  items.value.splice(index, 1)
}

// Product picker
const showProductPicker = ref(false)
const productSearch = ref('')
const productLoading = ref(false)
const productOptions = ref<any[]>([])

const searchProducts = async () => {
  productLoading.value = true
  try {
    const r: any = await inventoryApi.list({ search: productSearch.value, page: 1, page_size: 20 })
    productOptions.value = (r.items || []).map((inv: any) => ({
      ...inv,
      stock_quantity: inv.quantity,
      cost_price: inv.cost_price || 0,
    }))
  } catch { productOptions.value = [] }
  finally { productLoading.value = false }
}

const addProduct = (prod: any) => {
  // Check if already added
  if (items.value.some(i => i.product_id === prod.product_id)) {
    ElMessage.warning('该产品已添加')
    return
  }
  items.value.push({
    product_id: prod.product_id,
    product_name: prod.product_name,
    product_code: prod.barcode || prod.product_code,
    brand_name: prod.brand_name,
    category_name: '',
    unit: '',
    current_stock: prod.stock_quantity || prod.quantity || 0,
    quantity: 1,
    cost_price: prod.cost_price || 0,
    cost_total: prod.cost_price || 0,
    production_date: null,
    shelf_life_months: null,
    batch_no: '',
    remark: '',
  })
  showProductPicker.value = false
}

const submitOrder = async () => {
  if (!form.value.warehouse_name) { ElMessage.warning('请选择仓库'); return }
  if (!form.value.stock_type) { ElMessage.warning('请选择类型'); return }
  if (!items.value.length) { ElMessage.warning('请添加产品'); return }

  saving.value = true
  try {
    await stockOrderApi.create({
      order_type: isInbound.value ? 'inbound' : 'outbound',
      stock_type: form.value.stock_type,
      warehouse_name: form.value.warehouse_name,
      operator_name: form.value.operator_name,
      supplier_name: form.value.supplier_name,
      remark: form.value.remark,
      order_time: form.value.order_time,
      items: items.value.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name,
        product_code: i.product_code,
        brand_name: i.brand_name,
        category_name: i.category_name,
        unit: i.unit,
        quantity: i.quantity,
        cost_price: i.cost_price,
        cost_total: i.cost_total,
        production_date: i.production_date,
        shelf_life_months: i.shelf_life_months,
        batch_no: i.batch_no,
        remark: i.remark,
      })),
    })
    ElMessage.success(isInbound.value ? '入库成功' : '出库成功')
    router.push('/operate/inventory/detail')
  } catch {}
  finally { saving.value = false }
}

onMounted(async () => {
  try {
    const shops: any = await shopApi.list()
    shopList.value = shops || []
    if (shops.length > 0) form.value.warehouse_name = shops[0].name
  } catch {}
  // Pre-load products
  searchProducts()
})
</script>

<style lang="scss" scoped>
.order-form { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; flex-wrap: wrap; }
.detail-section {
  margin-top: 16px;
  .detail-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px;
    .detail-title { font-size: 15px; font-weight: 600; }
  }
}
.total-bar {
  margin-top: 8px; text-align: right; font-size: 13px; color: #606266;
  b { color: #303133; }
}
.form-footer {
  margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;
  padding-top: 16px; border-top: 1px solid #EBEEF5;
}
</style>
