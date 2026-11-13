<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">员工管理</span>
        <el-button type="primary" icon="Plus" @click="showAddDialog">{{ activeTab === 'position' ? '添加职位' : '添加员工' }}</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="员工列表" name="list" />
        <el-tab-pane label="职位管理" name="position" />
        <el-tab-pane label="员工排班" name="schedule" />
        <el-tab-pane label="SOP自检" name="sop" />
        <el-tab-pane label="考勤打卡" name="attendance" />
        <el-tab-pane label="员工积分" name="points" />
      </el-tabs>

      <!-- 员工列表 -->
      <template v-if="activeTab === 'list'">
        <div class="filter-bar">
          <el-input v-model="search" placeholder="搜索姓名/手机号" prefix-icon="Search" style="width: 200px" clearable @keyup.enter="loadStaff" @clear="loadStaff" />
          <el-select v-model="filterPosition" placeholder="职位" style="width: 140px" clearable @change="loadStaff">
            <el-option label="全部" value="" />
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="状态" style="width: 100px" clearable @change="loadStaff">
            <el-option label="全部" value="" />
            <el-option label="在职" value="true" />
            <el-option label="离职" value="false" />
          </el-select>
          <el-button icon="Search" @click="loadStaff">查询</el-button>
        </div>
        <el-table :data="staffList" v-loading="loading" stripe border>
          <el-table-column label="头像" width="70" align="center">
            <template #default="{ row }">
              <el-avatar :size="36">{{ (row.name || '').charAt(0) }}</el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column prop="position_name" label="职位" width="120" />
          <el-table-column prop="role" label="角色" width="80" />
          <el-table-column label="积分" width="70" align="center" prop="points" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '在职' : '离职' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上班" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_on_duty ? 'success' : ''" size="small">{{ row.is_on_duty ? '在岗' : '休息' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="入职日期" width="120">
            <template #default="{ row }">{{ row.hire_date ? formatDate(row.hire_date) : '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editStaff(row)">编辑</el-button>
              <el-button link :type="row.is_active ? 'danger' : 'success'" @click="toggleStaff(row)">{{ row.is_active ? '离职' : '复职' }}</el-button>
              <el-button link type="danger" @click="deleteStaff(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
            :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next"
            @size-change="loadStaff" @current-change="loadStaff" />
        </div>
      </template>

      <!-- 职位管理 -->
      <template v-if="activeTab === 'position'">
        <el-table :data="positions" stripe border>
          <el-table-column prop="name" label="职位名称" min-width="200" />
          <el-table-column prop="sort_order" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="editPosition(row)">编辑</el-button>
              <el-button link type="danger" @click="deletePosition(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 排班 -->
      <template v-if="activeTab === 'schedule'">
        <div class="schedule-header">
          <el-button-group>
            <el-button @click="scheduleWeek(-1)">上一周</el-button>
            <el-button @click="scheduleWeek(0)">本周</el-button>
            <el-button @click="scheduleWeek(1)">下一周</el-button>
          </el-button-group>
          <span class="week-label">{{ weekLabel }}</span>
        </div>
        <el-table :data="scheduleData" stripe border>
          <el-table-column prop="name" label="员工" width="100" fixed />
          <el-table-column v-for="d in weekDays" :key="d.date" :label="d.label" :width="120" align="center">
            <template #default="{ row }">
              <div :class="['schedule-cell', { working: row[d.date] }]">
                {{ row[d.date] || '休' }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- SOP自检 -->
      <template v-if="activeTab === 'sop'">
        <el-empty description="SOP自检功能开发中" />
      </template>

      <!-- 考勤打卡 -->
      <template v-if="activeTab === 'attendance'">
        <div class="filter-bar">
          <el-date-picker v-model="attendanceDate" type="month" placeholder="选择月份" value-format="YYYY-MM" @change="loadAttendance" />
          <el-button @click="loadAttendance">查询</el-button>
        </div>
        <el-table :data="attendanceRecords" v-loading="attendanceLoading" stripe border>
          <el-table-column prop="staff_name" label="员工" width="120" />
          <el-table-column label="日期" width="120">
            <template #default="{ row }">{{ row.record_date }}</template>
          </el-table-column>
          <el-table-column label="签到" width="100">
            <template #default="{ row }">{{ row.clock_in_time ? formatTime(row.clock_in_time) : '—' }}</template>
          </el-table-column>
          <el-table-column label="签退" width="100">
            <template #default="{ row }">{{ row.clock_out_time ? formatTime(row.clock_out_time) : '—' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="remark" label="备注" min-width="120" />
        </el-table>
      </template>

      <!-- 员工积分 -->
      <template v-if="activeTab === 'points'">
        <el-table :data="staffList" stripe border>
          <el-table-column prop="name" label="员工" width="120" />
          <el-table-column prop="position_name" label="职位" width="120" />
          <el-table-column prop="points" label="当前积分" width="100" align="center" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" @click="adjustPoints(row, 1)">加分</el-button>
              <el-button link type="warning" @click="adjustPoints(row, -1)">扣分</el-button>
              <el-button link @click="viewPointsHistory(row)">历史</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>

    <!-- 员工新增/编辑弹窗 -->
    <el-dialog v-model="showStaffDialog" :title="editingStaffId ? '编辑员工' : '新增员工'" width="520px" destroy-on-close>
      <el-form ref="staffFormRef" :model="staffForm" :rules="staffRules" label-width="80px">
        <el-form-item label="姓名" prop="name"><el-input v-model="staffForm.name" /></el-form-item>
        <el-form-item label="手机号" prop="phone"><el-input v-model="staffForm.phone" /></el-form-item>
        <el-form-item v-if="!editingStaffId" label="密码" prop="password"><el-input v-model="staffForm.password" type="password" show-password /></el-form-item>
        <el-form-item label="职位">
          <el-select v-model="staffForm.position_id" placeholder="选择职位" clearable filterable>
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="staffForm.role">
            <el-option label="管理员" value="admin" /><el-option label="员工" value="staff" />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期"><el-date-picker v-model="staffForm.hire_date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="staffForm.bio" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStaffDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveStaff">保存</el-button>
      </template>
    </el-dialog>

    <!-- 职位弹窗 -->
    <el-dialog v-model="showPositionDialog" :title="editingPositionId ? '编辑职位' : '新增职位'" width="380px">
      <el-form :model="positionForm" label-width="70px">
        <el-form-item label="名称"><el-input v-model="positionForm.name" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="positionForm.sort_order" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPositionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePosition">保存</el-button>
      </template>
    </el-dialog>

    <!-- 积分调整弹窗 -->
    <el-dialog v-model="showPointsDialog" title="调整积分" width="380px">
      <el-form :model="pointsForm" label-width="70px">
        <el-form-item label="员工">{{ pointsStaff?.name }}</el-form-item>
        <el-form-item label="当前积分">{{ pointsStaff?.points }}</el-form-item>
        <el-form-item label="变动">
          <el-input-number v-model="pointsForm.delta" :min="-999" :max="999" />
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="pointsForm.reason" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPointsDialog = false">取消</el-button>
        <el-button type="primary" @click="savePoints">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { staffApi, positionApi, attendanceApi } from '@/api'

const activeTab = ref('list')
const loading = ref(false)

// ===== 员工列表 =====
const staffList = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const search = ref('')
const filterPosition = ref('')
const filterStatus = ref('')
const positions = ref<any[]>([])

const onTabChange = () => {
  if (activeTab.value === 'list' || activeTab.value === 'points') loadStaff()
  if (activeTab.value === 'position') loadPositions()
  if (activeTab.value === 'schedule') buildSchedule()
  if (activeTab.value === 'attendance') loadAttendance()
}

const loadStaff = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (filterPosition.value) params.position_id = filterPosition.value
    if (filterStatus.value !== '') params.is_active = filterStatus.value === 'true'
    const res: any = await staffApi.list(params)
    staffList.value = res.items || []
    total.value = res.total || 0
  } catch { staffList.value = [] } finally { loading.value = false }
}

const loadPositions = async () => {
  try { positions.value = await positionApi.list() as any || [] } catch { positions.value = [] }
}

// ===== 员工CRUD =====
const showStaffDialog = ref(false)
const saving = ref(false)
const staffFormRef = ref()
const editingStaffId = ref<string | null>(null)
const staffForm = ref<any>({})
const staffRules = { name: [{ required: true, message: '请输入姓名' }], phone: [{ required: true, message: '请输入手机号' }], password: [{ required: true, message: '请输入密码' }] }

const showAddDialog = () => {
  if (activeTab.value === 'position') { editingPositionId.value = null; positionForm.value = { name: '', sort_order: 0 }; showPositionDialog.value = true; return }
  editingStaffId.value = null
  staffForm.value = { name: '', phone: '', password: '123456', position_id: null, role: 'staff', hire_date: null, bio: '' }
  showStaffDialog.value = true
}

const editStaff = (row: any) => {
  editingStaffId.value = row.id
  staffForm.value = { ...row }
  showStaffDialog.value = true
}

const saveStaff = async () => {
  const valid = await staffFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingStaffId.value) { await staffApi.update(editingStaffId.value, staffForm.value) }
    else { await staffApi.create(staffForm.value) }
    ElMessage.success('保存成功')
    showStaffDialog.value = false
    loadStaff()
  } catch {} finally { saving.value = false }
}

