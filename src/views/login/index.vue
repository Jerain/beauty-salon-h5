<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.svg" alt="Logo" class="login-logo" />
        <h1>美容院管理系统</h1>
        <p>商家后台管理平台</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @submit.prevent="handleLogin">
        <el-form-item prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            size="large"
            prefix-icon="Phone"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  phone: '13800000000',
  password: '123456',
})

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res: any = await authApi.login({ phone: form.phone, password: form.password })
    userStore.setToken(res.access_token)

    // Set role and brand info from login response
    appStore.setUserRole(res.role || 'staff')
    appStore.setBrandInfo(res.brand_id || null, res.brand_name || '')

    // 获取用户信息
    try {
      const me: any = await authApi.getUserInfo()
      userStore.setUserInfo({
        id: me.id || 0,
        name: me.name || me.phone || '管理员',
        phone: me.phone || form.phone,
        role: me.role || '主理人',
        avatar: '',
        storeName: me.shop_name || '旗舰店',
      })
      // Update from /me response (more accurate)
      appStore.setUserRole(me.role || 'staff')
      appStore.setBrandInfo(me.brand_id || null, me.brand_name || '')
    } catch {
      userStore.setUserInfo({
        id: 1, name: '管理员', phone: form.phone,
        role: '主理人', avatar: '', storeName: '旗舰店',
      })
    }

    // Load store list and set current shop
    await appStore.loadStores()
    if (!appStore.isBrandLevel) {
      // Non-brand-level: auto-select own shop
      const ownShop = appStore.shopList[0]
      if (ownShop) {
        appStore.setCurrentShop(ownShop.id, ownShop.name)
      }
    }

    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/home'
    router.push(redirect)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.detail || e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;

  .login-logo {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: $text-secondary;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}
</style>
