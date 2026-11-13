<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">预约管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="Plus" @click="showAddDialog">新增预约</el-button>
          <el-button icon="Setting" @click="showSettings = true">预约设置</el-button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <el-date-picker v-model="currentDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" @change="loadAppointments" />
        <el-button-group>
          <el-button @click="changeDate(-1)">前一天</el-button>
          <el-button @click="currentDate = today; loadAppointments()">今天</el-button>
          <el-button @click="changeDate(1)">后一天</el-button>
        </el-button-group>
        <el-select v-model="filterStaff" placeholder="全部员工" style="width: 140px" clearable @change="loadAppointments">
          <el-option label="全部员工" value="" />
          <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-radio-group v-model="viewMode" @change="loadAppointments">
          <el-radio-button value="staff">按员工</el-radio-button>
          <el-radio-button value="list">列表</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 今日统计 -->
      <div class="day-stats">
        <div class="stat-item"><span class="stat-num">{{ dayStats.confirmed_count }}</span><span class="stat-label">已确认</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#E6A23C">{{ dayStats.pending_count }}</span><span class="stat-label">待确认</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#67C23A">{{ dayStats.count }}</span><span class="stat-label">总预约</span></div>
      </div>

      <!-- 时间轴视图（按员工） -->
      <div v-if="viewMode === 'staff'" class="timeline-view">
        <div class="timeline-header">
          <div class="staff-col">员工</div>
          <div class="time-cols">
            <div v-for="h in hours" :key="h" class="time-col">{{ String(h).padStart(2,'0') }}:00</div>
          </div>
        </div>
        <div v-for="staff in timelineStaff" :key="staff.id" class="timeline-row">
          <div class="staff-col">
            <el-avatar :size="28">{{ staff.name?.charAt(0) }}</el-avatar>
            <span class="staff-name">{{ staff.name }}</span>
          </div>
          <div class="time-cols timeline-track" @click="onTrackClick(staff.id)">
            <div class="time-slot" v-for="h in hours" :key="h" />
            <!-- 预约块 -->
            <div v-for="apt in getAppointmentsForStaff(staff.id)" :key="apt.id"
              class="appointment-block"
              :class="'status-' + apt.status"
              :style="getAptStyle(apt)"
              @click.stop="showAptDetail(apt)">
              <div class="apt-time">{{ apt.start_time }}</div>
              <div class="apt-name">{{ apt.customer_name || '未指定' }}</div>
              <div class="apt-project">{{ apt.project_name || '' }}</div>
            </div>
          </div>
        </div>
        <el-empty v-if="!timelineStaff.length" description="暂无员工数据" />
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'">
        <el-table :data="appointments" v-loading="loading" stripe border>
          <el-table-column label="时间" width="100">
            <template #default="{ row }">{{ row.start_time }}</template>
          </el-table-column>
          <el-table-column prop="customer_name" label="顾客" width="120" />
          <el-table-column prop="staff_name" label="员工" width="100" />
          <el-table-column prop="project_name" label="项目" width="140" />
          <el-table-column prop="duration" label="时长(分)" width="80" align="center" />
          <el-table-column prop="room_name" label="房间" width="100" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="aptStatusType(row.status)" size="small">{{ aptStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status==='pending'" link type="success" @click="updateAptStatus(row,'confirmed')">确认</el-button>
              <el-button v-if="row.status==='confirmed'" link type="primary" @click="updateAptStatus(row,'arrived')">已到店</el-button>
              <el-button v-if="row.status==='arrived'" link type="primary" @click="updateAptStatus(row,'completed')">完成</el-button>
              <el-button link type="danger" @click="cancelApt(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 新增预约弹窗 -->
    <el-dialog v-model="showDialog" title="新增预约" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="顾客" prop="customer_id">
          <el-select v-model="formData.customer_id" filterable remote :remote-method="searchCustomer" placeholder="选择顾客" :loading="customerLoading" loading-text="加载中" @visible-change="onCustomerSelectVisible">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name + ' ' + c.phone" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务项目">
          <el-select v-model="formData.project_id" filterable placeholder="选择项目" @change="onProjectChange">
            <el-option v-for="p in projectList" :key="p.id" :label="p.name + ' (¥' + p.price + ')'" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="员工" prop="staff_id">
          <el-select v-model="formData.staff_id" filterable placeholder="选择员工">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="appointment_date">
          <el-date-picker v-model="formData.appointment_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时间" prop="start_time">
          <el-time-select v-model="formData.start_time" start="08:00" step="00:30" end="21:00" />
        </el-form-item>
        <el-form-item label="时长(分)">
          <el-input-number v-model="formData.duration" :min="15" :step="15" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预约设置弹窗 -->
    <el-dialog v-model="showSettings" title="预约设置" width="480px">
      <el-form :model="settingsForm" label-width="120px" v-if="settingsForm">
        <el-form-item label="工作时间起"><el-input v-model="settingsForm.work_start_time" placeholder="09:00" /></el-form-item>
        <el-form-item label="工作时间止"><el-input v-model="settingsForm.work_end_time" placeholder="21:00" /></el-form-item>
        <el-form-item label="时间间隔(分)"><el-input-number v-model="settingsForm.time_interval" :min="15" :step="5" /></el-form-item>
        <el-form-item label="每人最大预约"><el-input-number v-model="settingsForm.max_appointments_per_staff" :min="1" /></el-form-item>
        <el-form-item label="提前预约天数"><el-input-number v-model="settingsForm.advance_booking_days" :min="1" /></el-form-item>
        <el-form-item label="最少取消(时)"><el-input-number v-model="settingsForm.min_cancel_hours" :min="0" /></el-form-item>
        <el-form-item label="自动确认"><el-switch v-model="settingsForm.auto_confirm" /></el-form-item>
        <el-form-item label="公开预约"><el-switch v-model="settingsForm.public_booking" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appointmentApi, staffApi, customerApi, projectApi } from '@/api'

const today = new Date().toISOString().slice(0, 10)
const currentDate = ref(today)
const viewMode = ref('staff')
const filterStaff = ref('')
const loading = ref(false)
const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 - 21:00

// 数据
const appointments = ref<any[]>([])
const staffList = ref<any[]>([])
const projectList = ref<any[]>([])
const dayStats = ref({ count: 0, confirmed_count: 0, pending_count: 0 })

const timelineStaff = ref<any[]>([])

const changeDate = (dir: number) => {
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + dir)
  currentDate.value = d.toISOString().slice(0, 10)
  loadAppointments()
}

