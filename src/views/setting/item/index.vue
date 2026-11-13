<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">品项管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="showAddDialog">{{ addBtnText }}</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="服务项目" name="project" />
        <el-tab-pane label="门店产品" name="product" />
        <el-tab-pane label="会员卡" name="card" />
        <el-tab-pane label="券" name="coupon" />
        <el-tab-pane label="类别设置" name="category" />
        <el-tab-pane label="价格模板" name="priceTemplate" />
      </el-tabs>

      <!-- 筛选栏 -->
      <div class="filter-bar" v-if="activeTab !== 'category' && activeTab !== 'priceTemplate'">
        <el-input v-model="search" placeholder="名称搜索" prefix-icon="Search" style="width: 200px" clearable @keyup.enter="loadData" @clear="loadData" />
        <el-select v-model="filterCategory" placeholder="分类" style="width: 140px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 100px" clearable @change="loadData" v-if="activeTab !== 'coupon'">
          <el-option label="全部" value="" />
          <el-option label="启用" value="true" />
          <el-option label="停用" value="false" />
        </el-select>
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 服务项目表格 -->
      <el-table v-if="activeTab === 'project'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="项目名称" min-width="160" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="价格" width="100" align="right">
          <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="时长(分)" width="80" align="center" prop="duration" />
        <el-table-column label="提成" width="100" align="right">
          <template #default="{ row }">{{ row.commission_rate ? row.commission_rate + '%' : (row.commission_amount ? '¥' + row.commission_amount : '—') }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="primary" @click="toggleStatus(row)">{{ row.is_active ? '停用' : '启用' }}</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 产品表格 -->
      <el-table v-if="activeTab === 'product'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="产品名称" min-width="140" />
        <el-table-column prop="brand_name" label="品牌" width="100" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column label="售价" width="90" align="right">
          <template #default="{ row }">¥{{ row.sell_price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="成本" width="90" align="right">
          <template #default="{ row }">{{ row.cost_price ? '¥' + row.cost_price.toFixed(2) : '—' }}</template>
        </el-table-column>
        <el-table-column label="库存" width="70" align="center" prop="stock_quantity" />
        <el-table-column prop="unit_name" label="单位" width="60" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '在售' : '停售' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="primary" @click="toggleStatus(row)">{{ row.is_active ? '停售' : '上架' }}</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 会员卡表格 -->
      <el-table v-if="activeTab === 'card'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="卡类型名称" min-width="140" />
        <el-table-column prop="card_type" label="卡类型" width="100" />
        <el-table-column label="售价" width="100" align="right">
          <template #default="{ row }">¥{{ row.sell_price?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="面值/额度" width="120" align="right">
          <template #default="{ row }">{{ row.face_value ? '¥' + row.face_value.toFixed(2) : (row.total_count ? row.total_count + '次' : '—') }}</template>
        </el-table-column>
        <el-table-column prop="valid_days" label="有效期(天)" width="100" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active !== false ? 'success' : 'info'" size="small">{{ row.is_active !== false ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 券表格 -->
      <el-table v-if="activeTab === 'coupon'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="券名称" min-width="140" />
        <el-table-column prop="coupon_type" label="类型" width="100" />
        <el-table-column label="面值/折扣" width="100" align="right">
          <template #default="{ row }">{{ row.face_value ? '¥' + row.face_value.toFixed(2) : (row.discount ? row.discount + '折' : '—') }}</template>
        </el-table-column>
        <el-table-column label="最低消费" width="100" align="right">
          <template #default="{ row }">{{ row.min_amount ? '¥' + row.min_amount.toFixed(2) : '—' }}</template>
        </el-table-column>
        <el-table-column prop="valid_days" label="有效期(天)" width="100" align="center" />
        <el-table-column prop="total_count" label="发行数量" width="80" align="center" />
        <el-table-column prop="used_count" label="已使用" width="70" align="center" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 类别设置（树形） -->
      <div v-if="activeTab === 'category'" class="category-section">
        <el-table :data="categoryTree" v-loading="loading" stripe border row-key="id" default-expand-all>
          <el-table-column prop="name" label="类别名称" min-width="200" />
          <el-table-column prop="category_type" label="类型" width="100" />
          <el-table-column prop="sort_order" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="addSubCategory(row)">添加子级</el-button>
              <el-button link type="primary" @click="editCategory(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 价格模板 -->
      <div v-if="activeTab === 'priceTemplate'" class="price-section">
        <el-table :data="tableData" v-loading="loading" stripe border>
          <el-table-column prop="name" label="模板名称" min-width="140" />
          <el-table-column prop="item_type" label="品项类型" width="100" />
          <el-table-column prop="level_name" label="会员等级" width="120" />
          <el-table-column label="价格" width="100" align="right">
            <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button link type="danger" @click="deletePriceTemplate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="activeTab !== 'category'">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
          @size-change="loadData" @current-change="loadData" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <!-- 服务项目表单 -->
        <template v-if="activeTab === 'project'">
          <el-form-item label="项目名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="分类"><el-select v-model="formData.category_id" placeholder="选择分类" clearable filterable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select></el-form-item>
          <el-form-item label="价格" prop="price"><el-input-number v-model="formData.price" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="会员价"><el-input-number v-model="formData.member_price" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="时长(分)" prop="duration"><el-input-number v-model="formData.duration" :min="5" :step="5" /></el-form-item>
          <el-form-item label="提成比例%"><el-input-number v-model="formData.commission_rate" :min="0" :max="100" /></el-form-item>
          <el-form-item label="提成金额"><el-input-number v-model="formData.commission_amount" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="3" /></el-form-item>
        </template>
        <!-- 产品表单 -->
        <template v-if="activeTab === 'product'">
          <el-form-item label="产品名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="品牌"><el-select v-model="formData.brand_id" placeholder="选择品牌" clearable filterable>
            <el-option v-for="b in brands" :key="b.id" :label="b.name" :value="b.id" />
          </el-select></el-form-item>
          <el-form-item label="分类"><el-select v-model="formData.category_id" placeholder="选择分类" clearable filterable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select></el-form-item>
          <el-form-item label="售价" prop="sell_price"><el-input-number v-model="formData.sell_price" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="成本价"><el-input-number v-model="formData.cost_price" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="规格"><el-input v-model="formData.spec" /></el-form-item>
          <el-form-item label="单位"><el-select v-model="formData.unit_id" placeholder="选择单位" clearable filterable>
            <el-option v-for="u in units" :key="u.id" :label="u.name" :value="u.id" />
          </el-select></el-form-item>
          <el-form-item label="库存数量"><el-input-number v-model="formData.stock_quantity" :min="0" /></el-form-item>
          <el-form-item label="库存预警值"><el-input-number v-model="formData.stock_alert_value" :min="0" /></el-form-item>
          <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        </template>
        <!-- 会员卡表单 -->
        <template v-if="activeTab === 'card'">
          <el-form-item label="卡名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="卡类型"><el-select v-model="formData.card_type" placeholder="选择">
            <el-option label="储值卡" value="stored_value" /><el-option label="次卡" value="ticket" />
            <el-option label="疗程卡" value="course" /><el-option label="期限卡" value="period" />
            <el-option label="折扣卡" value="discount" /><el-option label="礼包卡" value="gift" />
          </el-select></el-form-item>
          <el-form-item label="售价" prop="sell_price"><el-input-number v-model="formData.sell_price" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="面值"><el-input-number v-model="formData.face_value" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="次数"><el-input-number v-model="formData.total_count" :min="0" /></el-form-item>
          <el-form-item label="有效期(天)"><el-input-number v-model="formData.valid_days" :min="0" /></el-form-item>
          <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        </template>
        <!-- 券表单 -->
        <template v-if="activeTab === 'coupon'">
          <el-form-item label="券名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="类型"><el-select v-model="formData.coupon_type">
            <el-option label="满减券" value="threshold" /><el-option label="折扣券" value="discount" /><el-option label="代金券" value="cash" />
          </el-select></el-form-item>
          <el-form-item label="面值"><el-input-number v-model="formData.face_value" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="折扣"><el-input-number v-model="formData.discount" :min="1" :max="10" :step="0.5" /></el-form-item>
          <el-form-item label="最低消费"><el-input-number v-model="formData.min_amount" :min="0" :precision="2" /></el-form-item>
          <el-form-item label="有效期(天)"><el-input-number v-model="formData.valid_days" :min="1" /></el-form-item>
          <el-form-item label="发行数量"><el-input-number v-model="formData.total_count" :min="1" /></el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 类别弹窗 -->
    <el-dialog v-model="showCategoryDialog" :title="categoryDialogTitle" width="420px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="categoryForm.name" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="categoryForm.category_type">
          <el-option label="服务项目" value="project" /><el-option label="产品" value="product" />
        </el-select></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="categoryForm.sort_order" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi, productApi, cardTypeApi, couponApi, categoryApi, brandApi, productUnitApi, priceTemplateApi } from '@/api'

