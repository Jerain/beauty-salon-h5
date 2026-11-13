<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <el-button icon="ArrowLeft" link @click="$router.back()" />
          <span class="card-title">订单详情</span>
        </div>
      </div>
      <el-empty description="订单详情 — 页面开发中" />
    </div>
  </div>
</template>
<script setup lang="ts">
// 订单详情页面逻辑
</script>
