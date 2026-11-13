<template>
  <div class="billing-page">
    <!-- 顶部操作栏 -->
    <div class="billing-header">
      <span class="page-title">开单收银</span>
      <div class="header-actions">
        <el-button @click="resetForm">清空</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认收款</el-button>
      </div>
    </div>

    <div class="billing-body">
      <!-- 左栏：选顾客 + 加项目 -->
      <div class="left-panel">
        <!-- 顾客选择 -->
        <div class="section-card">
          <div class="section-title">
            <span>选择顾客</span>
            <el-tag v-if="selectedCustomer" type="success" closable @close="selectedCustomer = null">
              {{ selectedCustomer.name }}
            </el-tag>
            <el-tag v-else type="info">散客</el-tag>
          </div>
          <el-input v-model="customerSearch" placeholder="搜索姓名/手机号/编号" prefix-icon="Search" clearable @input="onCustomerSearch" @focus="onCustomerFocus" />
          <div v-if="showCustomerList && customerList.length" class="customer-dropdown">
            <div v-for="c in customerList" :key="c.id" class="customer-option" @click="selectCustomer(c)">
              <span class="cname">{{ c.name }}</span>
              <span class="cphone">{{ c.phone }}</span>
              <span class="clevel">{{ levelLabel(c.level) }}</span>
            </div>
            <div v-if="customerList.length === 0" class="no-data">无匹配顾客</div>
          </div>
        </div>

        <!-- 添加项目 -->
        <div class="section-card">
          <div class="section-title">
            <span>添加项目</span>
            <el-radio-group v-model="itemTab" size="small" @change="loadItems">
              <el-radio-button value="project">服务项目</el-radio-button>
              <el-radio-button value="product">产品</el-radio-button>
            </el-radio-group>
          </div>
          <el-input v-model="itemSearch" placeholder="搜索项目名称" prefix-icon="Search" clearable @input="onItemSearch" />
          <div class="item-list">
            <div v-for="item in itemList" :key="item.id" class="item-row" @click="addItem(item)">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-price">¥{{ item.price?.toFixed(2) }}</span>
              </div>
              <el-button size="small" type="primary" circle icon="Plus" />
            </div>
            <el-empty v-if="!itemList.length" description="暂无项目" :image-size="60" />
          </div>
        </div>
      </div>

      <!-- 右栏：购物车 + 收款 -->
      <div class="right-panel">
        <!-- 已选项目列表 -->
        <div class="section-card cart-section">
          <div class="section-title">
            <span>已选项目 ({{ cart.length }})</span>
            <span class="total-hint">合计: ¥{{ cartTotal.toFixed(2) }}</span>
          </div>
          <div class="cart-list" v-if="cart.length">
            <div v-for="(ci, idx) in cart" :key="idx" class="cart-item">
              <div class="cart-item-top">
                <span class="cart-item-name">{{ ci.item_name }}</span>
                <el-button link type="danger" icon="Delete" @click="removeItem(idx)" />
              </div>
              <div class="cart-item-controls">
                <div class="control-group">
                  <label>数量</label>
                  <el-input-number v-model="ci.quantity" :min="1" :max="99" size="small" controls-position="right" @change="recalcItem(ci)" />
                </div>
                <div class="control-group">
                  <label>折扣%</label>
                  <el-input-number v-model="ci.discount" :min="10" :max="100" :step="5" size="small" controls-position="right" @change="recalcItem(ci)" />
                </div>
                <div class="control-group">
                  <label>金额</label>
                  <span class="item-amount">¥{{ ci.amount.toFixed(2) }}</span>
                </div>
                <div class="control-group staff-select">
                  <label>服务员工</label>
                  <el-select v-model="ci.staff_id" placeholder="选择" size="small" clearable filterable>
                    <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.id" />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="点击左侧项目添加" :image-size="80" />
        </div>

        <!-- 金额汇总 -->
        <div class="section-card summary-section">
          <div class="summary-row">
            <span>项目合计</span>
            <span>¥{{ cartTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>优惠金额</span>
            <el-input-number v-model="discountAmount" :min="0" :max="cartTotal" :precision="2" size="small" controls-position="right" style="width: 140px;" />
          </div>
          <div class="summary-row total-row">
            <span>应付金额</span>
            <span class="payable">¥{{ payable.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 收款方式 -->
        <div class="section-card payment-section">
          <div class="section-title">
            <span>收款方式</span>
            <el-button link type="primary" @click="addPayment">+ 添加收款</el-button>
          </div>
          <div v-for="(p, idx) in payments" :key="idx" class="payment-row">
            <el-select v-model="p.method" size="small" style="width: 120px;" @change="onPaymentMethodChange(p)">
              <el-option v-for="m in paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
            </el-select>
            <el-input-number v-model="p.amount" :min="0" :precision="2" size="small" controls-position="right" style="width: 150px;" :placeholder="'¥0.00'" />
            <!-- 会员卡选择 -->
            <el-select v-if="p.method === 'card'" v-model="p.card_id" size="small" placeholder="选择会员卡" style="width: 160px;" filterable>
              <el-option v-for="card in memberCards" :key="card.id" :label="`${card.card_type_name || '卡'} (¥${card.balance?.toFixed(2) || 0})`" :value="card.id" />
            </el-select>
            <el-button link type="danger" icon="Delete" @click="removePayment(idx)" />
          </div>
          <div class="payment-summary">
            <span>已收: <b :class="{ 'over-pay': paidTotal > payable }">¥{{ paidTotal.toFixed(2) }}</b></span>
            <span v-if="paidTotal < payable" style="color: #E6A23C;">差额: ¥{{ (payable - paidTotal).toFixed(2) }}</span>
            <span v-else-if="paidTotal > payable" style="color: #F56C6C;">多收: ¥{{ (paidTotal - payable).toFixed(2) }}</span>
            <span v-else style="color: #67C23A;">已结清</span>
          </div>
        </div>

        <!-- 备注 -->
        <div class="section-card">
          <el-input v-model="remark" type="textarea" :rows="2" placeholder="订单备注（选填）" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { customerApi, projectApi, productApi, staffApi, orderApi, memberCardApi } from '@/api'

const router = useRouter()
const route = useRoute()

// ===== 顾客 =====
const customerSearch = ref('')
const showCustomerList = ref(false)
const customerList = ref<any[]>([])
const selectedCustomer = ref<any>(null)
let customerTimer: any = null

const onCustomerFocus = async () => {
  showCustomerList.value = true
  if (customerList.value.length === 0 && !customerSearch.value.trim()) {
    // Load initial 10 customers sorted by pinyin
    try {
      const res: any = await customerApi.list({ page: 1, page_size: 10, sort_by: 'name' })
      customerList.value = res.items || []
    } catch { customerList.value = [] }
  }
}

const onCustomerSearch = () => {
  clearTimeout(customerTimer)
  customerTimer = setTimeout(async () => {
    if (!customerSearch.value.trim()) {
      // Reload default 10 customers
      try {
        const res: any = await customerApi.list({ page: 1, page_size: 10, sort_by: 'name' })
        customerList.value = res.items || []
      } catch { customerList.value = [] }
      showCustomerList.value = true
      return
    }
    try {
      const res: any = await customerApi.list({ search: customerSearch.value, page: 1, page_size: 10, sort_by: 'name' })
      customerList.value = res.items || []
      showCustomerList.value = true
    } catch { customerList.value = [] }
  }, 300)
}

const selectCustomer = (c: any) => {
  selectedCustomer.value = c
  customerSearch.value = c.name
  showCustomerList.value = false
  loadMemberCards(c.id)
}

const levelLabel = (v: string) => {
  const map: Record<string, string> = { normal: '普通', silver: '白银', gold: '黄金', platinum: '铂金', diamond: '钻石' }
  return map[v] || v
}

// ===== 项目搜索 =====
const itemTab = ref('project')
const itemSearch = ref('')
const itemList = ref<any[]>([])
let itemTimer: any = null

const loadItems = async () => {
  try {
    const api = itemTab.value === 'project' ? projectApi : productApi
    const res: any = await api.list({ page: 1, page_size: 50 })
    itemList.value = (res.items || []).filter((i: any) => i.status === 'active' || i.status === 'on_sale' || !i.status)
  } catch { itemList.value = [] }
}

const onItemSearch = () => {
  clearTimeout(itemTimer)
  itemTimer = setTimeout(async () => {
    if (!itemSearch.value.trim()) { loadItems(); return }
    try {
      const api = itemTab.value === 'project' ? projectApi : productApi
      const res: any = await api.list({ search: itemSearch.value, page: 1, page_size: 20 })
      itemList.value = (res.items || []).filter((i: any) => i.status === 'active' || i.status === 'on_sale' || !i.status)
    } catch {}
  }, 300)
}

// ===== 购物车 =====
interface CartItem {
  item_type: string
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  staff_id: string | null
}

const cart = ref<CartItem[]>([])

const addItem = (item: any) => {
  const existing = cart.value.find(c => c.item_id === item.id)
  if (existing) {
    existing.quantity++
    recalcItem(existing)
    return
  }
  cart.value.push({
    item_type: itemTab.value === 'project' ? 'service' : 'product',
    item_id: item.id,
    item_name: item.name,
    quantity: 1,
    unit_price: item.price || 0,
    discount: 100,
    amount: item.price || 0,
    staff_id: null,
  })
}

const removeItem = (idx: number) => { cart.value.splice(idx, 1) }

const recalcItem = (ci: CartItem) => {
  ci.amount = ci.unit_price * ci.quantity * (ci.discount / 100)
}

const cartTotal = computed(() => cart.value.reduce((sum, c) => sum + c.amount, 0))
const discountAmount = ref(0)
const payable = computed(() => Math.max(0, cartTotal.value - discountAmount.value))

// ===== 员工 =====
const staffList = ref<any[]>([])

// ===== 收款 =====
interface PaymentItem {
  method: string
  amount: number
  card_id: string | null
}

const payments = ref<PaymentItem[]>([{ method: 'wechat', amount: 0, card_id: null }])
const paymentMethods = [
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '现金', value: 'cash' },
  { label: '银行卡', value: 'bank' },
  { label: '会员卡余额', value: 'card' },
]
const memberCards = ref<any[]>([])

const paidTotal = computed(() => payments.value.reduce((sum, p) => sum + (p.amount || 0), 0))

const addPayment = () => {
  payments.value.push({ method: 'wechat', amount: 0, card_id: null })
}
const removePayment = (idx: number) => {
  if (payments.value.length <= 1) { ElMessage.warning('至少保留一种收款方式'); return }
  payments.value.splice(idx, 1)
}
const onPaymentMethodChange = (p: PaymentItem) => { p.card_id = null }

const loadMemberCards = async (customerId: string) => {
  try {
    const res: any = await memberCardApi.list({ customer_id: customerId, page: 1, page_size: 50 })
    memberCards.value = (res.items || []).filter((c: any) => c.status === 'active')
  } catch { memberCards.value = [] }
}

// ===== 备注 =====
const remark = ref('')

// ===== 提交 =====
const submitting = ref(false)

const handleSubmit = async () => {
  if (!cart.value.length) { ElMessage.warning('请先添加项目'); return }
  if (paidTotal.value <= 0) { ElMessage.warning('请填写收款金额'); return }
  if (Math.abs(paidTotal.value - payable.value) > 0.01) {
    try {
      await ElMessageBox.confirm(`收款金额 ¥${paidTotal.value.toFixed(2)} 与应付 ¥${payable.value.toFixed(2)} 不一致，确认继续？`, '金额不一致', { type: 'warning' })
    } catch { return }
  }

  submitting.value = true
  try {
    const orderData = {
      customer_id: selectedCustomer.value?.id || null,
      order_type: cart.value.some(c => c.item_type === 'product') ? 'mixed' : 'service',
      remark: remark.value || null,
      items: cart.value.map(c => ({
        item_type: c.item_type,
        item_id: c.item_id,
        item_name: c.item_name,
        quantity: c.quantity,
        unit_price: c.unit_price,
        discount: c.discount,
        amount: c.amount,
        staff_id: c.staff_id,
      })),
      payments: payments.value.filter(p => p.amount > 0).map(p => ({
        payment_method_name: paymentMethods.find(m => m.value === p.method)?.label || p.method,
        amount: p.amount,
        card_id: p.card_id,
      })),
    }

    const res: any = await orderApi.create(orderData)
    ElMessage.success(`开单成功！订单号: ${res.order_no}`)
    resetForm()
    router.push('/operate/order')
  } catch (e: any) {
    console.error('开单失败', e)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  selectedCustomer.value = null
  customerSearch.value = ''
  cart.value = []
  discountAmount.value = 0
  payments.value = [{ method: 'wechat', amount: 0, card_id: null }]
  remark.value = ''
  memberCards.value = []
}

// ===== 初始化 =====
onMounted(async () => {
  loadItems()
  // 加载员工列表
  try {
    const res: any = await staffApi.list({ page: 1, page_size: 100 })
    staffList.value = (res.items || []).filter((s: any) => s.status === 'active' || !s.status)
  } catch {}
  // 如果从URL带了顾客信息
  if (route.query.customerId) {
    try {
      const c: any = await customerApi.detail(route.query.customerId as string)
      selectCustomer(c)
    } catch {}
  }
})

// 点击空白处关闭顾客列表
document.addEventListener('click', (e: any) => {
  if (!e.target.closest('.section-card')) showCustomerList.value = false
})
</script>

<style lang="scss" scoped>
.billing-page {
  display: flex; flex-direction: column; height: calc(100vh - 90px);
}
.billing-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #EBEEF5;
  .page-title { font-size: 18px; font-weight: 700; color: #303133; }
}
.billing-body {
  display: flex; gap: 16px; flex: 1; padding: 16px; overflow: hidden;
}
.left-panel {
  width: 380px; min-width: 380px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
}
.right-panel {
  flex: 1; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;
}
.section-card {
  background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  .section-title {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 12px; font-weight: 600; color: #303133; font-size: 14px;
    .total-hint { color: #E6A23C; font-weight: 700; font-size: 16px; }
  }
}

/* 顾客选择 */
.customer-dropdown {
  margin-top: 4px; border: 1px solid #EBEEF5; border-radius: 6px; max-height: 200px; overflow-y: auto;
  .customer-option {
    display: flex; align-items: center; gap: 12px; padding: 8px 12px; cursor: pointer;
    &:hover { background: #F5F7FA; }
    .cname { font-weight: 600; color: #303133; }
    .cphone { color: #909399; font-size: 13px; }
    .clevel { margin-left: auto; font-size: 12px; }
  }
}

/* 项目列表 */
.item-list {
  margin-top: 8px; max-height: 320px; overflow-y: auto;
  .item-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 8px; border-bottom: 1px solid #F5F7FA; cursor: pointer;
    &:hover { background: #F0F9FF; }
    .item-info {
      display: flex; flex-direction: column;
      .item-name { font-weight: 500; color: #303133; }
      .item-price { color: #E6A23C; font-size: 13px; margin-top: 2px; }
    }
  }
}

/* 购物车 */
.cart-section { flex: 1; min-height: 200px; }
.cart-list {
  max-height: 340px; overflow-y: auto;
  .cart-item {
    padding: 10px 0; border-bottom: 1px solid #F5F7FA;
    .cart-item-top {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
      .cart-item-name { font-weight: 600; color: #303133; }
    }
    .cart-item-controls {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
      .control-group {
        display: flex; align-items: center; gap: 4px;
        label { font-size: 12px; color: #909399; white-space: nowrap; }
        .item-amount { font-weight: 700; color: #E6A23C; font-size: 14px; }
      }
      .staff-select { flex: 1; min-width: 140px; }
    }
  }
}

/* 金额汇总 */
.summary-section {
  .summary-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; font-size: 14px; color: #606266;
    &.total-row {
      border-top: 2px solid #EBEEF5; margin-top: 4px; padding-top: 12px;
      .payable { font-size: 24px; font-weight: 800; color: #E6A23C; }
    }
  }
}

/* 收款 */
.payment-section {
  .payment-row {
    display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
  }
  .payment-summary {
    display: flex; justify-content: space-between; padding: 10px 0 0;
    border-top: 1px dashed #EBEEF5; font-size: 14px;
    .over-pay { color: #F56C6C; }
  }
}
</style>
