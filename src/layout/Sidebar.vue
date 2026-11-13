<template>
  <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="@/assets/logo.svg" alt="Logo" class="logo-icon" />
      <span v-show="!appStore.sidebarCollapsed" class="logo-text">畅联智通门店后台管理</span>
    </div>

    <!-- 导航菜单 -->
    <el-scrollbar class="sidebar-menu-wrap">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <!-- 首页 -->
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <!-- 门店经营 -->
        <el-sub-menu index="operate">
          <template #title>
            <el-icon><ShoppingBag /></el-icon>
            <span>门店经营</span>
          </template>
          <el-menu-item index="/operate/appointment">
            <el-icon><Calendar /></el-icon>预约
          </el-menu-item>
          <el-menu-item index="/operate/billing">
            <el-icon><ShoppingCart /></el-icon>开单
          </el-menu-item>
          <el-menu-item index="/operate/member">
            <el-icon><User /></el-icon>顾客
          </el-menu-item>
          <el-menu-item index="/operate/order">
            <el-icon><List /></el-icon>订单
          </el-menu-item>
        </el-sub-menu>

        <!-- 经营工具 -->
        <el-sub-menu index="tool">
          <template #title>
            <el-icon><SetUp /></el-icon>
            <span>经营工具</span>
          </template>
          <el-menu-item index="/operate/bookkeeping">
            <el-icon><Wallet /></el-icon>收支
          </el-menu-item>
          <el-menu-item index="/operate/inventory">
            <el-icon><Box /></el-icon>库存
          </el-menu-item>
          <el-menu-item index="/operate/inventory/detail">
            <el-icon><Document /></el-icon>入库记录
          </el-menu-item>
          <el-menu-item index="/operate/inventory/account">
            <el-icon><Coin /></el-icon>成本核算
          </el-menu-item>
          <el-menu-item index="/operate/target">
            <el-icon><Aim /></el-icon>目标
          </el-menu-item>
        </el-sub-menu>

        <!-- 经营报表 -->
        <el-sub-menu index="data">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>经营报表</span>
          </template>
          <el-menu-item index="/operate/data">
            <el-icon><DataLine /></el-icon>经营数据
          </el-menu-item>
          <el-menu-item index="/operate/data/beautician">
            <el-icon><Avatar /></el-icon>美容师统计
          </el-menu-item>
          <el-menu-item index="/operate/finance">
            <el-icon><Money /></el-icon>财务数据
          </el-menu-item>
          <el-menu-item index="/operate/report">
            <el-icon><Document /></el-icon>报表中心
          </el-menu-item>
          <el-menu-item index="/operate/log">
            <el-icon><Notebook /></el-icon>系统日志
          </el-menu-item>
        </el-sub-menu>

        <!-- 拓客工具 -->
        <el-sub-menu index="marketing">
          <template #title>
            <el-icon><Promotion /></el-icon>
            <span>拓客工具</span>
          </template>
          <el-menu-item index="/marketing/tool">
            <el-icon><Present /></el-icon>营销
          </el-menu-item>
          <el-menu-item index="/marketing/sms">
            <el-icon><Message /></el-icon>短信
          </el-menu-item>
          <el-menu-item index="/marketing/wechat">
            <el-icon><ChatDotRound /></el-icon>微信
          </el-menu-item>
        </el-sub-menu>

        <!-- 系统设置 -->
        <el-sub-menu index="setting">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/setting/store">
            <el-icon><OfficeBuilding /></el-icon>门店管理
          </el-menu-item>
          <el-menu-item index="/setting/item">
            <el-icon><Goods /></el-icon>品项管理
          </el-menu-item>
          <el-menu-item index="/setting/staff">
            <el-icon><UserFilled /></el-icon>员工管理
          </el-menu-item>
          <el-menu-item index="/setting/commission">
            <el-icon><Coin /></el-icon>提成管理
          </el-menu-item>
          <el-menu-item index="/setting/authority">
            <el-icon><Lock /></el-icon>应用设置
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const activeMenu = computed(() => {
  const { meta, path } = route
  return (meta.activeMenu as string) || path
})
</script>

<style lang="scss" scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: $sidebar-width;
  background: $bg-sidebar;
  transition: width 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.collapsed {
    width: $sidebar-collapsed-width;
  }
}

.sidebar-logo {
  height: $topbar-height;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;

  .logo-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
  }
}

.sidebar-menu-wrap {
  flex: 1;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  background: transparent;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: rgba(255, 255, 255, 0.7);
    height: 44px;
    line-height: 44px;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: $bg-sidebar-active;
    color: $primary-color;
    font-weight: 600;
  }

  :deep(.el-sub-menu .el-menu) {
    background: rgba(0, 0, 0, 0.15);
  }

  :deep(.el-sub-menu .el-menu .el-menu-item) {
    padding-left: 52px !important;
    min-width: auto;
  }
}
</style>
