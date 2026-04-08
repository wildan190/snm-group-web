import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

type SiteLink = { label: string; link: string }

type SocialLink = { name: string; url: string }

type SiteConfig = {
  companyName: string
  logoAssetId: string
  address: string
  email: string
  phone: string
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

  return { site, loadSite, saveSite }
})
