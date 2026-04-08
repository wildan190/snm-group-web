<template>
  <div class="cms-assets-container">
    <header class="view-header">
      <div class="header-main">
        <div class="brand-section">
          <span class="overline">Resource Library</span>
          <h1 class="page-title">Media Library</h1>
          <p class="hero-copy">Kelola semua aset media untuk website Anda di sini.</p>
        </div>
        <div class="header-actions">
          <div class="search-wrap glass">
            <Icon icon="lucide:search" class="search-icon" />
            <input v-model="searchQuery" type="text" placeholder="Cari aset..." />
          </div>
        </div>
      </div>
    </header>

    <div class="content-grid">
      <!-- Upload Section -->
      <section class="upload-section">
        <div class="upload-dropzone card glass" @click="triggerFileInput" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
          <input type="file" ref="fileInput" @change="onFileChange" class="hidden" />
          <div class="dropzone-content" :class="{ 'dragging': isDragging }">
            <div class="icon-wrap-premium">
              <Icon :icon="isUploading ? 'lucide:loader-2' : 'lucide:upload-cloud'" :class="{ 'animate-spin': isUploading }" width="48" />
            </div>
            <div class="text-center mt-4">
              <h3>{{ isUploading ? 'Sedang Mengunggah...' : 'Unggah Aset Baru' }}</h3>
              <p>Klik atau seret file ke sini untuk mengunggah</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Asset Gallery -->
      <section class="gallery-section">
        <div v-if="filteredAssets.length" class="asset-grid">
          <div v-for="asset in filteredAssets" :key="asset._id" class="asset-card-premium">
            <div class="asset-preview-wrap">
              <img v-if="isImage(asset.mimetype)" :src="asset.url" :alt="asset.originalName" class="asset-image" />
              <div v-else class="asset-placeholder">
                <Icon :icon="getFileIcon(asset.mimetype)" width="48" />
                <span class="file-ext">{{ getExtension(asset.originalName) }}</span>
              </div>
              
              <div class="asset-overlay">
                <div class="overlay-buttons">
                  <button class="btn-icon-sm" title="Copy URL" @click="copyUrl(asset.url)">
                    <Icon icon="lucide:copy" />
                  </button>
                  <a :href="asset.url" target="_blank" class="btn-icon-sm" title="Buka File">
                    <Icon icon="lucide:external-link" />
                  </a>
                  <button class="btn-icon-sm danger" title="Hapus Aset" @click="confirmDelete(asset)">
                    <Icon icon="lucide:trash-2" />
                  </button>
                </div>
              </div>
            </div>
            
            <div class="asset-details">
              <div class="asset-info">
                <span class="asset-name" :title="asset.originalName">{{ asset.originalName }}</span>
                <div class="asset-meta">
                  <span>{{ formatSize(asset.size) }}</span>
                  <span class="dot"></span>
                  <span>{{ formatDate(asset.uploadedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="searchQuery" class="empty-state card glass">
          <div class="icon-wrap-muted">
            <Icon icon="lucide:search-x" width="64" />
          </div>
          <h3>Tidak ada hasil ditemukan</h3>
          <p>Coba gunakan kata kunci pencarian lain.</p>
          <button @click="searchQuery = ''" class="btn-secondary mt-4">Hapus Pencarian</button>
        </div>
        
        <div v-else class="empty-state card glass">
          <div class="icon-wrap-muted">
            <Icon icon="lucide:image" width="64" />
          </div>
          <h3>Belum ada aset</h3>
          <p>Gunakan area unggah untuk menambahkan aset pertama Anda.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import Swal from "sweetalert2";
import { Icon } from "@iconify/vue";
import api from "@/utils/api";

type Asset = {
  _id: string;
  originalName: string;
  mimetype: string;
  url: string;
  size?: number;
  uploadedAt?: string;
};

const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isDragging = ref(false);
const assets = ref<Asset[]>([]);
const searchQuery = ref("");

const filteredAssets = computed(() => {
  if (!searchQuery.value) return assets.value;
  const q = searchQuery.value.toLowerCase();
  return assets.value.filter(a => 
    a.originalName.toLowerCase().includes(q) || 
    a.mimetype.toLowerCase().includes(q)
  );
});

async function loadAssets() {
  try {
    const res = await api.get("/assets");
    assets.value = res.data;
  } catch (err) {
    console.error("Gagal memuat aset:", err);
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) uploadFile(file);
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) uploadFile(file);
}

async function uploadFile(file: File) {
  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    await api.post("/assets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (fileInput.value) fileInput.value.value = "";
    await loadAssets();
    
    Toast.fire({
      icon: "success",
      title: "File berhasil diunggah",
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal Mengunggah",
      text: "Terjadi kesalahan saat mengunggah file Anda.",
    });
  } finally {
    isUploading.value = false;
  }
}

async function confirmDelete(asset: Asset) {
  const result = await Swal.fire({
    title: "Hapus Aset ini?",
    text: `Anda akan menghapus "${asset.originalName}". Tindakan ini permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/assets/${asset._id}`);
      await loadAssets();
      Toast.fire({
        icon: "success",
        title: "Aset telah dihapus",
      });
    } catch (err) {
      Swal.fire("Error", "Gagal menghapus aset.", "error");
    }
  }
}

async function copyUrl(url: string) {
  const fullUrl = `${window.location.origin}${url}`;
  try {
    await navigator.clipboard.writeText(fullUrl);
    Toast.fire({
      icon: "success",
      title: "Link disalin ke clipboard",
    });
  } catch (err) {
    Toast.fire({
      icon: "error",
      title: "Gagal menyalin link",
    });
  }
}

// Helpers
const isImage = (mimetype: string) => mimetype.startsWith("image/");

const getFileIcon = (mimetype: string) => {
  if (mimetype.includes("pdf")) return "lucide:file-text";
  if (mimetype.includes("video")) return "lucide:file-video";
  if (mimetype.includes("audio")) return "lucide:file-audio";
  if (mimetype.includes("zip") || mimetype.includes("archive")) return "lucide:archive";
  return "lucide:file";
};

const getExtension = (filename: string) => {
  return filename.split(".").pop()?.toUpperCase() || "FILE";
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  });
};

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

