<template>
  <div class="card section">
    <div class="carousel-head">
      <div>
        <h3>Carousel Iklan Ecommerce</h3>
        <p class="text-slate-500 text-sm">Klik slide pada halaman shop akan memfilter produk sesuai program iklan.</p>
      </div>
      <div class="carousel-head-actions">
        <span class="carousel-count">{{ banners?.length || 0 }} Banner</span>
        <button class="btn-secondary" @click="$emit('add')">+ Tambah Banner</button>
      </div>
    </div>
    <div class="banner-list">
      <div class="banner-row" v-for="(banner, idx) in banners" :key="idx">
        <div class="banner-card">
          <div class="banner-card-top">
            <span class="banner-index">Banner {{ Number(idx) + 1 }}</span>
            <button class="btn-ghost danger" @click="$emit('remove', Number(idx))">Hapus</button>
          </div>

          <div class="banner-asset-cell">
            <img v-if="getAssetUrl(banner.imageAssetId)" :src="getAssetUrl(banner.imageAssetId)" alt="banner asset" class="banner-thumb" />
            <div class="banner-asset-actions">
              <button class="btn-secondary" @click="$emit('open-picker', Number(idx))">Pilih dari Media Library</button>
              <small>{{ getAssetName(banner.imageAssetId) || "Belum ada gambar dipilih" }}</small>
            </div>
          </div>

          <div class="banner-form-grid">
            <input v-model="banner.title" placeholder="Judul banner" />
            <input v-model="banner.subtitle" placeholder="Subtitle banner" />
            <select v-model="banner.filterType">
              <option value="featured">Produk Featured</option>
              <option value="discount">Produk Diskon</option>
              <option value="inStock">Stok Tersedia</option>
              <option value="latest">Produk Terbaru</option>
            </select>
            <select multiple v-model="banner.productIds" class="banner-product-select">
              <option v-for="p in products" :key="p._id" :value="String(p._id)">{{ p.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="banner-actions">
      <button class="btn-primary mt-2" @click="$emit('save')">Simpan Carousel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  banners: any[];
  products: any[];
  getAssetUrl: (id?: string) => string;
  getAssetName: (id?: string) => string;
}>();

defineEmits(["add", "remove", "open-picker", "save"]);
</script>

<style scoped>
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.carousel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.55rem; }
.carousel-head-actions { display: flex; align-items: center; gap: 0.5rem; }
.carousel-count { font-size: 0.78rem; border: 1px solid #dbeafe; color: #1d4ed8; background: #eff6ff; border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; }
.banner-list { display: grid; gap: 0.5rem; }
.banner-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.65rem; background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%); display: grid; gap: 0.55rem; }
.banner-card-top { display: flex; justify-content: space-between; align-items: center; }
.banner-index { font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--primary); }
.banner-asset-cell { display: grid; grid-template-columns: 130px 1fr; gap: 0.55rem; align-items: center; }
.banner-thumb { width: 130px; height: 76px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; }
.banner-asset-actions { display: grid; gap: 0.25rem; }
.banner-form-grid { display: grid; grid-template-columns: 1fr 1fr 220px; gap: 0.45rem; align-items: start; }
.banner-product-select { min-height: 84px; font-size: 0.8rem; padding: 0.4rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.banner-actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }

@media (max-width: 900px) {
  .carousel-head { flex-direction: column; align-items: flex-start; }
  .banner-asset-cell { grid-template-columns: 1fr; }
  .banner-thumb { width: 100%; height: 170px; }
  .banner-form-grid { grid-template-columns: 1fr; }
}
</style>