const toggleStaff = async (row: any) => {
  try {
    await staffApi.switchStatus(row.id)
    ElMessage.success(row.is_active ? '已设为离职' : '已复职')
    loadStaff()
  } catch {}
}

const deleteStaff = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除员工「${row.name}」？`, '确认', { type: 'warning' })
    await staffApi.delete(row.id)
    ElMessage.success('已删除')
    loadStaff()
  } catch {}
}

// ===== 职位CRUD =====
const showPositionDialog = ref(false)
const editingPositionId = ref<string | null>(null)
const positionForm = ref<any>({ name: '', sort_order: 0 })

const editPosition = (row: any) => { editingPositionId.value = row.id; positionForm.value = { name: row.name, sort_order: row.sort_order }; showPositionDialog.value = true }

const savePosition = async () => {
  try {
    if (editingPositionId.value) { await positionApi.update(editingPositionId.value, positionForm.value) }
    else { await positionApi.create(positionForm.value) }
    ElMessage.success('保存成功')
    showPositionDialog.value = false
    loadPositions()
  } catch {}
}

const deletePosition = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除职位「${row.name}」？`, '确认', { type: 'warning' })
    await positionApi.delete(row.id)
    ElMessage.success('已删除')
    loadPositions()
  } catch {}
}

// ===== 排班 =====
const weekOffset = ref(0)
const scheduleData = ref<any[]>([])

