<template>
  <div class="cms-shell">
    <aside class="cms-sidebar">
      <div class="cms-logo">
        <div class="logo-box">
          <Icon icon="mdi:shield-account" width="20" />
        </div>
        <span class="logo-text">SNM Admin</span>
      </div>
      
      <nav class="cms-nav">
        <div class="nav-group">
          <span class="nav-label">Menu Utama</span>
          <router-link to="/cms/dashboard" class="nav-item">
            <Icon icon="lucide:layout-dashboard" class="item-icon" />
            <span>Dashboard</span>
          </router-link>
          <router-link to="/cms/pages" class="nav-item">
            <Icon icon="lucide:file-text" class="item-icon" />
            <span>Halaman</span>
          </router-link>
          <router-link to="/cms/products" class="nav-item">
            <Icon icon="lucide:shopping-bag" class="item-icon" />
            <span>Produk</span>
          </router-link>
          <router-link to="/cms/assets" class="nav-item">
            <Icon icon="lucide:image" class="item-icon" />
            <span>Aset Media</span>
          </router-link>
        </div>

        <div class="nav-group">
          <span class="nav-label">Konfigurasi</span>
          <router-link to="/cms/navbar" class="nav-item">
            <Icon icon="lucide:menu" class="item-icon" />
            <span>Navigasi</span>
          </router-link>
          <router-link to="/cms/settings" class="nav-item">
            <Icon icon="lucide:settings" class="item-icon" />
            <span>Pengaturan</span>
          </router-link>
          <router-link to="/cms/users" class="nav-item">
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
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
const auth = useAuthStore();
function logout() {
  auth.logout();
  window.location.href = "/cms/login";
}
</script>

<style scoped>
.cms-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
}

.cms-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
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

.cms-nav {
  flex: 1;
  padding: 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  overflow-y: auto;
}

.cms-container {
  max-width: none;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 900px) {
  .cms-shell {
    flex-direction: column;
  }
  .cms-sidebar {
    width: 100%;
    height: auto;
    position: static;
  }
  .cms-logo {
    padding: 1rem;
  }
  .cms-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
    gap: 0.5rem;
  }
  .nav-group {
    flex-direction: row;
  }
  .nav-label {
    display: none;
  }
}
</style>
