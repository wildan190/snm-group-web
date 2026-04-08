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

<style scoped>
.cms-shell {
  display: flex;
  height: 100vh;
  background: var(--bg-app);
  overflow: hidden;
}

.mobile-menu-btn {
  display: none;
}

.cms-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: 1200;
  flex-shrink: 0;
  overflow: hidden;
}

.cms-logo {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.logo-box {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  display: grid;
  place-items: center;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.close-menu-btn {
  display: none;
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--text-muted);
}

.cms-nav {
  flex: 1;
  padding: 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.75rem 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--border-light);
  color: var(--text-main);
}

.nav-item.router-link-active {
  background: var(--border-light);
  color: var(--text-main);
  font-weight: 600;
}

.item-icon {
  width: 18px;
  height: 18px;
}

.cms-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--border-light);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  color: var(--danger);
  background: transparent;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.05);
}

.cms-main {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.cms-container {
  max-width: none;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 900px) {
  .mobile-menu-btn {
    display: inline-flex;
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 1250;
    align-items: center;
    gap: 0.4rem;
    border: none;
    border-radius: 999px;
    padding: 0.65rem 0.9rem;
    background: var(--primary);
    color: white;
    box-shadow: var(--shadow-lg);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(2px);
    z-index: 1150;
  }

  .cms-sidebar {
    width: min(300px, 85vw);
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .cms-sidebar.open {
    transform: translateX(0);
  }

  .cms-logo {
    padding: 1rem;
  }

  .close-menu-btn {
    display: inline-flex;
  }

  .cms-nav {
    flex-direction: column;
    overflow-x: visible;
    padding: 0.5rem;
    gap: 0.5rem;
  }
  .nav-group {
    flex-direction: column;
  }
  .nav-label {
    display: block;
  }
}
</style>
