import request from './request'

// ========== 认证 ==========
export const authApi = {
  login: (data: { phone: string; password: string }) =>
    request.post('/auth/login', data),
  getUserInfo: () =>
    request.get('/auth/me'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    request.put('/auth/password', data),
}

// ========== 顾客 ==========
export const customerApi = {
  list: (params: any) =>
    request.get('/customers', { params }),
  detail: (id: string) =>
    request.get(`/customers/${id}`),
  create: (data: any) =>
    request.post('/customers', data),
  update: (id: string, data: any) =>
    request.put(`/customers/${id}`, data),
  delete: (id: string) =>
    request.delete(`/customers/${id}`),
  cardTransactions: (id: string, params?: any) =>
    request.get(`/customer/${id}/card-transactions`, { params }),
}

// ========== 标签 & 来源 ==========
export const tagApi = {
  list: () => request.get('/tags'),
  create: (data: any) => request.post('/tags', data),
}
export const sourceApi = {
  list: () => request.get('/sources'),
  create: (data: any) => request.post('/sources', data),
}

// ========== 门店 ==========
export const shopApi = {
  list: (params?: any) => request.get('/shops', { params }),
  detail: (id: string) => request.get(`/shops/${id}`),
  create: (data: any) => request.post('/shops', data),
  update: (id: string, data: any) => request.put(`/shops/${id}`, data),
  delete: (id: string) => request.delete(`/shops/${id}`),
  rooms: (shopId: string, params?: any) => request.get(`/shops/${shopId}/rooms`, { params }),
}

export const roomApi = {
  list: (shopId: string, params?: any) => request.get(`/shops/${shopId}/rooms`, { params }),
  detail: (id: string) => request.get(`/shops/rooms/${id}`),
  create: (data: any) => request.post('/shops/rooms', data),
  update: (id: string, data: any) => request.put(`/shops/rooms/${id}`, data),
  delete: (id: string) => request.delete(`/shops/rooms/${id}`),
}

// ========== 职位 ==========
export const positionApi = {
  list: () => request.get('/positions'),
  create: (data: any) => request.post('/positions', data),
  update: (id: string, data: any) => request.put(`/positions/${id}`, data),
  delete: (id: string) => request.delete(`/positions/${id}`),
}

// ========== 员工 ==========
export const staffApi = {
  list: (params?: any) =>
    request.get('/staff', { params }),
  detail: (id: string) =>
    request.get(`/staff/${id}`),
  create: (data: any) =>
    request.post('/staff', data),
  update: (id: string, data: any) =>
    request.put(`/staff/${id}`, data),
  delete: (id: string) =>
    request.delete(`/staff/${id}`),
  switchStatus: (id: string) =>
    request.put(`/staff/${id}/switch-status`),
  getPoints: (id: string) =>
    request.get(`/staff/${id}/points`),
  updatePoints: (id: string, data: any) =>
    request.put(`/staff/${id}/points`, data),
}

// ========== 分类 ==========
export const categoryApi = {
  list: (params?: any) => request.get('/categories', { params }),
  tree: () => request.get('/categories/tree'),
  create: (data: any) => request.post('/categories', data),
  update: (id: string, data: any) => request.put(`/categories/${id}`, data),
  delete: (id: string) => request.delete(`/categories/${id}`),
}

// ========== 品牌 ==========
export const brandApi = {
  list: () => request.get('/brands'),
  create: (data: any) => request.post('/brands', data),
  delete: (id: string) => request.delete(`/brands/${id}`),
}

// ========== 产品单位 ==========
export const productUnitApi = {
  list: () => request.get('/product-units'),
  create: (data: any) => request.post('/product-units', data),
  delete: (id: string) => request.delete(`/product-units/${id}`),
}

// ========== 服务项目 ==========
export const projectApi = {
  list: (params?: any) => request.get('/projects', { params }),
  detail: (id: string) => request.get(`/projects/${id}`),
  create: (data: any) => request.post('/projects', data),
  update: (id: string, data: any) => request.put(`/projects/${id}`, data),
  delete: (id: string) => request.delete(`/projects/${id}`),
  updateStatus: (id: string, data: any) => request.put(`/projects/${id}/status`, data),
}

// ========== 产品 ==========
export const productApi = {
  list: (params?: any) => request.get('/products', { params }),
  detail: (id: string) => request.get(`/products/${id}`),
  create: (data: any) => request.post('/products', data),
  update: (id: string, data: any) => request.put(`/products/${id}`, data),
  delete: (id: string) => request.delete(`/products/${id}`),
  updateStatus: (id: string, data: any) => request.put(`/products/${id}/status`, data),
}

// ========== 库存 ==========
export const inventoryApi = {
  list: (params?: any) => request.get('/inventory', { params }),
  total: () => request.get('/inventory/total'),
  operate: (data: any) => request.post('/inventory/operate', data),
  batchOperate: (data: any) => request.post('/inventory/batch-operate', data),
  logs: (params?: any) => request.get('/inventory/logs', { params }),
  alerts: () => request.get('/inventory/alerts'),
}

// ========== 入库/出库单据 ==========
export const stockOrderApi = {
  list: (params?: any) => request.get('/stock-orders', { params }),
  detail: (id: string) => request.get(`/stock-orders/${id}`),
  create: (data: any) => request.post('/stock-orders', data),
  // 入库/出库明细（跨单展开）
  details: (params?: any) => request.get('/stock-order-details', { params }),
}

// ========== 成本核算 ==========
export const costApi = {
  summary: (params?: any) => request.get('/inventory/cost/summary', { params }),
  adjustableProducts: (params?: any) => request.get('/inventory/cost-adjust/products', { params }),
  submitAdjustment: (data: any) => request.post('/inventory/cost-adjust/submit', data),
  adjustmentRecords: (params?: any) => request.get('/inventory/cost-adjust/records', { params }),
  adjustmentDetail: (id: string) => request.get(`/inventory/cost-adjust/records/${id}`),
}

// ========== 次卡/疗程卡 ==========
export const ticketApi = {
  list: (params?: any) => request.get('/tickets', { params }),
  detail: (id: string) => request.get(`/tickets/${id}`),
  create: (data: any) => request.post('/tickets', data),
  update: (id: string, data: any) => request.put(`/tickets/${id}`, data),
  delete: (id: string) => request.delete(`/tickets/${id}`),
}

// ========== 价格模板 ==========
export const priceTemplateApi = {
  list: () => request.get('/price-templates'),
  create: (data: any) => request.post('/price-templates', data),
  batch: (data: any) => request.post('/price-templates/batch', data),
}

// ========== 会员卡类型 ==========
export const cardTypeApi = {
  list: (params?: any) => request.get('/card-types', { params }),
  create: (data: any) => request.post('/card-types', data),
  update: (id: string, data: any) => request.put(`/card-types/${id}`, data),
  delete: (id: string) => request.delete(`/card-types/${id}`),
  updateStatus: (id: string, data: any) => request.put(`/card-types/${id}/status`, data),
}

// ========== 会员卡 ==========
export const memberCardApi = {
  list: (params?: any) => request.get('/member-cards', { params }),
  detail: (id: string) => request.get(`/member-cards/${id}`),
  create: (data: any) => request.post('/member-cards', data),
  recharge: (id: string, data: any) => request.post(`/member-cards/${id}/recharge`, data),
  adjust: (id: string, data: any) => request.post(`/member-cards/${id}/adjust`, data),
  freeze: (id: string) => request.post(`/member-cards/${id}/freeze`),
  delay: (id: string, data: any) => request.post(`/member-cards/${id}/delay`, data),
  transfer: (id: string, data: any) => request.post(`/member-cards/${id}/transfer`, data),
  remark: (id: string, data: any) => request.put(`/member-cards/${id}/remark`, data),
  refund: (id: string, data: any) => request.post(`/member-cards/${id}/refund`, data),
  consume: (id: string, data: any) => request.post(`/member-cards/${id}/consume`, data),
  transactions: (id: string, params?: any) => request.get(`/member-cards/${id}/transactions`, { params }),
}

// ========== 订单 ==========
export const orderApi = {
  list: (params?: any) => request.get('/orders', { params }),
  detail: (id: string) => request.get(`/orders/${id}`),
  create: (data: any) => request.post('/orders', data),
  modify: (id: string, data: any) => request.put(`/orders/${id}/modify`, data),
  cancel: (id: string) => request.put(`/orders/${id}/cancel`),
  refund: (id: string, data?: any) => request.put(`/orders/${id}/refund`, data),
  hold: (id: string) => request.put(`/orders/${id}/hold`),
  arrears: (id: string, data: any) => request.post(`/orders/${id}/arrears`, data),
  signature: (id: string, data: any) => request.put(`/orders/${id}/signature`, data),
  verify: (id: string) => request.put(`/orders/${id}/verify`),
  records: (id: string) => request.get(`/orders/${id}/records`),
}

// ========== 预约 ==========
export const appointmentApi = {
  list: (params?: any) => request.get('/appointments', { params }),
  dayCount: (params?: any) => request.get('/appointments/day-count', { params }),
  checkConflict: (data: any) => request.post('/appointments/check-conflict', data),
  detail: (id: string) => request.get(`/appointments/${id}`),
  create: (data: any) => request.post('/appointments', data),
  batch: (data: any) => request.post('/appointments/batch', data),
  update: (id: string, data: any) => request.put(`/appointments/${id}`, data),
  delete: (id: string) => request.delete(`/appointments/${id}`),
  updateStatus: (id: string, data: any) => request.put(`/appointments/${id}/status`, data),
  settings: () => request.get('/appointment-settings'),
  updateSettings: (data: any) => request.put('/appointment-settings', data),
}

// ========== 时间占用 ==========
export const occupyApi = {
  list: (params?: any) => request.get('/occupies', { params }),
  create: (data: any) => request.post('/occupies', data),
  update: (id: string, data: any) => request.put(`/occupies/${id}`, data),
  delete: (id: string) => request.delete(`/occupies/${id}`),
}

// ========== 考勤 ==========
export const attendanceApi = {
  myRule: () => request.get('/attendance/rule/my'),
  createRule: (data: any) => request.post('/attendance/rule', data),
  updateRule: (id: string, data: any) => request.put(`/attendance/rule/${id}`, data),
  clockIn: (data?: any) => request.post('/attendance/clock-in', data),
  clockOut: (data?: any) => request.post('/attendance/clock-out', data),
  records: (params?: any) => request.get('/attendance/records', { params }),
  myRecords: (params?: any) => request.get('/attendance/my-records', { params }),
  statisticList: (params?: any) => request.get('/attendance/statistic/list', { params }),
  statisticStaff: (id: string, params?: any) => request.get(`/attendance/statistic/staff/${id}`, { params }),
  approveList: (params?: any) => request.get('/attendance/approve/list', { params }),
  approveCreate: (data: any) => request.post('/attendance/approve/create', data),
  approveHandle: (id: string, data: any) => request.put(`/attendance/approve/${id}/handle`, data),
}

// ========== 提成 ==========
export const commissionApi = {
  rules: (params?: any) => request.get('/commission/rules', { params }),
  ruleDetail: (id: string) => request.get(`/commission/rules/${id}`),
  createRule: (data: any) => request.post('/commission/rules', data),
  updateRule: (id: string, data: any) => request.put(`/commission/rules/${id}`, data),
  deleteRule: (id: string) => request.delete(`/commission/rules/${id}`),
  calcStaff: (data: any) => request.post('/commission/calc-staff-commission', data),
  records: (params?: any) => request.get('/commission/records', { params }),
  createRecord: (data: any) => request.post('/commission/records', data),
}

// ========== 报表 ==========
export const reportApi = {
  businessOverview: (params?: any) => request.get('/report/business/overview', { params }),
  revenueSummary: (params?: any) => request.get('/report/revenue/summary', { params }),
  revenueDetail: (params?: any) => request.get('/report/revenue/detail', { params }),
  businessCustomer: (params?: any) => request.get('/report/business/customer', { params }),
  staffPerformance: (params?: any) => request.get('/report/staff-performance', { params }),
  cardConsumption: (params?: any) => request.get('/report/card-consumption', { params }),
  businessPreview: (params?: any) => request.get('/report/business-preview/collect', { params }),
  staffDataList: (params?: any) => request.get('/report/staff-data/list', { params }),
  staffDataOrders: (params?: any) => request.get('/report/staff-data/orders', { params }),
}

// ========== 回访 ==========
export const revisitApi = {
  tasks: (params?: any) => request.get('/revisit-tasks', { params }),
  taskStatistic: () => request.get('/revisit-tasks/statistic'),
  taskDetail: (id: string) => request.get(`/revisit-tasks/${id}`),
  createTask: (data: any) => request.post('/revisit-tasks', data),
  updateTask: (id: string, data: any) => request.put(`/revisit-tasks/${id}`, data),
  cancelTask: (id: string) => request.put(`/revisit-tasks/${id}/cancel`),
  records: (params?: any) => request.get('/revisit-records', { params }),
  createRecord: (data: any) => request.post('/revisit-records', data),
  scripts: () => request.get('/revisit-scripts'),
  createScript: (data: any) => request.post('/revisit-scripts', data),
  deleteScript: (id: string) => request.delete(`/revisit-scripts/${id}`),
}

// ========== 服务日志 ==========
export const serviceLogApi = {
  list: (params?: any) => request.get('/service-logs', { params }),
  detail: (id: string) => request.get(`/service-logs/${id}`),
  create: (data: any) => request.post('/service-logs', data),
}

// ========== 目标 ==========
export const targetApi = {
  list: (params?: any) => request.get('/target-plans', { params }),
  create: (data: any) => request.post('/target-plans', data),
  delete: (id: string) => request.delete(`/target-plans/${id}`),
}

// ========== 消息 ==========
export const messageApi = {
  list: (params?: any) => request.get('/messages', { params }),
  overview: () => request.get('/messages/overview'),
  count: () => request.get('/messages/count'),
  cardExpire: () => request.get('/messages/card-expire'),
  customerBirthday: () => request.get('/messages/customer-birthday'),
  customerNotToShop: () => request.get('/messages/customer-not-to-shop'),
  read: (id: string) => request.put(`/messages/${id}/read`),
  readAll: () => request.put('/messages/read-all'),
  delete: (id: string) => request.delete(`/messages/${id}`),
  settings: () => request.get('/message-settings'),
  updateSettings: (data: any) => request.post('/message-settings', data),
}

// ========== 券 ==========
export const couponApi = {
  list: (params?: any) => request.get('/coupons', { params }),
  detail: (id: string) => request.get(`/coupons/${id}`),
  create: (data: any) => request.post('/coupons', data),
  update: (id: string, data: any) => request.put(`/coupons/${id}`, data),
  delete: (id: string) => request.delete(`/coupons/${id}`),
  use: (data: any) => request.post('/coupons/use', data),
}

// ========== 营销活动 ==========
export const marketingApi = {
  activities: (params?: any) => request.get('/marketing/activities', { params }),
  detail: (id: string) => request.get(`/marketing/activities/${id}`),
  create: (data: any) => request.post('/marketing/activities', data),
  update: (id: string, data: any) => request.put(`/marketing/activities/${id}`, data),
  delete: (id: string) => request.delete(`/marketing/activities/${id}`),
  overview: () => request.get('/marketing/overview'),
}

// ========== 测肤 ==========
export const skinTestApi = {
  list: (params?: any) => request.get('/skin-tests', { params }),
  search: (params?: any) => request.get('/skin-tests/search', { params }),
  count: () => request.get('/skin-tests/count'),
  compare: (beforeId: string, afterId: string) => request.get(`/skin-tests/compare/${beforeId}/${afterId}`),
  detail: (id: string) => request.get(`/skin-tests/${id}`),
  create: (data: any) => request.post('/skin-tests', data),
  update: (id: string, data: any) => request.put(`/skin-tests/${id}`, data),
  delete: (id: string) => request.delete(`/skin-tests/${id}`),
}

// ========== 第三方核销 ==========
export const thirdPartyApi = {
  verify: (data: any) => request.post('/third-party/verify', data),
  confirm: (data: any) => request.post('/third-party/confirm', data),
}

// ========== 收支管理 ==========
export const bookkeepingApi = {
  list: (params?: any) => request.get('/bookkeeping', { params }),
  create: (data: any) => request.post('/bookkeeping', data),
  delete: (id: string) => request.delete(`/bookkeeping/${id}`),
}

// ========== 应用设置 ==========
export const appSettingApi = {
  list: (settingType: string) => request.get('/app-settings', { params: { setting_type: settingType } }),
  create: (data: any) => request.post('/app-settings', data),
  update: (id: string, data: any) => request.put(`/app-settings/${id}`, data),
  delete: (id: string) => request.delete(`/app-settings/${id}`),
}
