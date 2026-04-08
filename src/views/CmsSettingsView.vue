<template>
  <section class="card">
    <div class="section-panel">
      <div class="panel-header">
        <div>
          <span class="overline">Site Configuration</span>
          <h2 class="page-title">Konfigurasi Situs</h2>
        </div>
      </div>
      <form @submit.prevent="saveSettings" class="form-layout settings-form">
        <div class="form-grid split-columns two">
          <div class="form-field">
            <label>Nama Perusahaan</label>
            <input v-model="site.companyName" />
          </div>
          <div class="form-field">
            <label>Alamat</label>
            <input v-model="site.address" />
          </div>
        </div>

        <div class="form-grid split-columns two">
          <div class="form-field">
            <label>Email</label>
            <input v-model="site.email" />
          </div>
          <div class="form-field">
            <label>Kontak</label>
            <input v-model="site.phone" />
          </div>
        </div>

        <div class="form-field logo-field">
          <label>Logo</label>
          <div class="logo-selector">
            <div v-if="selectedLogoAsset" class="selected-logo">
              <img
                :src="selectedLogoAsset.url"
                alt="Logo"
                class="logo-preview"
              />
              <div>
                <div class="asset-selected">
                  {{ selectedLogoAsset.originalName }}
                </div>
                <button class="btn-secondary" type="button" @click="clearLogo">
                  Hapus
                </button>
              </div>
            </div>
            <button @click.prevent="showAssetModal = true" class="btn-primary">
              Pilih Logo
            </button>
          </div>
        </div>

        <div class="form-field">
          <label>Deskripsi Perusahaan</label>
          <textarea v-model="site.description" rows="4"></textarea>
        </div>

        <button class="btn-primary" type="submit">Simpan Konfigurasi</button>
      </form>
    </div>

    <div
      v-if="showAssetModal"
      class="modal-overlay"
      @click="showAssetModal = false"
    >
      <div class="modal-content" @click.stop>
        <h3>Pilih Logo</h3>
        <div class="asset-grid">
          <div
            v-for="asset in assets"
            :key="asset._id"
            class="asset-item"
            @click="selectLogo(asset)"
          >
            <img
              v-if="asset.mimetype.startsWith('image/')"
              :src="asset.url"
              alt="Asset"
              class="asset-preview"
            />
            <div>{{ asset.originalName }}</div>
          </div>
        </div>
        <button class="btn-secondary" type="button" @click="showAssetModal = false">
          Tutup
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Swal from "sweetalert2";
import { useSiteStore } from "@/stores/site";
import { storeToRefs } from "pinia";
import api from "@/utils/api";

const siteStore = useSiteStore();
const { site } = storeToRefs(siteStore);
const showAssetModal = ref(false);
const assets = ref<any[]>([]);

const selectedLogoAsset = computed(() => {
  return assets.value.find((asset) => asset._id === site.value.logoAssetId);
});

async function loadAssets() {
  const res = await api.get("/assets");
  assets.value = res.data;
}

function selectLogo(asset: any) {
  site.value.logoAssetId = asset._id;
  showAssetModal.value = false;
}

function clearLogo() {
  site.value.logoAssetId = "";
}

function addSocial(): void {
  site.value.socials.push({ name: "Instagram", url: "https://instagram.com" });
}

function removeSocial(index: number): void {
  site.value.socials.splice(index, 1);
}

async function saveSettings(): Promise<void> {
  await siteStore.saveSite(site.value);
  await Swal.fire({
    icon: "success",
    title: "Konfigurasi tersimpan",
    timer: 1400,
    showConfirmButton: false,
  });
}

onMounted(() => {
  siteStore.loadSite();
  loadAssets();
});
</script>

<style scoped>
.logo-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.logo-field {
  align-items: flex-start;
}

.settings-form {
  display: grid;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.list-card {
  padding: 1rem;
}

.list-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: end;
}

.list-row .form-field {
  margin-bottom: 0;
}

.remove-button {
  align-self: start;
  margin-top: 1.6rem;
  min-width: 120px;
}

@media (max-width: 800px) {
  .list-row {
    grid-template-columns: 1fr;
  }

  .remove-button {
    margin-top: 0.75rem;
  }
}

.selected-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.95rem;
  background: #f8fafc;
}

.logo-preview {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 0.75rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.asset-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s;
}

.asset-item:hover {
  border-color: #007bff;
}

.asset-preview {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
</style>
