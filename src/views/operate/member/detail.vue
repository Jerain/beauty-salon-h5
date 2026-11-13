<template>
  <div class="page-container">
    <div class="card" v-loading="loading">
      <div class="card-header">
        <div class="back-title">
          <el-button icon="ArrowLeft" link @click="$router.back()" />
          <span class="card-title">{{ customer?.name || '顾客详情' }}</span>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="$router.push({ path: '/operate/billing', query: { customerId: customer?.id, customerName: customer?.name } })">开单</el-button>
          <el-button>开卡</el-button>
          <el-button>预约</el-button>
        </div>
      </div>

      <!-- 顾客基本信息 -->
      <div class="info-bar" v-if="customer">
        <el-avatar :size="56" style="background: #409EFF;">{{ customer.name?.[0] || '?' }}</el-avatar>
        <div class="info-main">
          <div class="info-row">
            <span class="name">{{ customer.name }}</span>
            <el-tag size="small" :type="levelType(customer.level)">{{ levelLabel(customer.level) }}</el-tag>
            <el-tag v-for="tag in customer.tags" :key="tag.id" size="small" :color="tag.color" effect="dark" style="margin-left: 4px;">{{ tag.name }}</el-tag>
          </div>
          <div class="info-sub">
            {{ customer.phone }} · {{ customer.code }} · {{ customer.gender === 'female' ? '女' : '男' }}
            <span v-if="customer.source_name"> · 来源: {{ customer.source_name }}</span>
          </div>
        </div>
        <div class="info-stats">
          <div class="stat-item"><span class="stat-val">¥{{ (customer.total_consumption || 0).toFixed(2) }}</span><span class="stat-lbl">累计消费</span></div>
          <div class="stat-item"><span class="stat-val">¥{{ (customer.balance || 0).toFixed(2) }}</span><span class="stat-lbl">余额</span></div>
          <div class="stat-item"><span class="stat-val">{{ customer.points || 0 }}</span><span class="stat-lbl">积分</span></div>
        </div>
      </div>

      <!-- Tab区 -->
      <el-tabs v-model="activeTab" style="margin-top: 20px;">
        <el-tab-pane label="会员卡" name="cards">
          <el-empty v-if="!cards.length" description="暂无会员卡" />
          <el-table v-else :data="cards" stripe size="small">
            <el-table-column prop="card_type_name" label="卡类型" width="120" />
            <el-table-column prop="card_no" label="卡号" width="160" />
            <el-table-column label="余额/次数" width="120">
              <template #default="{ row }">{{ row.balance != null ? '¥' + row.balance.toFixed(2) : (row.remain_times != null ? row.remain_times + '次' : '—') }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '正常' : row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expire_date" label="到期日" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="消费记录" name="orders">
          <el-empty v-if="!orders.length" description="暂无消费记录" />
          <el-table v-else :data="orders" stripe size="small">
            <el-table-column prop="order_no" label="订单号" width="180" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column prop="total_amount" label="金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.total_amount?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">{{ row.status === 'completed' ? '已完成' : row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="会员资料" name="profile">
          <el-descriptions :column="2" border v-if="customer">
            <el-descriptions-item label="姓名">{{ customer.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ customer.phone }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ customer.gender === 'female' ? '女' : '男' }}</el-descriptions-item>
            <el-descriptions-item label="生日">{{ customer.birthday || '—' }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ customer.source_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="专属员工">{{ customer.staff_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">{{ levelLabel(customer.level) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(customer.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ customer.remark || '—' }}</el-descriptions-item>
            <el-descriptions-item label="禁忌事项" :span="2">{{ customer.taboo || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="服务日志" name="logs">
          <el-empty description="服务日志 — 开发中" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { customerApi, memberCardApi, orderApi } from '@/api'

const route = useRoute()
const loading = ref(false)
const activeTab = ref('cards')
const customer = ref<any>(null)
const cards = ref<any[]>([])
const orders = ref<any[]>([])

const levelLabel = (v: string) => ({ normal: '普通', silver: '银卡', gold: '金卡', diamond: '钻石' }[v] || v)
const levelType = (v: string): any => ({ normal: 'info', silver: '', gold: 'warning', diamond: 'danger' }[v] || 'info')

const formatDate = (d: string) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

const loadCustomer = async () => {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    customer.value = await customerApi.detail(id) as any
  } catch (e: any) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadCards = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res: any = await memberCardApi.list({ customer_id: id })
    cards.value = res.items || res || []
  } catch { /* ignore */ }
}

const loadOrders = async () => {
  const id = route.params.id as string
  if (!id) return
  try {
    const res: any = await orderApi.list({ customer_id: id, page_size: 20 })
    orders.value = res.items || res || []
  } catch { /* ignore */ }
}

onMounted(() => {
  loadCustomer()
  loadCards()
  loadOrders()
})
</script>

<style lang="scss" scoped>
.back-title { display: flex; align-items: center; gap: 8px; }
.header-actions { display: flex; gap: 8px; }

.info-bar {
  display: flex; align-items: flex-start; gap: 20px; padding: 20px;
  background: #F5F7FA; border-radius: 8px;
}
.info-main {
  flex: 1;
  .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .name { font-size: 18px; font-weight: 700; color: #303133; }
  .info-sub { font-size: 13px; color: #909399; }
}
.info-stats {
  display: flex; gap: 32px;
  .stat-item { text-align: center; }
  .stat-val { display: block; font-size: 18px; font-weight: 700; color: #303133; }
  .stat-lbl { font-size: 12px; color: #909399; }
}
</style>
