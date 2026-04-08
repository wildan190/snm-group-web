<template>
  <div class="cms-products-view">
    <div class="page-header">
      <div>
        <h1>Product Management</h1>
        <p class="text-sm text-slate-500">Kelola daftar produk Anda</p>
      </div>
      <router-link to="/cms/products/new" class="btn btn-primary">
        <Icon icon="lucide:plus" class="mr-2" />
        Buat Produk Baru
      </router-link>
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
                  <button class="btn-icon-sm" title="Edit" @click="goEdit(product._id)">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { Icon } from "@iconify/vue";

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
const productSearchQuery = ref("");
const router = useRouter();

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

function goEdit(productId?: string) {
  if (!productId) return;
  router.push(`/cms/products/${productId}/edit`);
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

onMounted(async () => {
  await loadProducts();
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

.empty-row {
  text-align: center;
  color: #94a3b8;
}
</style>
