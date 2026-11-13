<template>
  <header class="topbar">
    <div class="topbar-left">
      <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <!-- 面包屑 -->
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in breadcrumbs"
          :key="item.path"
          :to="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="topbar-right">
      <!-- 门店切换 -->
      <el-dropdown v-if="appStore.isBrandLevel" trigger="click" @command="handleShopSwitch">
        <span class="topbar-item store-switch">
          <el-icon><OfficeBuilding /></el-icon>
          {{ appStore.currentShopName }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="__all__">全部门店</el-dropdown-item>
            <el-dropdown-item
              v-for="s in appStore.shopList"
              :key="s.id"
              :command="s.id"
            >
              {{ s.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span v-else class="topbar-item store-switch">
        <el-icon><OfficeBuilding /></el-icon>
        {{ appStore.currentShopName }}
      </span>

      <!-- 消息提醒 -->
      <el-badge :value="messageCount" :hidden="!messageCount" class="topbar-badge">
        <el-icon class="topbar-icon" @click="showMessages = !showMessages">
          <Bell />
        </el-icon>
      </el-badge>

      <!-- 用户信息 -->
      <el-dropdown trigger="click">
        <span class="topbar-item user-info">
          <el-avatar :size="28" class="user-avatar">
            {{ userStore.userInfo?.name?.[0] || '管' }}
          </el-avatar>
          {{ userStore.userInfo?.name || '管理员' }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人信息</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 消息面板 -->
    <transition name="slide-down">
      <div v-if="showMessages" class="message-panel">
        <div class="message-header">
          <span>消息提醒</span>
          <el-button link type="primary" @click="showMessages = false">关闭</el-button>
        </div>
        <div class="message-list">
          <div v-for="(msg, i) in messages" :key="i" class="message-item">
            <el-icon :color="msg.color"><component :is="msg.icon" /></el-icon>
            <div class="message-content">
              <div class="message-title">{{ msg.title }}</div>
              <div class="message-desc">{{ msg.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { messageApi } from '@/api'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const showMessages = ref(false)

// 面包屑
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  return matched.map((r) => ({
    title: r.meta.title as string,
    path: r.path,
  }))
})

// 消息数据
const messages = ref<any[]>([])
const messageCount = ref(0)

const loadMessages = async () => {
  try {
    // 获取消息概览（各类型计数）
    const overview: any = await messageApi.overview()
    messageCount.value = overview.unread || 0

    // 获取最近消息列表
    const list: any = await messageApi.list({ is_read: false })
    const items = Array.isArray(list) ? list : []

    if (items.length > 0) {
      messages.value = items.slice(0, 10).map((m: any) => ({
        icon: getIconByType(m.message_type),
        color: getColorByType(m.message_type),
        title: m.title,
        desc: m.content || '',
        id: m.id,
      }))
    } else {
      // 没有未读消息，使用概览数据构造提示
      messages.value = buildOverviewMessages(overview)
    }
  } catch (e) {
    console.error('Failed to load messages:', e)
    messages.value = [{ icon: 'Warning', color: '#F56C6C', title: '加载失败', desc: '请刷新重试' }]
  }
}

function getIconByType(type: string): string {
  const map: Record<string, string> = {
    birthday: 'Present', appointment: 'Calendar', card_expire: 'Warning',
    no_visit: 'User', recharge: 'Wallet', system: 'Bell',
  }
  return map[type] || 'Bell'
}

function getColorByType(type: string): string {
  const map: Record<string, string> = {
    birthday: '#E6A23C', appointment: '#409EFF', card_expire: '#F56C6C',
    no_visit: '#67C23A', recharge: '#E6A23C', system: '#909399',
  }
  return map[type] || '#909399'
}

function buildOverviewMessages(ov: any): any[] {
  const items: any[] = []
  if (ov.birthday > 0) items.push({ icon: 'Present', color: '#E6A23C', title: '顾客生日', desc: `${ov.birthday}位顾客即将过生日` })
  if (ov.appointment > 0) items.push({ icon: 'Calendar', color: '#409EFF', title: '预约提醒', desc: `${ov.appointment}条预约待处理` })
  if (ov.card_expire > 0) items.push({ icon: 'Warning', color: '#F56C6C', title: '会员卡到期', desc: `${ov.card_expire}张会员卡即将到期` })
  if (ov.no_visit > 0) items.push({ icon: 'User', color: '#67C23A', title: '顾客回访', desc: `${ov.no_visit}位顾客久未到店` })
  if (items.length === 0) items.push({ icon: 'Bell', color: '#909399', title: '暂无消息', desc: '当前没有新的提醒' })
  return items
}

const handleShopSwitch = (command: string) => {
  if (command === '__all__') {
    appStore.setCurrentShop(null, '全部门店')
  } else {
    const shop = appStore.shopList.find(s => s.id === command)
    if (shop) {
      appStore.setCurrentShop(shop.id, shop.name)
    }
  }
}

const handleLogout = () => {
  userStore.logout()
  appStore.logout()
  router.push('/login')
}

onMounted(() => {
  appStore.loadStores()
  loadMessages()
})
</script>

<style lang="scss" scoped>
.topbar {
  height: $topbar-height;
  background: $bg-card;
  border-bottom: 1px solid $border-lighter;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  position: relative;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  color: $text-regular;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: $primary-color; }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.topbar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: $text-regular;
  font-size: 14px;
  &:hover { color: $primary-color; }
}

.topbar-icon {
  font-size: 20px;
  cursor: pointer;
  color: $text-regular;
  &:hover { color: $primary-color; }
}

.topbar-badge {
  line-height: 1;
}

.user-avatar {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  color: #fff;
  font-size: 13px;
}

.store-switch {
  padding: 6px 12px;
  background: $bg-page;
  border-radius: $radius-sm;
  font-size: 13px;
}

/* 消息面板 */
.message-panel {
  position: absolute;
  top: $topbar-height;
  right: 20px;
  width: 360px;
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  border: 1px solid $border-lighter;
  z-index: 100;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid $border-lighter;
  font-weight: 600;
  font-size: 14px;
}

.message-list {
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid $border-lighter;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: $bg-page; }
  &:last-child { border-bottom: none; }

  .el-icon { font-size: 20px; margin-top: 2px; flex-shrink: 0; }
}

.message-content {
  flex: 1;
}

.message-title {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.message-desc {
  font-size: 12px;
  color: $text-secondary;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
