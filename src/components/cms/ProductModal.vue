<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content glass" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Pilih Produk Terkait</h3>
        <button class="btn-icon-sm" @click="$emit('close')">
          <Icon icon="lucide:x" width="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="search-input-wrapper mb-6">
          <Icon icon="lucide:search" class="search-icon" width="18" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk..."
            class="w-full"
          />
        </div>

        <div class="product-grid">
          <div
            v-for="product in filteredProducts"
            :key="product._id"
            class="premium-product-card"
            :class="{ selected: selectedIds.includes(product._id) }"
            @click="toggleSelection(product._id)"
          >
            <div class="selection-indicator">
              <Icon v-if="selectedIds.includes(product._id)" icon="lucide:check-circle-2" class="text-primary" width="24" />
              <div v-else class="indicator-empty"></div>
            </div>

            <div class="product-thumb-wrapper">
              <img
                v-if="product.imageAssetId"
                :src="getAssetUrl(product.imageAssetId)"
                alt="Produk"
              />
              <div v-else class="thumb-placeholder">
                <Icon icon="lucide:package" width="32" class="text-slate-300" />
              </div>
            </div>

            <div class="product-info">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-price">Rp {{ product.price || "0" }}</span>
            </div>
          </div>
        </div>

        <div v-if="filteredProducts.length === 0" class="empty-state">
          <Icon icon="lucide:search-x" width="48" class="text-slate-200 mb-2" />
          <p>Produk tidak ditemukan</p>
        </div>
      </div>

      <div class="modal-footer">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-slate-500">
            {{ selectedIds.length }} produk dipilih
          </span>
          <button class="btn-ghost" type="button" @click="$emit('close')">
            Batal
          </button>
          <button class="btn-primary px-8" type="button" @click="$emit('save')">
            Simpan Pilihan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { Product } from "@/types/pageTypes";

interface Props {
  show: boolean;
  products: Product[];
  selectedIds: string[];
  getAssetUrl: (id: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [];
  toggle: [id: string];
}>();

const searchQuery = ref("");

const filteredProducts = computed(() => {
  if (!searchQuery.value) return props.products;
  const q = searchQuery.value.toLowerCase();
  return props.products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
  );
});

function toggleSelection(productId: string): void {
  emit("toggle", productId);
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

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

.premium-product-card {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-lg);
  border: 2px solid var(--border-color);
  background: white;
  padding: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-product-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.premium-product-card.selected {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.indicator-empty {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  background: white;
}

.product-thumb-wrapper {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 0.75rem;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  color: #94a3b8;
  text-align: center;
}
</style>
