<template>
  <div id="app">
    <header
      v-if="!isCms"
      class="site-header"
      :class="{ sticky: isScrolled || isShopRoute, 'force-solid': isShopRoute }"
    >
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
const isShopRoute = computed(
  () => route.path.startsWith("/shop") || route.path.startsWith("/products"),
);

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

<style scoped src="@/styles/layout/app-shell.css"></style>
