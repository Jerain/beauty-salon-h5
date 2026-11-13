import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shopApi } from '@/api'

export interface ShopItem {
  id: string
  name: string
  code: string
  brand_id: string | null
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)

  // Brand-level data permission (persisted to localStorage)
  const currentShopId = ref<string | null>(localStorage.getItem('currentShopId') || null)
  const currentShopName = ref<string>(localStorage.getItem('currentShopName') || '全部门店')
  const shopList = ref<ShopItem[]>([])
  const userRole = ref<string>(localStorage.getItem('userRole') || '')
  const brandId = ref<string | null>(localStorage.getItem('brandId') || null)
  const brandName = ref<string>(localStorage.getItem('brandName') || '')

  // Version counter: increments on every shop switch to trigger page data reload
  const shopVersion = ref(0)

  // Computed: whether user can see all shops
  const isBrandLevel = computed(() => {
    return ['super_admin', 'brand_manager'].includes(userRole.value)
  })

  // Computed: whether user is super admin
  const isSuperAdmin = computed(() => {
    return userRole.value === 'super_admin'
  })

  // Computed: store list for dropdown (names only)
  const storeList = computed(() => {
    if (isBrandLevel.value) {
      return ['全部门店', ...shopList.value.map(s => s.name)]
    }
    return shopList.value.map(s => s.name)
  })

  // Legacy compatibility
  const currentStore = computed({
    get: () => currentShopName.value,
    set: (val: string) => { currentShopName.value = val }
  })

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setCurrentShop = (shopId: string | null, shopName: string) => {
    currentShopId.value = shopId
    currentShopName.value = shopName
    if (shopId) {
      localStorage.setItem('currentShopId', shopId)
    } else {
      localStorage.removeItem('currentShopId')
    }
    localStorage.setItem('currentShopName', shopName)
    // Increment version to trigger all pages to reload data
    shopVersion.value++
  }

  const setCurrentStore = (store: string) => {
    currentShopName.value = store
    if (store === '全部门店') {
      setCurrentShop(null, store)
    } else {
      const found = shopList.value.find(s => s.name === store)
      if (found) {
        setCurrentShop(found.id, store)
      }
    }
  }

  const setUserRole = (role: string) => {
    userRole.value = role
    localStorage.setItem('userRole', role)
  }

  const setBrandInfo = (id: string | null, name: string) => {
    brandId.value = id
    brandName.value = name
    if (id) {
      localStorage.setItem('brandId', id)
    } else {
      localStorage.removeItem('brandId')
    }
    localStorage.setItem('brandName', name)
  }

  const loadStores = async () => {
    try {
      const data: any = await shopApi.list({ is_active: true })
      const shops: ShopItem[] = Array.isArray(data)
        ? data.map((s: any) => ({ id: s.id, name: s.name, code: s.code, brand_id: s.brand_id }))
        : []
      shopList.value = shops
    } catch {
      shopList.value = []
    }
  }

  const logout = () => {
    currentShopId.value = null
    currentShopName.value = '全部门店'
    shopList.value = []
    userRole.value = ''
    brandId.value = null
    brandName.value = ''
    localStorage.removeItem('currentShopId')
    localStorage.removeItem('currentShopName')
    localStorage.removeItem('userRole')
    localStorage.removeItem('brandId')
    localStorage.removeItem('brandName')
  }

  return {
    sidebarCollapsed,
    currentShopId,
    currentShopName,
    shopList,
    userRole,
    brandId,
    brandName,
    isBrandLevel,
    isSuperAdmin,
    shopVersion,
    // Legacy
    storeList,
    currentStore,
    toggleSidebar,
    setCurrentShop,
    setCurrentStore,
    setUserRole,
    setBrandInfo,
    loadStores,
    logout,
  }
})
