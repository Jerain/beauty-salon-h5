<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">目标管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="openAdd">新增目标</el-button>
        </div>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="员工目标" name="target" />
        <el-tab-pane label="员工行动计划" name="plan" />
      </el-tabs>

      <!-- 目标列表 -->
      <template v-if="activeTab === 'target'">
        <div class="filter-bar">
          <el-date-picker v-model="month" type="month" placeholder="选择月份" value-format="YYYY-MM" style="width:160px" @change="loadTargets" />
          <el-select v-model="filterStaff" placeholder="全部员工" style="width:140px" clearable @change="loadTargets">
            <el-option label="全部" value="" />
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button icon="Search" @click="loadTargets">查询</el-button>
        </div>

        <el-table :data="targetData" v-loading="loading" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column prop="month" label="月份" width="100" />
          <el-table-column label="目标金额" width="120" align="right">
            <template #default="{row}">¥{{ row.target_amount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="已完成" width="120" align="right">
            <template #default="{row}"><span style="color:#67C23A">¥{{ row.completed_amount?.toFixed(2) || '0.00' }}</span></template>
          </el-table-column>
          <el-table-column label="完成率" width="140">
            <template #default="{row}">
              <el-progress :percentage="getPercent(row)" :color="getPercent(row) >= 100 ? '#67C23A' : '#409EFF'" :stroke-width="12" />
            </template>
          </el-table-column>
          <el-table-column prop="target_type" label="目标类型" width="100" />
          <el-table-column label="操作" width="80">
            <template #default="{row}"><el-button link type="danger" @click="delTarget(row)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 行动计划 -->
      <template v-if="activeTab === 'plan'">
        <el-empty description="行动计划功能开发中" />
      </template>
    </div>

    <!-- 新增目标弹窗 -->
    <el-dialog v-model="showDlg" title="新增目标" width="460px" destroy-on-close>
      <el-form :model="fd" label-width="80px">
        <el-form-item label="员工">
          <el-select v-model="fd.staff_id" filterable placeholder="选择员工">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份"><el-date-picker v-model="fd.month" type="month" value-format="YYYY-MM" /></el-form-item>
        <el-form-item label="目标类型">
          <el-select v-model="fd.target_type">
            <el-option label="业绩目标" value="revenue" /><el-option label="开卡目标" value="card" />
            <el-option label="客流目标" value="customer" /><el-option label="新客目标" value="new_customer" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标金额"><el-input-number v-model="fd.target_amount" :min="0" :precision="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDlg=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { targetApi, staffApi } from '@/api'

const activeTab = ref('target')
const loading = ref(false)
const targetData = ref<any[]>([])
const month = ref(new Date().toISOString().slice(0, 7))
const filterStaff = ref('')
const staffList = ref<any[]>([])

const getPercent = (row: any) => {
  if (!row.target_amount) return 0
  return Math.min(100, Math.round((row.completed_amount || 0) / row.target_amount * 100))
}

const loadTargets = async () => {
  loading.value = true
  try {
    const p: any = {}
    if (month.value) p.month = month.value
    if (filterStaff.value) p.staff_id = filterStaff.value
    const r: any = await targetApi.list(p)
    targetData.value = r.items || (Array.isArray(r) ? r : [])
  } catch { targetData.value = [] } finally { loading.value = false }
}

const onTabChange = () => { if (activeTab.value === 'target') loadTargets() }

// 新增
const showDlg = ref(false)
const saving = ref(false)
const fd = ref<any>({})

const openAdd = () => {
  fd.value = { staff_id: null, month: month.value, target_type: 'revenue', target_amount: 0 }
  showDlg.value = true
}

const save = async () => {
  if (!fd.value.staff_id) { ElMessage.warning('请选择员工'); return }
  saving.value = true
  try {
    await targetApi.create(fd.value)
    ElMessage.success('目标已创建')
    showDlg.value = false
    loadTargets()
  } catch {} finally { saving.value = false }
}

const delTarget = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除此目标？', '确认', { type: 'warning' })
    await targetApi.delete(row.id)
    ElMessage.success('已删除')
    loadTargets()
  } catch {}
}

onMounted(async () => {
  try { const r: any = await staffApi.list({ page: 1, page_size: 100 }); staffList.value = r.items || [] } catch {}
  loadTargets()
})
</script>

<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
</style>
