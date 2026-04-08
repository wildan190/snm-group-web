import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setAuthToken } from '@/utils/api'

type AuthUser = { username: string; role: string }

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('snm-token') || '')
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function loadMe(): Promise<void> {
    if (!token.value) return
    setAuthToken(token.value)
    try {
      const res = await api.get('/auth/me')
      user.value = res.data
    } catch (err) {
      logout()
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    try {
      const res = await api.post('/auth/login', { username, password })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('snm-token', token.value)
      setAuthToken(token.value)
      return true
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    token.value = ''
    user.value = null
    localStorage.removeItem('snm-token')
    setAuthToken(null)
  }

  loadMe()

  return { token, user, loading, isAuthenticated, login, logout, loadMe }
})
