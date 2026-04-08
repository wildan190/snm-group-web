<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content glass" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn-icon-sm" @click="$emit('close')">
          <Icon icon="lucide:x" width="20" />
        </button>
      </div>

      <div class="modal-body">
        <!-- New Upload Section - Distinguishable card-like area -->
        <div class="upload-area-wrapper mb-8">
          <div class="relative group">
            <input
              type="file"
              class="absolute inset-0 opacity-0 cursor-pointer z-10"
              @change="onFileChange"
            />
            <div class="file-input-placeholder" :class="{ 'has-file': !!selectedFile }">
              <Icon :icon="selectedFile ? 'lucide:file-check' : 'lucide:upload-cloud'" :class="{ 'mr-2': !!selectedFile }" />
              <span v-if="selectedFile" class="font-semibold">{{ selectedFile.name }}</span>
              <span v-else class="font-semibold text-slate-500">Klik atau Taruh File untuk Unggah Asset Baru</span>
            </div>
          </div>

          <div v-if="selectedFile" class="flex flex-col gap-3 mt-4">
            <button class="btn-primary w-full py-4 text-lg" type="button" @click="handleUpload">
              <Icon icon="lucide:arrow-up-circle" class="mr-2" />
              Unggah Asset Baru Sekarang
            </button>
            <button class="btn-ghost danger w-full" type="button" @click="clearSelection">
              Hapus Pilihan ({{ selectedFile.name }})
            </button>
          </div>
        </div>

        <div class="library-separator">
          <span>ATAU PILIH DARI KATALOG</span>
          <div class="line"></div>
        </div>

        <!-- Library Section -->
        <div class="asset-grid-container" v-if="!selectedFile">
          <div v-if="assets.length === 0" class="empty-assets">
            <Icon icon="lucide:images" width="48" class="text-slate-200 mb-2" />
            <p>Belum ada asset di katalog</p>
          </div>
          <div class="asset-grid">
            <div
              v-for="asset in assets"
              :key="asset._id"
              class="asset-item-card"
              :class="{ selected: localSelectedAssetId === asset._id }"
              @click="localSelectedAssetId = asset._id"
            >
              <div class="asset-preview">
                <img
                  v-if="asset.mimetype.startsWith('image/')"
                  :src="asset.url"
                  alt="asset"
                />
                <div v-else class="file-icon-placeholder">
                  <Icon icon="lucide:file" width="32" />
                </div>
                <div v-if="localSelectedAssetId === asset._id" class="selection-overlay">
                  <Icon icon="lucide:check-circle" width="32" />
                </div>
              </div>
              <div class="asset-info">
                <span class="asset-name">{{ asset.originalName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-ghost" type="button" @click="$emit('close')">
          Batal
        </button>
        <button 
          class="btn-primary" 
          type="button" 
          :disabled="!localSelectedAssetId"
          @click="confirmSelection"
        >
          Pilih Asset Ini
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import type { Asset } from "@/types/pageTypes";

interface Props {
  show: boolean;
  title: string;
  assets: Asset[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  "select-asset": [asset: Asset];
  upload: [file: File];
}>();

const selectedFile = ref<File | null>(null);
const localSelectedAssetId = ref<string | null>(null);

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] ?? null;
}

function handleUpload(): void {
  if (selectedFile.value) {
    emit("upload", selectedFile.value);
    selectedFile.value = null; // Clear after emitting
  }
}

function clearSelection(): void {
  selectedFile.value = null;
}

function confirmSelection(): void {
  const asset = props.assets.find((a) => a._id === localSelectedAssetId.value);
  if (asset) {
    emit("select-asset", asset);
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.modal-content {
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  background: white;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.upload-area-wrapper {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.library-separator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  color: var(--text-muted);
}

.library-separator span {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.library-separator .line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.asset-grid-container {
  min-height: 200px;
}

.modal-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f8fafc;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .upload-controls {
    flex-direction: row;
    align-items: stretch;
  }
}

.file-input-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem; /* Reduced from 1rem */
  height: 100%;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  transition: all 0.2s;
  background: #f8fafc;
}

.file-input-placeholder.has-file {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
  border-style: solid;
}

.file-input-placeholder:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.25rem;
}

.asset-item-card {
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
  background: white;
}

.asset-item-card.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.selection-overlay {
  position: absolute;
  inset: 0;
  background: rgba(37, 99, 235, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.asset-preview {
  aspect-ratio: 1;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.asset-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-info {
  padding: 0.75rem;
  background: white;
}

.asset-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-icon-placeholder {
  color: #cbd5e1;
}
</style>
