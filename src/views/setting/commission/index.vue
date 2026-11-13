<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">提成管理</span>
        <el-button type="primary" icon="Plus" @click="openAdd">新增方案</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadRules">
        <el-tab-pane label="项目提成" name="project" />
        <el-tab-pane label="产品提成" name="product" />
        <el-tab-pane label="卡提成" name="card" />
        <el-tab-pane label="阶梯提成" name="ladder" />
      </el-tabs>

      <el-table :data="rules" v-loading="loading" stripe border>
        <el-table-column prop="name" label="方案名称" min-width="160" />
        <el-table-column label="适用范围" width="120">
          <template #default="{row}">{{ ({project:'服务项目',product:'产品',card:'会员卡',ladder:'阶梯'})[row.rule_type] || row.rule_type }}</template>
        </el-table-column>
        <el-table-column label="提成方式" width="120">
          <template #default="{row}">{{ row.commission_type === 'percentage' ? '比例提成' : '固定金额' }}</template>
        </el-table-column>
        <el-table-column label="提成值" width="120" align="right">
          <template #default="{row}">{{ row.commission_type === 'percentage' ? row.commission_value + '%' : '¥' + row.commission_value?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="适用员工" width="140" prop="staff_scope" show-overflow-tooltip />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{row}"><el-tag :type="row.is_active !== false ? 'success' : 'info'" size="small">{{ row.is_active !== false ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" @click="editRule(row)">编辑</el-button>
            <el-button link type="danger" @click="delRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 提成记录查看 -->
      <div style="margin-top:24px">
        <h4 style="margin-bottom:12px;color:#303133">近期提成记录</h4>
        <el-table :data="records" stripe border size="small">
          <el-table-column label="时间" width="160"><template #default="{row}">{{ row.created_at?.slice(0,16).replace('T',' ') }}</template></el-table-column>
          <el-table-column prop="staff_name" label="员工" width="100" />
          <el-table-column prop="item_name" label="品项" width="160" />
          <el-table-column label="提成金额" width="100" align="right">
            <template #default="{row}"><span style="color:#67C23A;font-weight:600">¥{{ row.commission_amount?.toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column prop="rule_name" label="方案" width="140" />
        </el-table>
      </div>
    </div>

    <!-- 新增/编辑方案 -->
    <el-dialog v-model="showDlg" :title="editId ? '编辑方案' : '新增方案'" width="520px" destroy-on-close>
      <el-form :model="fd" label-width="90px">
        <el-form-item label="方案名称"><el-input v-model="fd.name" /></el-form-item>
        <el-form-item label="适用范围">
          <el-select v-model="fd.rule_type">
            <el-option label="服务项目" value="project" /><el-option label="产品" value="product" />
            <el-option label="会员卡" value="card" /><el-option label="阶梯提成" value="ladder" />
          </el-select>
        </el-form-item>
        <el-form-item label="提成方式">
          <el-select v-model="fd.commission_type">
            <el-option label="比例提成" value="percentage" /><el-option label="固定金额" value="fixed" />
          </el-select>
        </el-form-item>
        <el-form-item label="提成值">
          <el-input-number v-model="fd.commission_value" :min="0" :precision="fd.commission_type==='percentage'?1:2" />
          <span style="margin-left:8px;color:#909399">{{ fd.commission_type === 'percentage' ? '%' : '元' }}</span>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="fd.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDlg=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { commissionApi } from '@/api'

const activeTab = ref('project')
const loading = ref(false)
const rules = ref<any[]>([])
const records = ref<any[]>([])

const loadRules = async () => {
  loading.value = true
  try {
    const r: any = await commissionApi.rules({ rule_type: activeTab.value })
    rules.value = r.items || (Array.isArray(r) ? r : [])
  } catch { rules.value = [] } finally { loading.value = false }
}

const loadRecords = async () => {
  try {
    const r: any = await commissionApi.records({ page: 1, page_size: 20 })
    records.value = r.items || (Array.isArray(r) ? r : [])
  } catch {}
}

// 新增/编辑
const showDlg = ref(false)
const saving = ref(false)
const editId = ref<string | null>(null)
const fd = ref<any>({})

const openAdd = () => {
  editId.value = null
  fd.value = { name: '', rule_type: activeTab.value, commission_type: 'percentage', commission_value: 10, description: '' }
  showDlg.value = true
}

const editRule = (row: any) => {
  editId.value = row.id
  fd.value = { ...row }
  showDlg.value = true
}

const saveRule = async () => {
  if (!fd.value.name) { ElMessage.warning('请输入方案名称'); return }
  saving.value = true
  try {
    if (editId.value) { await commissionApi.updateRule(editId.value, fd.value) }
    else { await commissionApi.createRule(fd.value) }
    ElMessage.success('保存成功')
    showDlg.value = false
    loadRules()
  } catch {} finally { saving.value = false }
}

const delRule = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除方案「${row.name}」？`, '确认', { type: 'warning' })
    await commissionApi.deleteRule(row.id)
    ElMessage.success('已删除')
    loadRules()
  } catch {}
}

onMounted(() => { loadRules(); loadRecords() })
</script>

<style lang="scss" scoped>
</style>
