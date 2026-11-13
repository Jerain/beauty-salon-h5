<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">门店管理</span>
        <el-button v-if="isBrandLevel" type="primary" icon="Plus" @click="showAddDialog">{{ addBtnText }}</el-button>
      </div>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="门店管理" name="store" />
        <el-tab-pane label="房间管理" name="room" />
      </el-tabs>

      <!-- 门店列表 -->
      <template v-if="activeTab === 'store'">
        <el-table :data="shops" v-loading="loading" stripe border>
          <el-table-column prop="name" label="门店名称" min-width="160" />
          <el-table-column prop="code" label="门店编码" width="120" />
          <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '营业中' : '已停业' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="isBrandLevel" label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editShop(row)">编辑</el-button>
              <el-button link :type="row.is_active ? 'warning' : 'success'" @click="toggleShop(row)">{{ row.is_active ? '停业' : '营业' }}</el-button>
              <el-button link type="primary" @click="viewRooms(row)">房间</el-button>
              <el-button link type="danger" @click="deleteShop(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <!-- 房间列表 -->
      <template v-if="activeTab === 'room'">
        <div class="filter-bar">
          <el-select v-model="selectedShopId" placeholder="选择门店" style="width: 200px" @change="loadRooms">
            <el-option v-for="s in shops" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
        <el-table :data="rooms" v-loading="roomLoading" stripe border>
          <el-table-column prop="name" label="房间名称" min-width="160" />
          <el-table-column prop="beds" label="床位数" width="100" align="center" />
          <el-table-column prop="floor" label="楼层" width="80" align="center">
            <template #default="{ row }">{{ row.floor || '—' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '可用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-if="isBrandLevel" label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="editRoom(row)">编辑</el-button>
              <el-button link :type="row.is_active ? 'warning' : 'success'" @click="toggleRoom(row)">{{ row.is_active ? '停用' : '启用' }}</el-button>
              <el-button link type="danger" @click="deleteRoom(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!selectedShopId" description="请先选择一个门店" />
      </template>
    </div>

    <!-- 门店新增/编辑弹窗 -->
    <el-dialog v-model="showShopDialog" :title="editingShopId ? '编辑门店' : '添加门店'" width="520px" destroy-on-close>
      <el-form ref="shopFormRef" :model="shopForm" :rules="shopRules" label-width="80px">
        <el-form-item label="门店名称" prop="name"><el-input v-model="shopForm.name" /></el-form-item>
        <el-form-item label="门店编码" prop="code"><el-input v-model="shopForm.code" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="shopForm.address" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="shopForm.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShopDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveShop">保存</el-button>
      </template>
    </el-dialog>

    <!-- 房间新增/编辑弹窗 -->
    <el-dialog v-model="showRoomDialog" :title="editingRoomId ? '编辑房间' : '添加房间'" width="420px" destroy-on-close>
      <el-form ref="roomFormRef" :model="roomForm" :rules="roomRules" label-width="80px">
        <el-form-item label="所属门店">
          <el-select v-model="roomForm.shop_id" placeholder="选择门店" :disabled="!!editingRoomId">
            <el-option v-for="s in shops" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间名称" prop="name"><el-input v-model="roomForm.name" /></el-form-item>
        <el-form-item label="床位数" prop="beds"><el-input-number v-model="roomForm.beds" :min="1" :max="20" /></el-form-item>
        <el-form-item label="楼层"><el-input-number v-model="roomForm.floor" :min="1" :max="99" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoomDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRoom">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { shopApi, roomApi } from '@/api'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const isBrandLevel = computed(() => appStore.isBrandLevel)

const activeTab = ref('store')
const loading = ref(false)
const saving = ref(false)

// ===== 门店 =====
const shops = ref<any[]>([])
const showShopDialog = ref(false)
const shopFormRef = ref()
const editingShopId = ref<string | null>(null)
const shopForm = ref<any>({ name: '', code: '', address: '', phone: '' })
const shopRules = {
  name: [{ required: true, message: '请输入门店名称' }],
  code: [{ required: true, message: '请输入门店编码' }],
}

