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
}

export const useSiteStore = defineStore('site', () => {
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
  }

  const site = ref<SiteConfig>({ ...defaultSite })

  async function loadSite() {
    try {
      const res = await api.get('/site')
      if (res.data && typeof res.data === 'object' && Object.keys(res.data).length > 0) {
        site.value = {
          ...defaultSite,
          ...res.data,
          // Ensure arrays are always arrays
          socials: Array.isArray(res.data.socials) ? res.data.socials : site.value.socials,
          navbar: Array.isArray(res.data.navbar) ? res.data.navbar : site.value.navbar,
          footer: Array.isArray(res.data.footer) ? res.data.footer : site.value.footer,
        }
      }
    } catch (err) {
      console.warn('Unable to load site config', err)
    }
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

  return { site, loadSite, saveSite }
})
