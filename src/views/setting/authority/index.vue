<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">应用设置</span>
        <el-button type="primary" icon="Plus" @click="showAddDialog">{{ addBtnText }}</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="系统权限" name="role" />
        <el-tab-pane label="收银设置" name="cashier" />
        <el-tab-pane label="授权管理" name="authorization" />
        <el-tab-pane label="顾客设置" name="customer_config" />
        <el-tab-pane label="收支设置" name="bookkeeping_category" />
        <el-tab-pane label="高级配置" name="advanced" />
      </el-tabs>

      <!-- 系统权限表格 -->
      <el-table v-if="activeTab === 'role'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column label="权限范围" min-width="200">
          <template #default="{ row }">{{ row.data?.permissions?.join('、') || '—' }}</template>
        </el-table-column>
        <el-table-column label="描述" min-width="160">
          <template #default="{ row }">{{ row.data?.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 收银设置表格 -->
      <el-table v-if="activeTab === 'cashier'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="设置项" min-width="140" />
        <el-table-column label="值" min-width="120">
          <template #default="{ row }">{{ row.data?.value || '—' }}</template>
        </el-table-column>
        <el-table-column label="说明" min-width="200">
          <template #default="{ row }">{{ row.data?.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 授权管理表格 -->
      <el-table v-if="activeTab === 'authorization'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="授权名称" min-width="140" />
        <el-table-column label="平台" width="120">
          <template #default="{ row }">{{ row.data?.platform || '—' }}</template>
        </el-table-column>
        <el-table-column label="授权码/Key" min-width="180">
          <template #default="{ row }">{{ row.data?.apiKey || '—' }}</template>
        </el-table-column>
        <el-table-column label="到期时间" width="120">
          <template #default="{ row }">{{ row.data?.expireDate || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '有效' : '失效' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 顾客设置表格 -->
      <el-table v-if="activeTab === 'customer_config'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="规则名称" min-width="140" />
        <el-table-column label="规则类型" width="120">
          <template #default="{ row }">{{ row.data?.ruleType || '—' }}</template>
        </el-table-column>
        <el-table-column label="条件" min-width="180">
          <template #default="{ row }">{{ row.data?.condition || '—' }}</template>
        </el-table-column>
        <el-table-column label="动作" min-width="140">
          <template #default="{ row }">{{ row.data?.action || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 收支设置表格 -->
      <el-table v-if="activeTab === 'bookkeeping_category'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="分类名称" min-width="140" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.data?.categoryType === 'income' ? 'success' : 'warning'" size="small">
              {{ row.data?.categoryType === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.data?.color" :style="{ color: row.data.color }">●</span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" align="center" prop="sort_order" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 高级配置表格 -->
      <el-table v-if="activeTab === 'advanced'" :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="配置项" min-width="160" />
        <el-table-column label="值" min-width="160">
          <template #default="{ row }">{{ row.data?.value || '—' }}</template>
        </el-table-column>
        <el-table-column label="说明" min-width="200">
          <template #default="{ row }">{{ row.data?.description || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="editItem(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 通用新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑' + currentTabLabel : '新增' + currentTabLabel" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <!-- 系统权限 -->
        <template v-if="activeTab === 'role'">
          <el-form-item label="角色名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="权限范围">
            <el-checkbox-group v-model="formData.permissions">
              <el-checkbox v-for="p in permissionOptions" :key="p" :label="p" :value="p">{{ p }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="描述"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        </template>
        <!-- 收银设置 -->
        <template v-if="activeTab === 'cashier'">
          <el-form-item label="设置项" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="值" prop="value"><el-input v-model="formData.value" /></el-form-item>
          <el-form-item label="说明"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        </template>
        <!-- 授权管理 -->
        <template v-if="activeTab === 'authorization'">
          <el-form-item label="授权名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="平台">
            <el-select v-model="formData.platform" placeholder="选择平台">
              <el-option label="美团" value="美团" /><el-option label="抖音" value="抖音" />
              <el-option label="小红书" value="小红书" /><el-option label="微信" value="微信" />
              <el-option label="支付宝" value="支付宝" /><el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="授权码/Key"><el-input v-model="formData.apiKey" /></el-form-item>
          <el-form-item label="到期时间"><el-date-picker v-model="formData.expireDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        </template>
        <!-- 顾客设置 -->
        <template v-if="activeTab === 'customer_config'">
          <el-form-item label="规则名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="规则类型">
            <el-select v-model="formData.ruleType" placeholder="选择类型">
              <el-option label="自动标签" value="自动标签" /><el-option label="自动分组" value="自动分组" />
              <el-option label="消费提醒" value="消费提醒" /><el-option label="生日关怀" value="生日关怀" />
              <el-option label="流失预警" value="流失预警" />
            </el-select>
          </el-form-item>
          <el-form-item label="触发条件"><el-input v-model="formData.condition" placeholder="如：消费满3次" /></el-form-item>
          <el-form-item label="执行动作"><el-input v-model="formData.action" placeholder="如：标记为VIP" /></el-form-item>
        </template>
        <!-- 收支设置 -->
        <template v-if="activeTab === 'bookkeeping_category'">
          <el-form-item label="分类名称" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="类型">
            <el-radio-group v-model="formData.categoryType">
              <el-radio value="income">收入</el-radio>
              <el-radio value="expense">支出</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="颜色">
            <el-color-picker v-model="formData.color" />
          </el-form-item>
          <el-form-item label="排序"><el-input-number v-model="formData.sortOrder" :min="0" /></el-form-item>
        </template>
        <!-- 高级配置 -->
        <template v-if="activeTab === 'advanced'">
          <el-form-item label="配置项" prop="name"><el-input v-model="formData.name" /></el-form-item>
          <el-form-item label="值"><el-input v-model="formData.value" /></el-form-item>
          <el-form-item label="说明"><el-input v-model="formData.description" type="textarea" :rows="2" /></el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appSettingApi } from '@/api'

const activeTab = ref('role')
const loading = ref(false)
const saving = ref(false)
const tableData = ref<any[]>([])

const showDialog = ref(false)
const formRef = ref()
const editingId = ref<string | null>(null)
const formData = ref<any>({})
const formRules = { name: [{ required: true, message: '请输入名称' }] }

const permissionOptions = ['门店管理', '品项管理', '员工管理', '客户管理', '订单管理', '财务报表', '系统设置', '营销活动']

const tabLabelMap: Record<string, string> = {
  role: '角色', cashier: '收银设置', authorization: '授权',
  customer_config: '顾客规则', bookkeeping_category: '收支分类', advanced: '配置项',
}
const currentTabLabel = computed(() => tabLabelMap[activeTab.value] || '设置')

const addBtnText = computed(() => '添加' + currentTabLabel.value)

const loadData = async () => {
  loading.value = true
  try {
    tableData.value = await appSettingApi.list(activeTab.value) as any || []
  } catch { tableData.value = [] } finally { loading.value = false }
}

const onTabChange = () => { loadData() }

const getDefaultFormData = (): any => {
  const map: Record<string, any> = {
    role: { name: '', permissions: [], description: '' },
    cashier: { name: '', value: '', description: '' },
    authorization: { name: '', platform: '', apiKey: '', expireDate: '' },
    customer_config: { name: '', ruleType: '', condition: '', action: '' },
    bookkeeping_category: { name: '', categoryType: 'income', color: '#409EFF', sortOrder: 0 },
    advanced: { name: '', value: '', description: '' },
  }
  return { ...map[activeTab.value] }
}

const showAddDialog = () => {
  editingId.value = null
  formData.value = getDefaultFormData()
  showDialog.value = true
}

const editItem = (row: any) => {
  editingId.value = row.id
  // Merge data fields back to form
  formData.value = { name: row.name, ...(row.data || {}), sortOrder: row.sort_order }
  if (!formData.value.permissions) formData.value.permissions = []
  showDialog.value = true
}

const buildApiData = (): any => {
  const { name, ...rest } = formData.value
  const data: any = { ...rest }
  // Clean up sortOrder from data payload
  if ('sortOrder' in data) {
    delete data.sortOrder
  }
  return { setting_type: activeTab.value, name, data, sort_order: formData.value.sortOrder || 0 }
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = buildApiData()
    if (editingId.value) {
      await appSettingApi.update(editingId.value, { name: payload.name, data: payload.data, sort_order: payload.sort_order })
      ElMessage.success('更新成功')
    } else {
      await appSettingApi.create(payload)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadData()
  } catch { /* handled by interceptor */ } finally { saving.value = false }
}

const deleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」？`, '确认删除', { type: 'warning' })
    await appSettingApi.delete(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch {}
}

onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
</style>