const activeTab = ref('project')
const tableData = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const search = ref('')
const filterCategory = ref('')
const filterStatus = ref('')

// 下拉数据
const categories = ref<any[]>([])
const categoryTree = ref<any[]>([])
const brands = ref<any[]>([])
const units = ref<any[]>([])

// 弹窗
const showDialog = ref(false)
const saving = ref(false)
const formRef = ref()
const editingId = ref<string | null>(null)
const formData = ref<any>({})
const formRules = { name: [{ required: true, message: '请输入名称' }], price: [{ required: true, message: '请输入价格' }], sell_price: [{ required: true, message: '请输入售价' }], duration: [{ required: true, message: '请输入时长' }] }

// 类别弹窗
const showCategoryDialog = ref(false)
const categoryForm = ref<any>({ name: '', category_type: 'project', sort_order: 0, parent_id: null })
const editingCategoryId = ref<string | null>(null)

const addBtnText = computed(() => {
  const map: Record<string, string> = { project: '添加项目', product: '添加产品', card: '添加会员卡', coupon: '添加券', category: '添加类别', priceTemplate: '添加模板' }
  return map[activeTab.value] || '添加'
})

const dialogTitle = computed(() => editingId.value ? '编辑' : '新增')
const categoryDialogTitle = computed(() => editingCategoryId.value ? '编辑类别' : '新增类别')