const loadAppointments = async () => {
  loading.value = true
  try {
    const params: any = { start_date: currentDate.value, end_date: currentDate.value }
    if (filterStaff.value) params.staff_id = filterStaff.value
    const res: any = await appointmentApi.list(params)
    appointments.value = res.items || res || []
    // Build timeline staff
    if (viewMode.value === 'staff') {
      const staffIds = new Set(appointments.value.map((a: any) => a.staff_id))
      timelineStaff.value = staffList.value.filter((s: any) => staffIds.has(s.id))
      if (!timelineStaff.value.length && staffList.value.length) timelineStaff.value = staffList.value.slice(0, 5)
    }
  } catch { appointments.value = [] } finally { loading.value = false }
  // Day count
  try {
    const list: any = await appointmentApi.dayCount({ start_date: currentDate.value, end_date: currentDate.value })
    if (Array.isArray(list) && list.length > 0) {
      dayStats.value = { count: list[0].count || 0, confirmed_count: list[0].confirmed_count || 0, pending_count: list[0].pending_count || 0 }
    } else {
      dayStats.value = { count: 0, confirmed_count: 0, pending_count: 0 }
    }
  } catch {}
}

const getAppointmentsForStaff = (staffId: string) => appointments.value.filter((a: any) => a.staff_id === staffId)

const getAptStyle = (apt: any) => {
  const [h, m] = (apt.start_time || '09:00').split(':').map(Number)
  const startCol = h - 8 + m / 60
  const duration = (apt.duration || 60) / 60
  const colWidth = 100 / hours.length
  return {
    left: `${startCol * colWidth}%`,
    width: `${Math.max(duration * colWidth, colWidth * 0.5)}%`,
  }
}

const onTrackClick = (staffId: string) => {
  formData.value.staff_id = staffId
  formData.value.appointment_date = currentDate.value
  showDialog.value = true
}

const showAptDetail = (apt: any) => {
  ElMessage.info(`${apt.customer_name || '未指定'} | ${apt.start_time} | ${apt.project_name || '无项目'} | ${apt.status}`)
}

// 状态
const aptStatusLabel = (s: string) => ({ pending: '待确认', confirmed: '已确认', arrived: '已到店', completed: '已完成', cancelled: '已取消', no_show: '未到店' }[s] || s)
const aptStatusType = (s: string): any => ({ pending: 'warning', confirmed: 'success', arrived: 'primary', completed: '', cancelled: 'info', no_show: 'danger' }[s] || 'info')

const updateAptStatus = async (row: any, newStatus: string) => {
  try {
    await appointmentApi.updateStatus(row.id, { status: newStatus })
    ElMessage.success('状态已更新')
    loadAppointments()
  } catch {}
}

const cancelApt = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('取消原因', '取消预约', { inputPlaceholder: '请输入原因' })
    await appointmentApi.updateStatus(row.id, { status: 'cancelled', cancel_reason: value })
    ElMessage.success('已取消')
    loadAppointments()
  } catch {}
}