const getWeekStart = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

const weekDays = computed(() => {
  const start = getWeekStart(weekOffset.value)
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days.map((label, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i)
    return { label: `${label} ${d.getMonth() + 1}/${d.getDate()}`, date: d.toISOString().slice(0, 10) }
  })
})

const weekLabel = computed(() => {
  const s = getWeekStart(weekOffset.value)
  const e = new Date(s); e.setDate(e.getDate() + 6)
  return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
})

const scheduleWeek = (dir: number) => { if (dir === 0) weekOffset.value = 0; else weekOffset.value += dir; buildSchedule() }

const buildSchedule = async () => {
  // Load staff and create mock schedule
  try {
    const res: any = await staffApi.list({ page: 1, page_size: 50 })
    const staffs = res.items || []
    scheduleData.value = staffs.map((s: any) => {
      const row: any = { name: s.name }
      weekDays.value.forEach(d => { row[d.date] = Math.random() > 0.3 ? '9:00-18:00' : null })
      return row
    })
  } catch {}
}

// ===== 考勤 =====
const attendanceDate = ref(new Date().toISOString().slice(0, 7))
const attendanceRecords = ref<any[]>([])
const attendanceLoading = ref(false)

const loadAttendance = async () => {
  attendanceLoading.value = true
  try {
    const [y, m] = attendanceDate.value.split('-')
    const startDate = `${y}-${m}-01`
    // Get last day of month
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    const endDate = `${y}-${m}-${lastDay}`
    const res: any = await attendanceApi.records({ start_date: startDate, end_date: endDate })
    attendanceRecords.value = Array.isArray(res) ? res : (res.items || [])
  } catch { attendanceRecords.value = [] } finally { attendanceLoading.value = false }
}

// ===== 积分 =====
const showPointsDialog = ref(false)
const pointsStaff = ref<any>(null)
const pointsForm = ref({ delta: 0, reason: '' })

const adjustPoints = (row: any, dir: number) => {
  pointsStaff.value = row
  pointsForm.value = { delta: dir * 10, reason: '' }
  showPointsDialog.value = true
}

const savePoints = async () => {
  try {
    await staffApi.updatePoints(pointsStaff.value.id, { points: pointsStaff.value.points + pointsForm.value.delta, reason: pointsForm.value.reason })
    ElMessage.success('积分已更新')
    showPointsDialog.value = false
    loadStaff()
  } catch {}
}

const viewPointsHistory = async (row: any) => {
  try {
    const res: any = await staffApi.getPoints(row.id)
    ElMessage.info(`${row.name} 当前积分: ${row.points}`)
  } catch {}
}

// ===== 工具 =====
const formatDate = (d: string) => d ? d.slice(0, 10) : '—'
const formatTime = (d: string) => d ? d.slice(11, 16) : '—'

onMounted(async () => { await loadPositions(); loadStaff() })
</script>

<style lang="scss" scoped>
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.schedule-header { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; .week-label { font-weight: 600; color: #303133; } }
.schedule-cell { padding: 4px 0; text-align: center; font-size: 12px; color: #C0C4CC; &.working { color: #67C23A; font-weight: 600; } }
</style>
