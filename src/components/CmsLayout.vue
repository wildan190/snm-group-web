<template>
  <div class="cms-shell">
    <button class="mobile-menu-btn" type="button" @click="isMobileMenuOpen = true">
      <Icon icon="lucide:menu" width="20" />
      <span>Menu</span>
    </button>

    <div
      v-if="isMobileMenuOpen"
      class="sidebar-overlay"
      @click="isMobileMenuOpen = false"
    ></div>

    <aside class="cms-sidebar" :class="{ open: isMobileMenuOpen }">
      <div class="cms-logo">
        <div class="logo-box">
          <Icon icon="mdi:shield-account" width="20" />
        </div>
        <span class="logo-text">SNM Admin</span>
        <button class="close-menu-btn" type="button" @click="isMobileMenuOpen = false">
          <Icon icon="lucide:x" width="18" />
        </button>
      </div>
      
      <nav class="cms-nav">
        <div class="nav-group">
          <span class="nav-label">Menu Utama</span>
          <router-link to="/cms/dashboard" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:layout-dashboard" class="item-icon" />
            <span>Dashboard</span>
          </router-link>
          <router-link to="/cms/pages" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:file-text" class="item-icon" />
            <span>Halaman</span>
          </router-link>
          <router-link to="/cms/products" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:shopping-bag" class="item-icon" />
            <span>Produk</span>
          </router-link>
          <router-link to="/cms/assets" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:image" class="item-icon" />
            <span>Aset Media</span>
          </router-link>
        </div>

        <div class="nav-group">
          <span class="nav-label">Konfigurasi</span>
          <router-link to="/cms/navbar" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:menu" class="item-icon" />
            <span>Navigasi</span>
          </router-link>
          <router-link to="/cms/settings" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:settings" class="item-icon" />
            <span>Pengaturan</span>
          </router-link>
          <router-link to="/cms/users" class="nav-item" @click="closeMenuOnMobile">
            <Icon icon="lucide:users" class="item-icon" />
            <span>Pengelola</span>
          </router-link>
        </div>
      </nav>

      <div class="cms-footer">
        <button class="logout-btn" @click="logout">
          <Icon icon="lucide:log-out" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>

    <main class="cms-main">
      <div class="cms-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
const auth = useAuthStore();
const isMobileMenuOpen = ref(false);

function closeMenuOnMobile() {
  if (window.innerWidth <= 900) {
    isMobileMenuOpen.value = false;
  }
}

function logout() {
  auth.logout();
  window.location.href = "/cms/login";
}
</script>

<style scoped src="@/styles/cms/layout.css"></style>