// 新增预约
const showDialog = ref(false)
const saving = ref(false)
const formRef = ref()
const customerOptions = ref<any[]>([])
const formData = ref<any>({})
const formRules = { customer_id: [{ required: true, message: '选择顾客' }], staff_id: [{ required: true, message: '选择员工' }], appointment_date: [{ required: true, message: '选择日期' }], start_time: [{ required: true, message: '选择时间' }] }

const showAddDialog = () => {
  formData.value = { customer_id: null, project_id: null, staff_id: null, appointment_date: currentDate.value, start_time: '10:00', duration: 60, remark: '' }
  showDialog.value = true
  // Load initial 10 customers sorted by pinyin
  loadInitialCustomers()
}

const customerLoading = ref(false)

const loadInitialCustomers = async () => {
  customerLoading.value = true
  try {
    const r: any = await customerApi.list({ page: 1, page_size: 10, sort_by: 'name' })
    customerOptions.value = r.items || []
  } catch { customerOptions.value = [] }
  customerLoading.value = false
}

const onCustomerSelectVisible = (visible: boolean) => {
  if (visible && customerOptions.value.length === 0) {
    loadInitialCustomers()
  }
}

let customerSearchTimer: any = null
const searchCustomer = async (query: string) => {
  clearTimeout(customerSearchTimer)
  if (!query) {
    loadInitialCustomers()
    return
  }
  customerSearchTimer = setTimeout(async () => {
    customerLoading.value = true
    try {
      const r: any = await customerApi.list({ search: query, page: 1, page_size: 10, sort_by: 'name' })
      customerOptions.value = r.items || []
    } catch { customerOptions.value = [] }
    customerLoading.value = false
  }, 300)
}

const onProjectChange = (id: string) => {
  const p = projectList.value.find((i: any) => i.id === id)
  if (p) formData.value.duration = p.duration || 60
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await appointmentApi.create(formData.value)
    ElMessage.success('预约已创建')
    showDialog.value = false
    loadAppointments()
  } catch {} finally { saving.value = false }
}

// 设置
const showSettings = ref(false)
const settingsForm = ref<any>(null)

const loadSettings = async () => {
  try { settingsForm.value = await appointmentApi.settings() as any } catch { settingsForm.value = {} }
}

const saveSettings = async () => {
  try { await appointmentApi.updateSettings(settingsForm.value); ElMessage.success('设置已保存'); showSettings.value = false } catch {}
}

onMounted(async () => {
  try { const r: any = await staffApi.list({ page: 1, page_size: 50 }); staffList.value = r.items || [] } catch {}
  try { const r: any = await projectApi.list({ page: 1, page_size: 100 }); projectList.value = r.items || [] } catch {}
  loadAppointments()
  loadSettings()
})
</script>

<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
.day-stats {
  display: flex; gap: 24px; margin-bottom: 16px; padding: 12px 16px; background: #F5F7FA; border-radius: 8px;
  .stat-item { display: flex; flex-direction: column; align-items: center;
    .stat-num { font-size: 24px; font-weight: 800; color: #409EFF; }
    .stat-label { font-size: 12px; color: #909399; }
  }
}

/* 时间轴 */
.timeline-view { border: 1px solid #EBEEF5; border-radius: 8px; overflow: hidden; }
.timeline-header, .timeline-row { display: flex; border-bottom: 1px solid #EBEEF5; }
.timeline-header { background: #F5F7FA; font-size: 12px; color: #909399; font-weight: 600; }
.staff-col { width: 120px; min-width: 120px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; border-right: 1px solid #EBEEF5; }
.staff-name { font-size: 13px; font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.time-cols { display: flex; flex: 1; }
.time-col { flex: 1; text-align: center; padding: 6px 0; border-right: 1px solid #F5F7FA; font-size: 11px; }
.timeline-track { position: relative; min-height: 48px; cursor: pointer; }
.time-slot { flex: 1; border-right: 1px solid #F5F7FA; }
.appointment-block {
  position: absolute; top: 2px; bottom: 2px; border-radius: 6px; padding: 3px 6px;
  font-size: 11px; overflow: hidden; cursor: pointer; z-index: 1;
  background: #ECF5FF; border: 1px solid #409EFF; color: #409EFF;
  &.status-confirmed { background: #F0F9EB; border-color: #67C23A; color: #67C23A; }
  &.status-arrived { background: #FDF6EC; border-color: #E6A23C; color: #E6A23C; }
  &.status-completed { background: #F4F4F5; border-color: #C0C4CC; color: #909399; }
  &.status-cancelled { background: #FEF0F0; border-color: #F56C6C; color: #F56C6C; text-decoration: line-through; }
  .apt-time { font-weight: 700; }
  .apt-name { font-weight: 600; }
  .apt-project { opacity: 0.8; }
}
</style>
