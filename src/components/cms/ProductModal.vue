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

<style scoped src="@/styles/cms/components/product-modal.css"></style>
