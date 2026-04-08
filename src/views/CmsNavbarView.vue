<template>
  <div class="cms-navbar-view">
    <div class="section-panel card">
      <div class="panel-header">
        <div>
          <span class="overline">Navigasi Utama</span>
          <h2 class="page-title">Manajemen Menu Navigasi</h2>
        </div>
        <div class="actions">
          <button class="btn-primary" @click="saveNavigation">
            <Icon icon="lucide:save" class="mr-2" />
            Simpan Navigasi
          </button>
        </div>
      </div>

      <!-- Navbar Section -->
      <div class="navigation-group">
        <div class="group-header">
          <h3>Navbar Menu</h3>
          <button class="btn-secondary-sm" @click="addNavItem('navbar')">
            <Icon icon="lucide:plus" class="mr-1" />
            Tambah Navbar
          </button>
        </div>
        <div class="nav-items-grid">
          <div v-for="(item, index) in localSite.navbar" :key="index" class="nav-item-card card">
            <div class="nav-item-form">
              <div class="form-field">
                <label>Label Menu</label>
                <input v-model="item.label" placeholder="Contoh: Beranda, Tentang Kami" />
              </div>
              <div class="form-field">
                <label>Pilih Halaman</label>
                <select v-model="item.link" class="select-input">
                  <option value="/">Beranda (Auto)</option>
                  <option v-if="item.link && !isKnownLink(item.link)" :value="item.link">
                    (Custom / Missing) {{ item.link }}
                  </option>
                  <option v-for="page in pages" :key="page._id" :value="'/page/' + page.slug">
                    {{ page.title }} (/page/{{ page.slug }})
                  </option>
                  <option value="/products">Katalog Produk</option>
                </select>
              </div>
              <button class="btn-icon-sm danger" @click="removeNavItem('navbar', index)">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="divider my-8"></div>

      <!-- Footer Section -->
      <div class="navigation-group">
        <div class="group-header">
          <h3>Footer Menu</h3>
          <button class="btn-secondary-sm" @click="addNavItem('footer')">
            <Icon icon="lucide:plus" class="mr-1" />
            Tambah Footer
          </button>
        </div>
        <div class="nav-items-grid">
          <div v-for="(item, index) in localSite.footer" :key="index" class="nav-item-card card">
            <div class="nav-item-form">
              <div class="form-field">
                <label>Label Footer</label>
                <input v-model="item.label" placeholder="Contoh: Disclaimer, Karir" />
              </div>
              <div class="form-field">
                <label>Pilih Halaman</label>
                <select v-model="item.link" class="select-input">
                  <option value="/">Beranda</option>
                  <option v-if="item.link && !isKnownLink(item.link)" :value="item.link">
                    (Custom / Missing) {{ item.link }}
                  </option>
                  <option v-for="page in pages" :key="page._id" :value="'/page/' + page.slug">
                    {{ page.title }}
                  </option>
                  <option value="/products">Produk</option>
                </select>
              </div>
              <button class="btn-icon-sm danger" @click="removeNavItem('footer', index)">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { Icon } from "@iconify/vue";
import { useSiteStore } from "@/stores/site";
import { storeToRefs } from "pinia";
import api from "@/utils/api";
import Swal from "sweetalert2";

const siteStore = useSiteStore();
const { site } = storeToRefs(siteStore);
const pages = ref<any[]>([]);
const pageLinks = computed(() => pages.value.map((p) => `/page/${p.slug}`));

// Use a local reactive copy for editing to avoid direct store binding while typing
const localSite = reactive({
  navbar: [] as any[],
  footer: [] as any[]
});

function isKnownLink(link: string) {
  return link === "/" || link === "/products" || pageLinks.value.includes(link);
}

async function loadData() {
  await siteStore.loadSite();
  localSite.navbar = JSON.parse(JSON.stringify(site.value.navbar || []));
  localSite.footer = JSON.parse(JSON.stringify(site.value.footer || []));

  const res = await api.get("/pages");
  pages.value = res.data;
}

function addNavItem(type: 'navbar' | 'footer') {
  localSite[type].push({ label: 'Menu Baru', link: '/' });
}

function removeNavItem(type: 'navbar' | 'footer', index: number) {
  localSite[type].splice(index, 1);
}

async function saveNavigation() {
  try {
    const updatedSite = {
      ...site.value,
      navbar: localSite.navbar,
      footer: localSite.footer
    };
    await siteStore.saveSite(updatedSite);
    await Swal.fire({
      icon: "success",
      title: "Navigasi tersimpan",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan navigasi", "error");
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cms-navbar-view {
  padding: 1rem;
}

.navigation-group {
  margin-top: 2rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.group-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}

.nav-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.nav-item-card {
  padding: 1.25rem;
}

.nav-item-form {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.nav-item-form .form-field {
  flex: 1;
  margin-bottom: 0;
}

.select-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 0.875rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.125rem;
}

.divider {
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 600px) {
  .nav-items-grid {
    grid-template-columns: 1fr;
  }
  .nav-item-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
