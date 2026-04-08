<template>
  <div class="cms-product-editor-view">
    <div class="page-header">
      <div>
        <h1>{{ isCreateMode ? "Buat Produk Baru" : "Edit Produk" }}</h1>
        <p class="text-sm text-slate-500">Editor produk terpisah dari daftar produk.</p>
      </div>
      <router-link to="/cms/products" class="btn-ghost">Kembali ke Daftar</router-link>
    </div>

    <div class="editor-card card p-8">
      <div class="grid grid-cols-2 gap-6">
        <div class="form-field">
          <label>Nama Produk</label>
          <input v-model="current.name" placeholder="Contoh: Premium Widget" />
        </div>
        <div class="form-field">
          <label>Slug</label>
          <input v-model="current.slug" placeholder="premium-widget" />
        </div>
      </div>

      <div class="form-field">
        <label>Deskripsi Singkat</label>
        <textarea v-model="current.description" rows="2" placeholder="Deskripsi singkat untuk list produk..."></textarea>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="form-field">
          <label>Harga (IDR)</label>
          <input v-model="current.price" placeholder="500000" />
        </div>
        <div class="form-field">
          <label>Gambar Utama</label>
          <div class="asset-selector-wrapper">
            <button class="btn-secondary w-full" @click.prevent="openProductImagePicker">
              <Icon icon="lucide:image" class="mr-2" />
              {{ current.imageAssetId ? "Ganti Gambar" : "Pilih Gambar" }}
            </button>
            <div v-if="current.imageAssetId" class="image-preview-box">
              <img :src="getAssetUrl(current.imageAssetId)" alt="Preview" />
              <button class="btn-icon-xs danger remove-img" @click="current.imageAssetId = ''">
                <Icon icon="lucide:x" width="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="form-field">
        <label>Fitur / Rincian Lengkap</label>
        <QuillEditor v-model:content="current.features" content-type="html" theme="snow" />
      </div>

      <div class="mt-8 flex justify-end gap-4">
        <router-link to="/cms/products" class="btn-ghost">Batal</router-link>
        <button class="btn-primary px-10" @click="saveProduct">
          <Icon icon="lucide:save" class="mr-2" />
          Simpan Produk
        </button>
      </div>
    </div>

    <AssetModal
      v-if="showAssetModal"
      :show="showAssetModal"
      title="Pilih Gambar Produk"
      :assets="assets"
      @select-asset="applyAsset"
      @close="showAssetModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { Icon } from "@iconify/vue";
import { QuillEditor } from "@vueup/vue-quill";
import AssetModal from "@/components/cms/AssetModal.vue";
import "@vueup/vue-quill/dist/vue-quill.snow.css";

type Product = {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price?: string;
  features?: string;
  imageAssetId?: string;
};

const route = useRoute();
const router = useRouter();
const productId = computed(() => String(route.params.id || ""));
const isCreateMode = computed(() => route.path.endsWith("/new"));

const current = ref<Product>({
  name: "",
  slug: "",
  description: "",
  price: "",
  features: "",
  imageAssetId: "",
});
const assets = ref<any[]>([]);
const showAssetModal = ref(false);

async function loadAssets(): Promise<void> {
  const res = await api.get("/assets");
  assets.value = res.data || [];
}

async function loadProductForEdit() {
  if (isCreateMode.value) return;
  const res = await api.get("/products");
  const list = Array.isArray(res.data) ? res.data : [];
  const found = list.find((p: any) => String(p?._id || "") === productId.value);
  if (found) current.value = JSON.parse(JSON.stringify(found));
}

function getAssetUrl(assetId: string): string {
  const asset = assets.value.find((item) => String(item?._id || "") === String(assetId || ""));
  return asset ? asset.url : "";
}

function openProductImagePicker(): void {
  showAssetModal.value = true;
}

function applyAsset(asset: any): void {
  current.value.imageAssetId = asset._id;
  showAssetModal.value = false;
}

async function saveProduct(): Promise<void> {
  if (!current.value.name || !current.value.slug) {
    await Swal.fire({
      icon: "warning",
      title: "Nama dan slug produk diperlukan",
      confirmButtonText: "OK",
    });
    return;
  }
  if (current.value._id) {
    await api.put(`/products/${current.value._id}`, current.value);
  } else {
    await api.post("/products", current.value);
  }
  await Swal.fire({
    icon: "success",
    title: "Produk tersimpan",
    timer: 1200,
    showConfirmButton: false,
  });
  router.push("/cms/products");
}

onMounted(async () => {
  await loadAssets();
  await loadProductForEdit();
});
</script>

<style scoped>
.cms-product-editor-view { display: grid; gap: 1rem; padding: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
.editor-card { overflow: visible; }
.asset-selector-wrapper { display: flex; flex-direction: column; gap: 1rem; }
.image-preview-box { position: relative; width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
.image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
.remove-img { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
:deep(.ql-container) { min-height: 200px; font-family: inherit; }
:deep(.ql-toolbar) { border-top-left-radius: 8px; border-top-right-radius: 8px; border-color: #e2e8f0; }
:deep(.ql-container) { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-color: #e2e8f0; }
</style>
