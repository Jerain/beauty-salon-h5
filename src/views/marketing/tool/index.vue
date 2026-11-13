<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header"><span class="card-title">营销工具</span></div>
      <div class="tool-grid">
        <div v-for="t in tools" :key="t.name" class="tool-card">
          <div class="tool-icon">{{ t.icon }}</div>
          <div class="tool-info">
            <div class="tool-name">{{ t.name }}</div>
            <div class="tool-desc">{{ t.desc }}</div>
          </div>
          <div class="tool-actions">
            <el-button link type="primary">查看示例</el-button>
            <el-button type="primary" size="small">立即使用</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const tools = [
  { icon: '👥', name: '在线拼团', desc: '1-5人团，支持虚拟团、私密团' },
  { icon: '⚡', name: '限时秒杀', desc: '限时限量抢购，拓客/回馈老客' },
  { icon: '🎰', name: '抽奖/大转盘', desc: '老客激活、新客裂变' },
  { icon: '🎁', name: '大牌盲盒抽奖', desc: '100%中奖，付费抽取' },
  { icon: '🔗', name: '组合活动', desc: '多活动组合推广' },
  { icon: '🏃', name: '组队接龙', desc: '多人组队享福利，购买后抽奖' },
  { icon: '💰', name: '消费股东', desc: '二级分销，消费型股东' },
  { icon: '🎟️', name: '智能送券宝', desc: 'N选X领券，周期性发券' },
]
</script>
<style lang="scss" scoped>
.tool-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.tool-card {
  display: flex; align-items: center; gap: 16px; padding: 20px;
  border: 1px solid #EBEEF5; border-radius: 12px;
  transition: all 0.2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: #409EFF; }
}
.tool-icon { font-size: 36px; flex-shrink: 0; }
.tool-info { flex: 1; }
.tool-name { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.tool-desc { font-size: 13px; color: #909399; }
.tool-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
</style>
