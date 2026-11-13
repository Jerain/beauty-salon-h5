<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">顾客管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="showAddDialog = true">新建顾客档案</el-button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-input v-model="search" placeholder="姓名/手机号/编号" prefix-icon="Search" style="width: 220px" clearable @clear="loadData" @keyup.enter="loadData" />
        <el-select v-model="filterLevel" placeholder="会员等级" style="width: 120px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="普通" value="normal" />
          <el-option label="银卡" value="silver" />
          <el-option label="金卡" value="gold" />
          <el-option label="钻石" value="diamond" />
        </el-select>
        <el-select v-model="filterCard" placeholder="持卡状态" style="width: 120px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="持卡" value="has" />
          <el-option label="未持卡" value="no" />
        </el-select>
        <el-button icon="Search" @click="loadData">搜索</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column label="顾客信息" min-width="200">
          <template #default="{ row }">
            <div class="customer-info">
              <el-avatar :size="36" style="background: #409EFF; flex-shrink: 0;">{{ row.name?.[0] || '?' }}</el-avatar>
              <div class="info-text">
                <div class="info-name">{{ row.name }} <el-tag size="small" :type="levelType(row.level)">{{ levelLabel(row.level) }}</el-tag></div>
                <div class="info-sub">{{ row.phone }} · {{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="余额" prop="balance" width="120" align="right">
          <template #default="{ row }">¥{{ row.balance?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="积分" prop="points" width="80" align="center" />
        <el-table-column label="上次到店" width="160">
          <template #default="{ row }">
            {{ row.last_visit_at ? formatDate(row.last_visit_at) : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="标签" width="180">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags" :key="tag.id" size="small" :color="tag.color" effect="dark" style="margin-right: 4px;">{{ tag.name }}</el-tag>
            <span v-if="!row.tags?.length" style="color: #C0C4CC;">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row.id)">详情</el-button>
            <el-button link type="primary" @click="handleBilling(row)">开单</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 新建/编辑顾客弹窗 -->
    <el-dialog v-model="showAddDialog" :title="editingId ? '编辑顾客' : '新建顾客档案'" width="560px" destroy-on-close @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入顾客姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio value="female">女</el-radio>
            <el-radio value="male">男</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="form.birthday" type="date" placeholder="选择出生日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="form.source_id" placeholder="请选择来源" clearable style="width: 100%">
            <el-option v-for="s in sources" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="form.level" style="width: 100%">
            <el-option label="普通" value="normal" />
            <el-option label="银卡" value="silver" />
            <el-option label="金卡" value="gold" />
            <el-option label="钻石" value="diamond" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
        <el-form-item label="禁忌事项">
          <el-input v-model="form.taboo" type="textarea" :rows="2" placeholder="如: 对某药物过敏等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { customerApi, sourceApi } from '@/api'

const router = useRouter()

// 列表数据
const tableData = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const search = ref('')
const filterLevel = ref('')
const filterCard = ref('')

// 新建/编辑
const showAddDialog = ref(false)
const submitLoading = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const sources = ref<any[]>([])

const form = reactive({
  name: '', phone: '', gender: 'female', birthday: '',
  source_id: '', level: 'normal', remark: '', taboo: '',
})

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

const levelLabel = (v: string) => ({ normal: '普通', silver: '银卡', gold: '金卡', diamond: '钻石' }[v] || v)
const levelType = (v: string): any => ({ normal: 'info', silver: '', gold: 'warning', diamond: 'danger' }[v] || 'info')

const formatDate = (d: string) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (filterLevel.value) params.level = filterLevel.value
    if (filterCard.value) params.has_card = filterCard.value === 'has' ? 'true' : 'false'
    const res: any = await customerApi.list(params)
    tableData.value = res.items || []
    total.value = res.total || 0
  } catch (e: any) {
    console.error('加载顾客列表失败', e)
  } finally {
    loading.value = false
  }
}

const loadSources = async () => {
  try {
    const res: any = await sourceApi.list()
    sources.value = res || []
  } catch { /* ignore */ }
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, { name: '', phone: '', gender: 'female', birthday: '', source_id: '', level: 'normal', remark: '', taboo: '' })
  formRef.value?.resetFields()
}

const handleEdit = (row: any) => {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name, phone: row.phone, gender: row.gender || 'female',
    birthday: '', source_id: '', level: row.level || 'normal',
    remark: row.remark || '', taboo: row.taboo || '',
  })
  showAddDialog.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    const data: any = { ...form }
    if (!data.source_id) delete data.source_id
    if (!data.birthday) delete data.birthday
    if (!data.remark) delete data.remark
    if (!data.taboo) delete data.taboo

    if (editingId.value) {
      await customerApi.update(editingId.value, data)
      ElMessage.success('顾客信息已更新')
    } else {
      await customerApi.create(data)
      ElMessage.success('顾客档案已创建')
    }
    showAddDialog.value = false
    loadData()
  } catch (e: any) {
    const detail = e.response?.data?.detail
    if (Array.isArray(detail)) {
      ElMessage.error(detail[0]?.msg || '提交失败')
    } else {
      ElMessage.error(detail || e.message || '提交失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除顾客「${row.name}」？此操作不可恢复`, '确认删除', { type: 'warning' })
    await customerApi.delete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch { /* cancelled */ }
}

const goDetail = (id: string) => {
  router.push(`/operate/member/detail/${id}`)
}

const handleBilling = (row: any) => {
  router.push({ path: '/operate/billing', query: { customerId: row.id, customerName: row.name } })
}

onMounted(() => {
  loadData()
  loadSources()
})
</script>

<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.customer-info {
  display: flex; align-items: center; gap: 12px;
  .info-text { flex: 1; min-width: 0; }
  .info-name { font-weight: 600; color: #303133; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }
  .info-sub { font-size: 12px; color: #909399; }
}
</style>
