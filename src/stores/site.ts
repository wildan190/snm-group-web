import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import api from '@/utils/api'

type SiteLink = { label: string; link: string }

type SocialLink = { name: string; url: string }

type SiteConfig = {
  companyName: string
  logoAssetId: string
  address: string
  email: string
  phone: string
  themePrimary: string
  themePrimaryHover: string
  themeDark: string
  themeBackground: string
  socials: SocialLink[]
  navbar: SiteLink[]
  footer: SiteLink[]
  description: string
  logoUrl?: string
}

export const useSiteStore = defineStore('site', () => {
  const isLoading = ref(true)

  const defaultSite: SiteConfig = {
    companyName: 'SNM Group',
    logoAssetId: '',
    address: '',
    email: '',
    phone: '',
    themePrimary: '#7E57FF',
    themePrimaryHover: '#6a3fff',
    themeDark: '#081828',
    themeBackground: '#ffffff',
    socials: [],
    navbar: [],
    footer: [],
    description: '',
    logoUrl: '',
  }

  // Load from localStorage immediately for instant feel
  const cachedSite = localStorage.getItem('site_config')
  const initialSite = cachedSite ? JSON.parse(cachedSite) : { ...defaultSite }
  const site = ref<SiteConfig>(initialSite)

  // Apply theme vars immediately if we have cached data
  if (cachedSite) {
    applyThemeVars(initialSite)
  }

  const MAX_RETRIES = 8
  const BASE_DELAY_MS = 800

  function isNetworkError(err: any): boolean {
    return !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED'
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function loadSite() {
    isLoading.value = true
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await api.get('/site')
        if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
          site.value = {
            ...defaultSite,
            ...res.data,
            socials: Array.isArray(res.data.socials) ? res.data.socials : site.value.socials,
            navbar: Array.isArray(res.data.navbar) ? res.data.navbar : site.value.navbar,
            footer: Array.isArray(res.data.footer) ? res.data.footer : site.value.footer,
          }
          localStorage.setItem('site_config', JSON.stringify(site.value))
        }
        break // success
      } catch (err: any) {
        if (isNetworkError(err) && attempt < MAX_RETRIES - 1) {
          const delay = Math.min(BASE_DELAY_MS * Math.pow(1.5, attempt), 4000)
          await sleep(delay)
          continue
        }
        console.warn('Unable to load site config', err)
        break
      }
    }
    isLoading.value = false
  }

  async function saveSite(payload: SiteConfig) {
    try {
      await api.post('/site', payload)
      // Instead of refreshing immediately, we update local state first
      // to keep any unsaved changes that might have arrived during the request.
      // But usually, site.value is already what we want since it was two-way bound.
      await loadSite()
    } catch (err) {
      console.error('Failed to save site config', err)
      throw err
    }
  }

  function toValidHex(color: string, fallback: string) {
    const value = String(color || '').trim()
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
  }

  function applyThemeVars(config: SiteConfig) {
    const root = document.documentElement
    root.style.setProperty('--primary', toValidHex(config.themePrimary, '#7E57FF'))
    root.style.setProperty('--primary-hover', toValidHex(config.themePrimaryHover, '#6a3fff'))
    root.style.setProperty('--dark', toValidHex(config.themeDark, '#081828'))
    root.style.setProperty('--bg-app', toValidHex(config.themeBackground, '#ffffff'))
  }

  watch(
    site,
    (value) => {
      applyThemeVars(value)
    },
    { deep: true },
  )

  return { site, isLoading, loadSite, saveSite }
})
