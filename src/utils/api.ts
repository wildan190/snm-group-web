import axios, { type InternalAxiosRequestConfig } from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const fallbackBaseUrl = import.meta.env.VITE_API_FALLBACK_URL || ''

const api = axios.create({
  baseURL: configuredBaseUrl,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as (InternalAxiosRequestConfig & { __usedFallback?: boolean }) | undefined
    if (!config) throw error

    const canFallback =
      import.meta.env.DEV &&
      fallbackBaseUrl &&
      configuredBaseUrl === '/api' &&
      !config.__usedFallback &&
      (error?.code === 'ECONNREFUSED' || error?.response?.status >= 500 || error?.message === 'Network Error')

    if (!canFallback) throw error

    config.__usedFallback = true
    config.baseURL = fallbackBaseUrl
    return api.request(config)
  },
)

export function setAuthToken(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

export default api
