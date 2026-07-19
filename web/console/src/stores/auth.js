import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('soar_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('soar_user') || '{}'))
  const permissions = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role_name === 'super_admin')

  async function login(account, passwd) {
    const data = await request.post('/login', { account, passwd })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('soar_token', data.token)
    localStorage.setItem('soar_user', JSON.stringify(data.user))
    // 获取权限
    await fetchPermissions()
    return data
  }

  function logout() {
    token.value = ''
    user.value = {}
    permissions.value = []
    localStorage.removeItem('soar_token')
    localStorage.removeItem('soar_user')
  }

  async function fetchPermissions() {
    try {
      const data = await request.get('/me/permissions')
      permissions.value = data.permissions || []
    } catch {
      permissions.value = []
    }
  }

  function hasPermission(code) {
    return isAdmin.value || permissions.value.includes(code)
  }

  return { token, user, permissions, isLoggedIn, isAdmin, login, logout, fetchPermissions, hasPermission }
})