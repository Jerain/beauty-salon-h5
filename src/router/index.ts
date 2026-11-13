import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layout/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/home',
    children: [
      // ===== 首页 =====
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' },
      },

      // ===== 门店经营 =====
      {
        path: 'operate/appointment',
        name: 'Appointment',
        component: () => import('@/views/operate/appointment/index.vue'),
        meta: { title: '预约', icon: 'Calendar', group: '门店经营' },
      },
      {
        path: 'operate/billing',
        name: 'Billing',
        component: () => import('@/views/operate/billing/index.vue'),
        meta: { title: '开单', icon: 'ShoppingCart', group: '门店经营' },
      },
      {
        path: 'operate/member',
        name: 'Member',
        component: () => import('@/views/operate/member/index.vue'),
        meta: { title: '顾客', icon: 'User', group: '门店经营' },
      },
      {
        path: 'operate/member/detail/:id',
        name: 'MemberDetail',
        component: () => import('@/views/operate/member/detail.vue'),
        meta: { title: '顾客详情', hidden: true, activeMenu: 'Member' },
      },
      {
        path: 'operate/order',
        name: 'Order',
        component: () => import('@/views/operate/order/index.vue'),
        meta: { title: '订单', icon: 'List', group: '门店经营' },
      },
      {
        path: 'operate/order/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/operate/order/detail.vue'),
        meta: { title: '订单详情', hidden: true, activeMenu: 'Order' },
      },

      // ===== 经营工具 =====
      {
        path: 'operate/bookkeeping',
        name: 'Bookkeeping',
        component: () => import('@/views/tool/bookkeeping/index.vue'),
        meta: { title: '收支', icon: 'Wallet', group: '经营工具' },
      },
      {
        path: 'operate/inventory',
        name: 'Inventory',
        component: () => import('@/views/tool/inventory/index.vue'),
        meta: { title: '库存', icon: 'Box', group: '经营工具' },
      },
      {
        path: 'operate/inventory/detail',
        name: 'InventoryDetail',
        component: () => import('@/views/tool/inventory/detail.vue'),
        meta: { title: '入库记录', icon: 'Document', group: '经营工具' },
      },
      {
        path: 'operate/inventory/account',
        name: 'InventoryAccount',
        component: () => import('@/views/tool/inventory/account.vue'),
        meta: { title: '成本核算', icon: 'Coin', group: '经营工具' },
      },
      {
        path: 'operate/inventory/warehousing',
        name: 'InventoryWarehousing',
        component: () => import('@/views/tool/inventory/warehousing.vue'),
        meta: { title: '入库/出库', hidden: true, activeMenu: 'InventoryDetail' },
      },
      {
        path: 'operate/target',
        name: 'Target',
        component: () => import('@/views/tool/target/index.vue'),
        meta: { title: '目标', icon: 'Aim', group: '经营工具' },
      },

      // ===== 经营报表 =====
      {
        path: 'operate/data',
        name: 'DataAnalysis',
        component: () => import('@/views/data/analysis/index.vue'),
        meta: { title: '经营数据', icon: 'DataLine', group: '经营报表' },
      },
      {
        path: 'operate/data/beautician',
        name: 'Beautician',
        component: () => import('@/views/data/beautician/index.vue'),
        meta: { title: '美容师统计', icon: 'Avatar', group: '经营报表' },
      },
      {
        path: 'operate/finance',
        name: 'Finance',
        component: () => import('@/views/data/finance/index.vue'),
        meta: { title: '财务数据', icon: 'Money', group: '经营报表' },
      },
      {
        path: 'operate/report',
        name: 'Report',
        component: () => import('@/views/data/report/index.vue'),
        meta: { title: '报表中心', icon: 'Document', group: '经营报表' },
      },
      {
        path: 'operate/log',
        name: 'SystemLog',
        component: () => import('@/views/data/log/index.vue'),
        meta: { title: '系统日志', icon: 'Notebook', group: '经营报表' },
      },

      // ===== 拓客工具 =====
      {
        path: 'marketing/tool',
        name: 'MarketingTool',
        component: () => import('@/views/marketing/tool/index.vue'),
        meta: { title: '营销', icon: 'Promotion', group: '拓客工具' },
      },
      {
        path: 'marketing/sms',
        name: 'SMS',
        component: () => import('@/views/marketing/sms/index.vue'),
        meta: { title: '短信', icon: 'Message', group: '拓客工具' },
      },
      {
        path: 'marketing/wechat',
        name: 'Wechat',
        component: () => import('@/views/marketing/wechat/index.vue'),
        meta: { title: '微信', icon: 'ChatDotRound', group: '拓客工具' },
      },

      // ===== 系统设置 =====
      {
        path: 'setting/store',
        name: 'Store',
        component: () => import('@/views/setting/store/index.vue'),
        meta: { title: '门店管理', icon: 'OfficeBuilding', group: '系统设置' },
      },
      {
        path: 'setting/item',
        name: 'Item',
        component: () => import('@/views/setting/item/index.vue'),
        meta: { title: '品项管理', icon: 'Goods', group: '系统设置' },
      },
      {
        path: 'setting/staff',
        name: 'Staff',
        component: () => import('@/views/setting/staff/index.vue'),
        meta: { title: '员工管理', icon: 'UserFilled', group: '系统设置' },
      },
      {
        path: 'setting/commission',
        name: 'Commission',
        component: () => import('@/views/setting/commission/index.vue'),
        meta: { title: '提成管理', icon: 'Coin', group: '系统设置' },
      },
      {
        path: 'setting/authority',
        name: 'Authority',
        component: () => import('@/views/setting/authority/index.vue'),
        meta: { title: '应用设置', icon: 'Setting', group: '系统设置' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
