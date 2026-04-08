<template>
  <div class="cms-products-view">
    <div class="page-header">
      <div>
        <h1>Product Management</h1>
        <p class="text-sm text-slate-500">Kelola katalog produk Anda</p>
      </div>
      <button class="btn-primary" @click="createProduct">
        <Icon icon="lucide:plus" class="mr-2" />
        Buat Produk Baru
      </button>
    </div>

    <div class="page-content">
      <div class="table-card">
        <div class="table-head">
          <div class="table-title-group">
            <h3>Daftar Produk</h3>
            <span class="badge badge-primary">{{ products.length }}</span>
          </div>
          <div class="search-input-wrapper table-search">
            <Icon icon="lucide:search" class="search-icon" width="18" />
            <input
              v-model="productSearchQuery"
              type="text"
              placeholder="Cari produk..."
              class="w-full"
            />
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Slug</th>
                <th>Harga</th>
                <th class="actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in filteredProducts" :key="product._id">
                <td>{{ product.name }}</td>
                <td>{{ product.slug }}</td>
                <td>Rp {{ product.price || "0" }}</td>
                <td class="actions-col">
                  <button class="btn-icon-sm" title="Edit" @click="selectProduct(product)">
                    <Icon icon="lucide:edit-3" width="16" />
                  </button>
                  <button class="btn-icon-sm danger" title="Hapus" @click="deleteProduct(product)">
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="4" class="empty-row">Produk tidak ditemukan</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="product-form-area">
        <div class="card p-8">
          <h3 class="section-title mb-6">
            {{ current._id ? "Edit Produk" : "Produk Baru" }}
          </h3>

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
            <textarea
              v-model="current.description"
              rows="2"
              placeholder="Deskripsi singkat untuk list produk..."
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="form-field">
              <label>Harga (IDR)</label>
              <input v-model="current.price" placeholder="500000" />
            </div>
            <div class="form-field">
              <label>Gambar Utama</label>
              <div class="asset-selector-wrapper">
                <button
                  class="btn-secondary w-full"
                  @click.prevent="openProductImagePicker"
                >
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
            <QuillEditor
              v-model:content="current.features"
              content-type="html"
              theme="snow"
            />
          </div>

          <div class="mt-8 flex justify-end gap-4">
            <button class="btn-ghost" @click="createProduct">Batal</button>
            <button class="btn-primary px-10" @click="saveProduct">
              <Icon icon="lucide:save" class="mr-2" />
              Simpan Produk
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals (Simplified AssetModal here or use Shared Component) -->
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
import { ref, onMounted, computed } from "vue";
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

const products = ref<Product[]>([]);
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
const productSearchQuery = ref("");

const filteredProducts = computed(() => {
  if (!productSearchQuery.value) return products.value;
  const q = productSearchQuery.value.toLowerCase();
  return products.value.filter(
    (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
  );
});

async function loadProducts(): Promise<void> {
  const res = await api.get("/products");
  products.value = res.data;
}

async function loadAssets(): Promise<void> {
  const res = await api.get("/assets");
  assets.value = res.data;
}

function getAssetUrl(assetId: string): string {
  const asset = assets.value.find((item) => item._id === assetId);
  return asset ? asset.url : "";
}

function openProductImagePicker(): void {
  showAssetModal.value = true;
}

function applyAsset(asset: any): void {
  current.value.imageAssetId = asset._id;
  showAssetModal.value = false;
}

function createProduct(): void {
  current.value = {
    name: "",
    slug: "",
    description: "",
    price: "",
    features: "",
    imageAssetId: "",
  };
}

function selectProduct(product: Product): void {
  current.value = JSON.parse(JSON.stringify(product));
}

async function deleteProduct(product: Product): Promise<void> {
  const result = await Swal.fire({
    title: "Hapus produk ini?",
    text: product.name,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });
  if (!result.isConfirmed) return;
  await api.delete(`/products/${product._id}`);
  await loadProducts();
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
  await loadProducts();
  await Swal.fire({
    icon: "success",
    title: "Produk tersimpan",
    timer: 1500,
    showConfirmButton: false,
  });
}

onMounted(async () => {
  await loadProducts();
  await loadAssets();
});
</script>

<style scoped>
.cms-products-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f8fafc;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  padding: 1rem;
}

.table-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.table-head {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.table-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-title-group h3 {
  margin: 0;
  font-size: 1rem;
}

.table-search {
  min-width: 260px;
  margin-bottom: 0;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.actions-col {
  width: 140px;
  text-align: right !important;
}

.actions-col .btn-icon-sm {
  margin-left: 0.4rem;
}

.product-form-area {
  flex: 1;
  padding: 0;
  overflow: visible;
}

.product-mini-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-mini-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-selector-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-preview-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.image-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-row {
  text-align: center;
  color: #94a3b8;
}

:deep(.ql-container) {
  min-height: 200px;
  font-family: inherit;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-color: #e2e8f0;
}

:deep(.ql-container) {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-color: #e2e8f0;
}
</style>
