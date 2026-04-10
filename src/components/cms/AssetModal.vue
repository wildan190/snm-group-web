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
            <div class="file-input-placeholder" :class="{ 'has-file': !!selectedFile, 'has-error': !!uploadError }">
              <Icon :icon="selectedFile ? 'lucide:file-check' : (uploadError ? 'lucide:alert-circle' : 'lucide:upload-cloud')" :class="{ 'mr-2': !!selectedFile || !!uploadError }" />
              <span v-if="selectedFile" class="font-semibold">{{ selectedFile.name }}</span>
              <span v-else-if="uploadError" class="font-semibold text-red-500">{{ uploadError }}</span>
              <span v-else class="font-semibold text-slate-500">Klik atau Taruh File untuk Unggah Asset Baru</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 text-center">Ukuran maks. 500 KB</p>
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

const MAX_FILE_SIZE = 500 * 1024; // 500 KB
const selectedFile = ref<File | null>(null);
const localSelectedAssetId = ref<string | null>(null);
const uploadError = ref<string>("");

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  uploadError.value = "";

  if (file && file.size > MAX_FILE_SIZE) {
    uploadError.value = `File terlalu besar (${(file.size / 1024).toFixed(0)} KB). Maks. 500 KB.`;
    selectedFile.value = null;
    target.value = ""; // Reset input
    return;
  }

  selectedFile.value = file;
}

function handleUpload(): void {
  if (selectedFile.value) {
    emit("upload", selectedFile.value);
    selectedFile.value = null;
    uploadError.value = "";
  }
}

function clearSelection(): void {
  selectedFile.value = null;
  uploadError.value = "";
}

function confirmSelection(): void {
  const asset = props.assets.find((a) => a._id === localSelectedAssetId.value);
  if (asset) {
    emit("select-asset", asset);
  }
}
</script>

<style scoped src="@/styles/cms/components/asset-modal.css"></style>
