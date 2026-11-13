<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">收支管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="openAdd('expense')">新增支出</el-button>
          <el-button type="success" icon="Plus" @click="openAdd('income')">新增收入</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="支出记录" name="expense" />
        <el-tab-pane label="其他收入" name="income" />
      </el-tabs>

      <div class="filter-bar">
        <el-select v-model="filterCat" placeholder="类型" style="width:140px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option v-for="c in catOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="~" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-button icon="Search" @click="loadData">查询</el-button>
      </div>

      <!-- 汇总 -->
      <div class="summary-bar">
        <div class="sum-item"><span class="sum-label">{{ activeTab === 'expense' ? '支出总额' : '收入总额' }}</span><span class="sum-val" :style="{color: activeTab==='expense'?'#F56C6C':'#67C23A'}">¥{{ sumAmount.toFixed(2) }}</span></div>
        <div class="sum-item"><span class="sum-label">记录数</span><span class="sum-val">{{ total }}</span></div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column label="日期" width="110"><template #default="{row}">{{ row.record_date?.slice(0,10) }}</template></el-table-column>
        <el-table-column prop="category" label="类型" width="110" />
        <el-table-column label="金额" width="130" align="right">
          <template #default="{row}">
            <span :style="{color: row.record_type==='income'?'#67C23A':'#F56C6C', fontWeight:700}">
              {{ row.record_type==='income'?'+':'-' }}¥{{ row.amount?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="110" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{row}"><el-button link type="danger" @click="del(row)">删除</el-button></template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" @size-change="loadData" @current-change="loadData" />
      </div>
    </div>

    <!-- 新增弹窗 -->
    <el-dialog v-model="showDlg" :title="fd.record_type==='income'?'新增收入':'新增支出'" width="480px" destroy-on-close>
      <el-form :model="fd" label-width="80px">
        <el-form-item label="类型">
          <el-select v-model="fd.category" filterable allow-create placeholder="选择或输入">
            <el-option v-for="c in catOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额"><el-input-number v-model="fd.amount" :min="0.01" :precision="2" style="width:200px" /></el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="fd.payment_method" clearable placeholder="选择">
            <el-option label="现金" value="现金" /><el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" /><el-option label="银行转账" value="银行转账" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="fd.description" type="textarea" :rows="2" placeholder="备注说明" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDlg=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bookkeepingApi } from '@/api'

const activeTab = ref('expense')
const tableData = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterCat = ref('')
const dateRange = ref<string[] | null>(null)

const catOptions = activeTab.value === 'expense'
  ? ['房租','水电费','工资','采购','营销推广','维修维护','办公用品','其他支出']
  : ['充值收入','退款回收','利息收入','其他收入']

const sumAmount = computed(() => tableData.value.reduce((s, r) => s + (r.amount || 0), 0))

const loadData = async () => {
  loading.value = true
  try {
    const p: any = { page: page.value, page_size: pageSize.value, record_type: activeTab.value }
    if (filterCat.value) p.category = filterCat.value
    if (dateRange.value) { p.start_date = dateRange.value[0]; p.end_date = dateRange.value[1] }
    const r: any = await bookkeepingApi.list(p)
    tableData.value = r.items || []
    total.value = r.total || 0
  } catch { tableData.value = [] } finally { loading.value = false }
}

// 新增
const showDlg = ref(false)
const saving = ref(false)
const fd = ref<any>({})

const openAdd = (type: string) => {
  fd.value = { record_type: type, category: '', amount: 0, payment_method: '', description: '' }
  showDlg.value = true
}

const save = async () => {
  if (!fd.value.amount || fd.value.amount <= 0) { ElMessage.warning('请输入金额'); return }
  if (!fd.value.category) { ElMessage.warning('请选择类型'); return }
  saving.value = true
  try {
    await bookkeepingApi.create(fd.value)
    ElMessage.success('保存成功')
    showDlg.value = false
    loadData()
  } catch { /* interceptor handles */ } finally { saving.value = false }
}

const del = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除此记录？', '确认', { type: 'warning' })
    await bookkeepingApi.delete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
.summary-bar {
  display: flex; gap: 24px; margin-bottom: 16px; padding: 12px 20px;
  background: #F5F7FA; border-radius: 8px;
  .sum-item { display: flex; align-items: center; gap: 8px;
    .sum-label { color: #909399; font-size: 13px; }
    .sum-val { font-size: 20px; font-weight: 700; color: #303133; }
  }
}
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
