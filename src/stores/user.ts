import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserInfo {
  id: number
  name: string
  phone: string
  role: string
  avatar: string
  storeName: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const setToken = (val: string) => {
    token.value = val
    localStorage.setItem('token', val)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, setToken, setUserInfo, logout }
})