onMounted(loadAssets);
</script>

<style scoped>
.cms-assets-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.view-header {
  margin-bottom: 0.5rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  flex-wrap: wrap;
}

.search-wrap {
  display: flex;
  align-items: center;
  padding: 0 1.25rem;
  min-width: 300px;
  border-radius: 999px;
  background: white;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.search-icon {
  color: var(--text-muted);
}

.search-wrap input {
  border: none;
  background: transparent;
  width: 100%;
  padding: 0.85rem 0.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* Dropzone Styling */
.upload-dropzone {
  position: sticky;
  top: 1rem;
  cursor: pointer;
  padding: 2.5rem 1.5rem;
  border: 2px dashed var(--border-color);
  transition: all 0.3s;
  background: white;
  text-align: center;
}

.upload-dropzone:hover {
  border-color: var(--primary);
  background: var(--primary-light);
}

.dropzone-content.dragging {
  transform: scale(1.05);
  color: var(--primary);
}

.icon-wrap-premium {
  width: 80px;
  height: 80px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 20px;
  display: grid;
  place-items: center;
  margin: 0 auto;
}

/* Gallery Grid */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.asset-card-premium {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.asset-card-premium:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.asset-preview-wrap {
  position: relative;
  aspect-ratio: 4/3;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
}

.file-ext {
  font-size: 0.7rem;
  font-weight: 800;
  background: #e2e8f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

/* Overlays */
.asset-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.asset-card-premium:hover .asset-overlay {
  opacity: 1;
}

.overlay-buttons {
  display: flex;
  gap: 0.75rem;
}

.overlay-buttons .btn-icon-sm {
  background: white;
  color: var(--text-main);
  box-shadow: var(--shadow-md);
}

.overlay-buttons .btn-icon-sm:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.1);
}

.overlay-buttons .btn-icon-sm.danger:hover {
  background: var(--danger);
}

/* Details Section */
.asset-details {
  padding: 1rem;
}

.asset-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.asset-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.dot {
  width: 3px;
  height: 3px;
  background: #cbd5e1;
  border-radius: 50%;
}

/* Empty States */
.empty-state {
  padding: 6rem 2rem;
  text-align: center;
  border: 2px dashed var(--border-color);
}

.icon-wrap-muted {
  width: 100px;
  height: 100px;
  background: #f1f5f9;
  color: #cbd5e1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin: 0 auto 1.5rem;
}

.hidden {
  display: none;
}
</style>
