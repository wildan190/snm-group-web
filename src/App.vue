<template>
  <div id="app">
    <header v-if="!isCms" class="site-header" :class="{ sticky: isScrolled }">
      <div class="header-container">
        <router-link to="/" class="brand">
          <img v-if="logoUrl" :src="logoUrl" :alt="site.companyName" class="site-logo" />
          <span class="site-title">{{ site.companyName || 'SNM Group' }}</span>
        </router-link>

        <button class="mobile-nav-toggle" type="button" @click="isMobileNavOpen = true">
          <Icon icon="lucide:menu" width="20" />
        </button>

        <nav class="site-nav">
          <router-link
            v-for="item in filteredNavbar"
            :key="item.link"
            :to="item.link"
            class="nav-link"
          >
            {{ item.label }}
          </router-link>
        </nav>
      </div>

      <div
        v-if="isMobileNavOpen"
        class="mobile-nav-overlay"
        @click="isMobileNavOpen = false"
      ></div>

      <aside class="mobile-nav-drawer" :class="{ open: isMobileNavOpen }">
        <div class="mobile-nav-header">
          <span class="mobile-nav-title">Menu</span>
          <button class="mobile-nav-close" type="button" @click="isMobileNavOpen = false">
            <Icon icon="lucide:x" width="18" />
          </button>
        </div>
        <nav class="mobile-nav-list">
          <router-link
            v-for="item in filteredNavbar"
            :key="`m-${item.link}`"
            :to="item.link"
            class="mobile-nav-link"
            @click="isMobileNavOpen = false"
          >
            {{ item.label }}
          </router-link>
        </nav>
      </aside>
    </header>

    <main class="page-shell">
      <router-view />
    </main>

    <!-- Global Floating WhatsApp Button (public pages) -->
    <div v-if="!isCms && whatsappFloat" class="wa-float-wrapper">
      <a
        class="wa-float-btn"
        :href="getWhatsappHref(whatsappFloat.phoneNumber, whatsappFloat.message)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon icon="mdi:whatsapp" width="22" height="22" />
        <span v-if="whatsappFloat.label" class="wa-float-label">{{ whatsappFloat.label }}</span>
      </a>
    </div>

    <footer v-if="!isCms" class="site-footer">
      <div class="footer-top">
        <div class="footer-container">
          <div class="footer-grid">
            <!-- Brand col -->
            <div class="footer-col footer-brand-col">
              <div class="footer-logo-wrap">
                <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="footer-logo" />
                <span v-else class="footer-brand-name">{{ site.companyName || 'SNM Group' }}</span>
              </div>
              <p class="footer-desc">{{ site.description }}</p>
            </div>
            <!-- Links col -->
            <div class="footer-col">
              <h4 class="footer-col-title">Halaman</h4>
              <ul class="footer-links">
                <li v-for="item in site.footer" :key="item.link">
                  <a :href="item.link">{{ item.label }}</a>
                </li>
              </ul>
            </div>
            <!-- Contact col -->
            <div class="footer-col">
              <h4 class="footer-col-title">Kontak</h4>
              <ul class="footer-links">
                <li v-if="site.phone"><a :href="'tel:' + site.phone">{{ site.phone }}</a></li>
                <li v-if="site.email"><a :href="'mailto:' + site.email">{{ site.email }}</a></li>
                <li v-if="site.address"><span>{{ site.address }}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-container">
          <p>© {{ new Date().getFullYear() }} {{ site.companyName || 'SNM Group' }} &mdash; All Rights Reserved</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useSiteStore } from "@/stores/site";
import { storeToRefs } from "pinia";
import api from "@/utils/api";
import { Icon } from "@iconify/vue";

const route = useRoute();
const siteStore = useSiteStore();
const { site } = storeToRefs(siteStore);
const assets = ref<any[]>([]);
const isScrolled = ref(false);
const isMobileNavOpen = ref(false);
const whatsappFloat = ref<null | { phoneNumber: string; message?: string; label?: string }>(null);

const isCms = computed(() => route.path.startsWith("/cms"));

const filteredNavbar = computed(() => {
  return (site.value.navbar || []).filter(
    (item: any) =>
      item.link !== "/products" &&
      item.link !== "/cms/dashboard" &&
      item.link !== "/cms" &&
      !item.label?.toLowerCase().includes("product") &&
      !item.label?.toLowerCase().includes("cms"),
  );
});

const logoUrl = computed(() => {
  if (!site.value.logoAssetId) return "";
  const asset = assets.value.find((a) => a._id === site.value.logoAssetId);
  return asset ? asset.url : "";
});

async function loadAssets() {
  try {
    const res = await api.get("/assets");
    assets.value = res.data;
  } catch (err) {
    console.warn("Unable to load assets", err);
  }
}

