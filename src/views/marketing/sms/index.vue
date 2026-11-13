<template>
  <div class="page-container">
    <div class="card">
      <div class="card-header"><span class="card-title">短信管理</span></div>
      <el-tabs model-value="setting">
        <el-tab-pane label="短信设置" name="setting" />
        <el-tab-pane label="短信发送记录" name="history" />
        <el-tab-pane label="短信余额充值" name="recharge" />
      </el-tabs>
      <el-empty description="短信模板配置 — 页面开发中" />
    </div>
  </div>
</template>
<script setup lang="ts">
// 短信管理页面逻辑
</script>