const onTabChange = () => {
  page.value = 1; search.value = ''; filterCategory.value = ''; filterStatus.value = ''
  loadData()
  if (activeTab.value === 'category') loadCategoryTree()
}

const getApi = () => {
  const map: Record<string, any> = { project: projectApi, product: productApi, card: cardTypeApi, coupon: couponApi }
  return map[activeTab.value]
}

const loadData = async () => {
  const api = getApi()
  if (!api) { if (activeTab.value === 'priceTemplate') loadPriceTemplates(); return }
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (filterCategory.value) params.category_id = filterCategory.value
    if (filterStatus.value !== '') params.is_active = filterStatus.value === 'true'
    const res: any = await api.list(params)
    tableData.value = res.items || res || []
    total.value = res.total || (Array.isArray(res) ? res.length : 0)
  } catch { tableData.value = [] } finally { loading.value = false }
}

const loadPriceTemplates = async () => {
  loading.value = true
  try { const res: any = await priceTemplateApi.list(); tableData.value = res || []; total.value = (res || []).length } catch { tableData.value = [] } finally { loading.value = false }
}

const loadCategoryTree = async () => {
  try { categoryTree.value = await categoryApi.tree() as any } catch { categoryTree.value = [] }
}

const loadDropdowns = async () => {
  try { const r: any = await categoryApi.list({ page: 1, page_size: 100 }); categories.value = r.items || [] } catch {}
  try { brands.value = await brandApi.list() as any || [] } catch {}
  try { units.value = await productUnitApi.list() as any || [] } catch {}
}

const showAddDialog = () => {
  if (activeTab.value === 'category') { editingCategoryId.value = null; categoryForm.value = { name: '', category_type: 'project', sort_order: 0, parent_id: null }; showCategoryDialog.value = true; return }
  editingId.value = null
  const defaults: Record<string, any> = {
    project: { name: '', price: 0, duration: 60, commission_rate: null, commission_amount: null, description: '' },
    product: { name: '', sell_price: 0, cost_price: null, stock_quantity: 0, stock_alert_value: null, description: '' },
    card: { name: '', card_type: 'stored_value', sell_price: 0, face_value: 0, total_count: 0, valid_days: 365, description: '' },
    coupon: { name: '', coupon_type: 'threshold', face_value: 0, discount: null, min_amount: 0, valid_days: 30, total_count: 100 },
  }
  formData.value = { ...defaults[activeTab.value] }
  showDialog.value = true
}

const editItem = (row: any) => {
  editingId.value = row.id
  formData.value = { ...row }
  showDialog.value = true
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const api = getApi()
    if (editingId.value) { await api.update(editingId.value, formData.value) }
    else { await api.create(formData.value) }
    ElMessage.success(editingId.value ? '更新成功' : '创建成功')
    showDialog.value = false
    loadData()
  } catch { /* handled by interceptor */ } finally { saving.value = false }
}

const toggleStatus = async (row: any) => {
  try {
    const api = getApi()
    await api.updateStatus(row.id, { is_active: !row.is_active })
    ElMessage.success(row.is_active ? '已停用' : '已启用')
    loadData()
  } catch {}
}

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」？`, '确认删除', { type: 'warning' })
    await getApi().delete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

// 类别
const addSubCategory = (row: any) => { editingCategoryId.value = null; categoryForm.value = { name: '', category_type: row.category_type, sort_order: 0, parent_id: row.id }; showCategoryDialog.value = true }
const editCategory = (row: any) => { editingCategoryId.value = row.id; categoryForm.value = { name: row.name, category_type: row.category_type, sort_order: row.sort_order, parent_id: row.parent_id }; showCategoryDialog.value = true }
const saveCategory = async () => {
  try {
    if (editingCategoryId.value) { await categoryApi.update(editingCategoryId.value, categoryForm.value) }
    else { await categoryApi.create(categoryForm.value) }
    ElMessage.success('保存成功')
    showCategoryDialog.value = false
    loadCategoryTree()
    loadDropdowns()
  } catch {}
}
const deleteCategory = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除类别「${row.name}」？`, '确认', { type: 'warning' })
    await categoryApi.delete(row.id)
    ElMessage.success('已删除')
    loadCategoryTree()
    loadDropdowns()
  } catch {}
}

const deletePriceTemplate = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」？`, '确认', { type: 'warning' })
    // No delete endpoint for price template, skip or handle differently
    ElMessage.info('价格模板暂不支持删除')
  } catch {}
}

onMounted(() => { loadData(); loadDropdowns() })
</script>

<style lang="scss" scoped>
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.header-actions { display: flex; gap: 8px; }
.category-section, .price-section { margin-top: 8px; }
</style>