function getWhatsappHref(phoneNumber?: string, message?: string) {
  const phone = (phoneNumber || "").replace(/[^\d]/g, "");
  const text = message ? message.trim() : "";
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${params}`;
}

async function loadGlobalWhatsappFloat() {
  try {
    const res = await api.get("/pages");
    const pages = Array.isArray(res.data) ? res.data : [];
    for (const p of pages) {
      const blocks = Array.isArray(p?.blocks) ? p.blocks : [];
      const found = blocks.find((b: any) => b?.type === "whatsapp-float");
      if (found?.phoneNumber) {
        whatsappFloat.value = {
          phoneNumber: String(found.phoneNumber),
          message: found.message ? String(found.message) : undefined,
          label: found.label ? String(found.label) : "WhatsApp",
        };
        return;
      }
    }
    whatsappFloat.value = null;
  } catch (err) {
    console.warn("Unable to load WhatsApp float config", err);
  }
}

watch(() => site.value.logoAssetId, (newId) => {
  if (newId && !assets.value.some(a => a._id === newId)) {
    loadAssets();
  }
});

watch(
  () => route.fullPath,
  () => {
    isMobileNavOpen.value = false;
  },
);

function handleScroll() {
  isScrolled.value = window.scrollY > 40;
}

onMounted(() => {
  siteStore.loadSite();
  loadAssets();
  loadGlobalWhatsappFloat();
  window.addEventListener('scroll', handleScroll, { passive: true });
});
</script>

<style scoped>
.site-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background: transparent;
  transition: all 0.3s ease;
}

.site-header.sticky {
  position: fixed;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 60px; /* Slim height */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.site-logo {
  height: 28px;
  width: auto;
}

.site-title {
  font-family: 'Spartan', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  transition: color 0.3s;
}

.site-header.sticky .site-title {
  color: #081828;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.mobile-nav-toggle {
  display: none;
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.site-header.sticky .mobile-nav-toggle {
  color: #081828;
  border-color: #e2e8f0;
  background: #fff;
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  transition: color 0.3s;
}

.site-header.sticky .nav-link {
  color: #081828;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: rgba(255, 255, 255, 0.75);
}

.site-header.sticky .nav-link:hover,
.site-header.sticky .nav-link.router-link-active {
  color: var(--primary);
}

.mobile-nav-overlay {
  display: none;
}

.mobile-nav-drawer {
  display: none;
}

/* WhatsApp Floating Button (Global) */
.wa-float-wrapper {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1200;
}

.wa-float-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #25d366;
  color: #fff;
  padding: 12px 16px;
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  font-weight: 700;
}

.wa-float-btn:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.wa-float-label {
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}
/* Footer */
.site-footer {
  background: #081828;
  color: rgba(255,255,255,0.7);
}
.footer-top {
  padding: 80px 0 60px;
}
.footer-bottom {
  background: #040e18;
  padding: 20px 0;
  text-align: center;
  font-size: 14px;
  color: rgba(255,255,255,0.5);
}
.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
}
.footer-logo {
  height: 40px;
  width: auto;
  margin-bottom: 1.5rem;
  filter: brightness(0) invert(1);
}
.footer-brand-name {
  font-family: 'Spartan', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 1.5rem;
}
.footer-desc {
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  font-size: 15px;
}
.footer-col-title {
  font-family: 'Spartan', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1.5rem;
}
.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.footer-links a,
.footer-links span {
  color: rgba(255,255,255,0.6);
  font-size: 15px;
  transition: color 0.3s;
}
.footer-links a:hover {
  color: var(--primary);
}
@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
  .site-nav {
    display: none;
  }
  .mobile-nav-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .mobile-nav-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 1100;
  }
  .mobile-nav-drawer {
    display: block;
    position: fixed;
    right: 0;
    top: 0;
    width: min(82vw, 320px);
    height: 100vh;
    background: #fff;
    z-index: 1150;
    transform: translateX(100%);
    transition: transform 0.2s ease;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.12);
  }
  .mobile-nav-drawer.open {
    transform: translateX(0);
  }
  .mobile-nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .mobile-nav-title {
    font-weight: 700;
    color: #081828;
  }
  .mobile-nav-close {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #334155;
  }
  .mobile-nav-list {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.25rem;
  }
  .mobile-nav-link {
    padding: 0.75rem 0.9rem;
    color: #0f172a;
    border-radius: 8px;
    font-weight: 500;
  }
  .mobile-nav-link.router-link-active,
  .mobile-nav-link:hover {
    background: #f1f5f9;
    color: var(--primary);
  }
  .header-container {
    height: 56px;
  }
}
</style>