const addBtnText = computed(() => {
  return activeTab.value === 'store' ? '添加门店' : '添加房间'
})

const loadShops = async () => {
  loading.value = true
  try {
    shops.value = await shopApi.list() as any || []
  } catch { shops.value = [] } finally { loading.value = false }
}

const showAddDialog = () => {
  if (activeTab.value === 'room') {
    if (!selectedShopId.value) { ElMessage.warning('请先选择一个门店'); return }
    editingRoomId.value = null
    roomForm.value = { shop_id: selectedShopId.value, name: '', beds: 1, floor: null }
    showRoomDialog.value = true
    return
  }
  editingShopId.value = null
  shopForm.value = { name: '', code: '', address: '', phone: '' }
  showShopDialog.value = true
}

const editShop = (row: any) => {
  editingShopId.value = row.id
  shopForm.value = { ...row }
  showShopDialog.value = true
}

const saveShop = async () => {
  const valid = await shopFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingShopId.value) {
      await shopApi.update(editingShopId.value, shopForm.value)
      ElMessage.success('更新成功')
    } else {
      await shopApi.create(shopForm.value)
      ElMessage.success('创建成功')
    }
    showShopDialog.value = false
    loadShops()
  } catch { /* handled by interceptor */ } finally { saving.value = false }
}

const deleteShop = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除门店「${row.name}」？`, '确认删除', { type: 'warning' })
    await shopApi.delete(row.id)
    ElMessage.success('已删除')
    loadShops()
  } catch {}
}

const toggleShop = async (row: any) => {
  try {
    const action = row.is_active ? '停业' : '营业'
    await ElMessageBox.confirm(`确定将门店「${row.name}」设为${action}？`, `确认${action}`, { type: 'warning' })
    await shopApi.update(row.id, { is_active: !row.is_active })
    ElMessage.success(`已${action}`)
    loadShops()
  } catch {}
}

// ===== 房间 =====
const selectedShopId = ref<string>('')
const rooms = ref<any[]>([])
const roomLoading = ref(false)
const showRoomDialog = ref(false)
const roomFormRef = ref()
const editingRoomId = ref<string | null>(null)
const roomForm = ref<any>({ shop_id: '', name: '', beds: 1, floor: null })
const roomRules = {
  name: [{ required: true, message: '请输入房间名称' }],
}

const loadRooms = async () => {
  if (!selectedShopId.value) { rooms.value = []; return }
  roomLoading.value = true
  try {
    rooms.value = await roomApi.list(selectedShopId.value) as any || []
  } catch { rooms.value = [] } finally { roomLoading.value = false }
}

const viewRooms = (row: any) => {
  activeTab.value = 'room'
  selectedShopId.value = row.id
  loadRooms()
}

const editRoom = (row: any) => {
  editingRoomId.value = row.id
  roomForm.value = { ...row }
  showRoomDialog.value = true
}

const saveRoom = async () => {
  const valid = await roomFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingRoomId.value) {
      await roomApi.update(editingRoomId.value, roomForm.value)
      ElMessage.success('更新成功')
    } else {
      await roomApi.create(roomForm.value)
      ElMessage.success('创建成功')
    }
    showRoomDialog.value = false
    loadRooms()
  } catch { /* handled by interceptor */ } finally { saving.value = false }
}

const toggleRoom = async (row: any) => {
  try {
    await roomApi.update(row.id, { is_active: !row.is_active })
    ElMessage.success(row.is_active ? '已停用' : '已启用')
    loadRooms()
  } catch {}
}

const deleteRoom = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除房间「${row.name}」？`, '确认删除', { type: 'warning' })
    await roomApi.delete(row.id)
    ElMessage.success('已删除')
    loadRooms()
  } catch {}
}

const onTabChange = () => {
  if (activeTab.value === 'store') loadShops()
  if (activeTab.value === 'room') {
    if (selectedShopId.value) loadRooms()
  }
}

onMounted(() => { loadShops() })
</script>

<style lang="scss" scoped>
.filter-bar { margin-bottom: 12px; }
</style>
