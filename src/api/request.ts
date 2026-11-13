import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Inject X-Shop-Id header for data permission filtering
    const currentShopId = localStorage.getItem('currentShopId')
    if (currentShopId && currentShopId !== 'null' && currentShopId !== '') {
      config.headers['X-Shop-Id'] = currentShopId
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 — FastAPI直接返回数据，不包装在{code,data}中
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
    const detail = error.response?.data?.detail
    const msg = Array.isArray(detail) ? detail[0]?.msg : (detail || error.message || '网络错误')
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
