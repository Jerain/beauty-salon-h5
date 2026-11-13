<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header">
        <span class="card-title">微信管理</span>
        <div class="header-actions">
          <el-button type="primary">小程序装修</el-button>
          <el-button>重新授权小程序</el-button>
        </div>
      </div>
      <el-tabs model-value="miniapp">
        <el-tab-pane label="小程序管理" name="miniapp" />
        <el-tab-pane label="商城管理" name="shop" />
        <el-tab-pane label="门店管理" name="store" />
      </el-tabs>
      <el-empty description="小程序管理 — 页面开发中" />
    </div>
  </div>
</template>
<script setup lang="ts">
// 微信管理页面逻辑
</script>
<style lang="scss" scoped>
.header-actions { display: flex; gap: 8px; }
</style>
