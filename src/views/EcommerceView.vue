<template>
  <div class="shop-page">
    <section class="breadcrumbs">
      <div class="container text-center">
        <div class="breadcrumbs-content">
          <h1 class="page-title">{{ config.shopTitle || "Shop" }}</h1>
          <p class="text-white">{{ config.shopDescription }}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="shop-topbar card">
          <input v-model="searchQuery" placeholder="Cari produk..." />
          <select v-model="sortKey">
            <option value="latest">Terbaru</option>
            <option value="priceAsc">Harga Terendah</option>
            <option value="priceDesc">Harga Tertinggi</option>
          </select>
          <label><input type="checkbox" v-model="onlyDiscount" /> Diskon</label>
          <label><input type="checkbox" v-model="onlyInStock" /> In stock</label>
          <a class="cart-icon-btn" href="/shop/cart" aria-label="Buka keranjang">
            <span class="cart-emoji">🛒</span>
            <span v-if="cartCount" class="cart-badge">{{ cartCount }}</span>
          </a>
        </div>

        <div class="highlight-carousel card" v-if="carouselSlides.length">
          <button class="slide-link banner-button" @click="applyBannerFilter(activeBanner)">
            <img v-if="activeBannerImageUrl" :src="activeBannerImageUrl" :alt="activeBanner.title || 'Banner'" />
            <div class="slide-content">
              <p class="promo-tag">{{ activeBanner.title || "Program Promo" }}</p>
              <h3>{{ activeBanner.subtitle || "Klik untuk lihat produk iklan" }}</h3>
              <p v-if="activeBanner.filterType">Klik untuk lihat produk program {{ filterTypeLabel(activeBanner.filterType) }}</p>
              <p v-else>Klik untuk lihat semua produk promo</p>
            </div>
          </button>
          <div class="carousel-dots" v-if="carouselSlides.length > 1">
            <button
              v-for="(_, idx) in carouselSlides"
              :key="idx"
              class="dot"
              :class="{ active: Number(idx) === activeSlide }"
              @click="activeSlide = Number(idx)"
            ></button>
          </div>
        </div>

        <div class="filter-chip" v-if="bannerFilterType || bannerProductIds.length">
          <span>
            Filter iklan aktif: {{ filterTypeLabel(bannerFilterType) }}
            <template v-if="bannerProductIds.length"> ({{ bannerProductIds.length }} produk pilihan)</template>
          </span>
          <button class="btn-ghost" @click="resetBannerFilter">Reset</button>
        </div>

        <div class="products-grid">
          <div v-for="p in displayedProducts" :key="p._id" class="product-card">
            <a class="thumb-link" :href="`/shop/product/${p._id}`">
              <img v-if="p.imageAssetId" :src="assetUrl(p.imageAssetId)" :alt="p.name" class="product-thumb" />
            </a>
            <div class="product-info">
              <a class="product-name" :href="`/shop/product/${p._id}`">{{ p.name }}</a>
              <p class="product-price">Rp {{ Number(p.finalPrice || p.price || 0).toLocaleString("id-ID") }}</p>
              <small class="product-stock">Stock: {{ p.ecommerce?.stock || 0 }}</small>
              <div v-if="Array.isArray(p.ecommerce?.variants) && p.ecommerce.variants.length" class="variant-picker">
                <label v-for="v in p.ecommerce.variants" :key="v.key" class="form-field">
                  <span>{{ v.key }}</span>
                  <select :value="variantSelections[p._id]?.[v.key] || ''" @change="onVariantChange(p._id, v.key, $event)">
                    <option v-for="opt in v.values || []" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </label>
              </div>
              <div class="product-actions">
                <a class="btn btn-ghost" :href="`/shop/product/${p._id}`">Detail</a>
                <button class="btn-primary" @click="addProductToCart(p)">+ Cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { useShopCart } from "@/composables/useShopCart";

const config = ref<any>({});
const products = ref<any[]>([]);
const assets = ref<any[]>([]);
const variantSelections = ref<Record<string, Record<string, string>>>({});
const activeSlide = ref(0);
let slideTimer: ReturnType<typeof setInterval> | null = null;
const searchQuery = ref("");
const sortKey = ref("latest");
const onlyDiscount = ref(false);
const onlyInStock = ref(true);
const bannerFilterType = ref("");
const bannerProductIds = ref<string[]>([]);

function onVariantChange(productId: string, key: string, event: Event) {
  const target = event.target as HTMLSelectElement;
  if (!variantSelections.value[productId]) variantSelections.value[productId] = {};
  variantSelections.value[productId][key] = target.value;
}

function assetUrl(assetId: string) {
  const targetId = String(assetId || "").trim();
  if (!targetId) return "";
  return assets.value.find((a) => String(a?._id || "").trim() === targetId)?.url || "";
}

const { addToCart, cartCount } = useShopCart();

const carouselSlides = computed(() =>
  Array.isArray(config.value?.carouselBanners)
    ? config.value.carouselBanners.filter((banner: any) => String(banner?.imageAssetId || "").trim())
    : [],
);
const activeBanner = computed(() => carouselSlides.value[activeSlide.value] || carouselSlides.value[0] || {});
const activeBannerImageUrl = computed(() => assetUrl(activeBanner.value?.imageAssetId || ""));

const displayedProducts = computed(() => {
  let list = [...products.value];
  const q = searchQuery.value.trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.name || ""} ${p.description || ""}`.toLowerCase().includes(q));
  if (onlyDiscount.value) list = list.filter((p) => Number(p.finalPrice || p.price || 0) < Number(p.price || 0));
  if (onlyInStock.value) list = list.filter((p) => Number(p.ecommerce?.stock || 0) > 0);
  if (bannerProductIds.value.length) {
    const selected = new Set(bannerProductIds.value.map((id) => String(id)));
    list = list.filter((p) => selected.has(String(p._id || "")));
  }
  if (bannerFilterType.value === "featured") {
    list = list.filter((p) => !!p.ecommerce?.featured);
  } else if (bannerFilterType.value === "discount") {
    list = list.filter((p) => Number(p.finalPrice || p.price || 0) < Number(p.price || 0));
  } else if (bannerFilterType.value === "inStock") {
    list = list.filter((p) => Number(p.ecommerce?.stock || 0) > 0);
  } else if (bannerFilterType.value === "latest") {
    list = list.slice(0, 8);
  }

  if (sortKey.value === "priceAsc") {
    list.sort((a, b) => Number(a.finalPrice || a.price || 0) - Number(b.finalPrice || b.price || 0));
  } else if (sortKey.value === "priceDesc") {
    list.sort((a, b) => Number(b.finalPrice || b.price || 0) - Number(a.finalPrice || a.price || 0));
  }
  return list;
});

function addProductToCart(p: any) {
  if (!variantSelections.value[p._id]) variantSelections.value[p._id] = {};
  const selectedVariant = JSON.parse(JSON.stringify(variantSelections.value[p._id] || {}));
  addToCart({
    productId: p._id,
    name: p.name,
    qty: 1,
    variant: selectedVariant,
    unitPrice: Number(p.finalPrice || p.price || 0),
    imageAssetId: p.imageAssetId,
  });
  Swal.fire({ icon: "success", title: "Masuk keranjang", timer: 900, showConfirmButton: false });
}

function nextSlide() {
  if (!carouselSlides.value.length) return;
  activeSlide.value = (activeSlide.value + 1) % carouselSlides.value.length;
}

function startCarouselTimer() {
  if (slideTimer) clearInterval(slideTimer);
  if (carouselSlides.value.length <= 1) return;
  slideTimer = setInterval(() => nextSlide(), 4000);
}

function applyBannerFilter(banner: any) {
  bannerFilterType.value = String(banner?.filterType || "");
  bannerProductIds.value = Array.isArray(banner?.productIds)
    ? banner.productIds.map((id: string) => String(id || "").trim()).filter(Boolean)
    : [];
}

function resetBannerFilter() {
  bannerFilterType.value = "";
  bannerProductIds.value = [];
}

function filterTypeLabel(value: string) {
  if (value === "featured") return "Featured";
  if (value === "discount") return "Diskon";
  if (value === "inStock") return "In Stock";
  if (value === "latest") return "Terbaru";
  return "Umum";
}

onMounted(async () => {
  const [cfg, prods, ast] = await Promise.all([
    api.get("/ecommerce/config"),
    api.get("/ecommerce/products"),
    api.get("/assets"),
  ]);
  config.value = cfg.data || {};
  products.value = prods.data || [];
  assets.value = ast.data || [];
  const initial: Record<string, Record<string, string>> = {};
  for (const p of products.value) {
    const productId = String(p._id || "");
    if (!productId) continue;
    initial[productId] = {};
    for (const v of p?.ecommerce?.variants || []) {
      if (v?.key && Array.isArray(v.values) && v.values.length) initial[productId][v.key] = v.values[0];
    }
  }
  variantSelections.value = initial;
  startCarouselTimer();
});

onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer);
});
</script>

<style scoped>
.shop-topbar { display: grid; grid-template-columns: 1fr 180px auto auto auto; gap: 0.6rem; align-items: center; margin-bottom: 1rem; }
.cart-icon-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; text-decoration: none; }
.cart-emoji { font-size: 1.1rem; }
.cart-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; border-radius: 999px; min-width: 18px; height: 18px; line-height: 18px; text-align: center; font-size: 0.7rem; }
.highlight-carousel { position: relative; display: grid; gap: 0.6rem; margin-bottom: 1rem; }
.banner-button { border: none; padding: 0; background: transparent; cursor: pointer; text-align: left; }
.slide-link { position: relative; display: block; text-decoration: none; color: inherit; }
.slide-link img { width: 100%; height: 300px; object-fit: cover; border-radius: 12px; }
.slide-content { position: absolute; left: 20px; bottom: 20px; right: 20px; color: #fff; background: linear-gradient(180deg, rgba(2,6,23,0.05) 0%, rgba(2,6,23,0.8) 100%); border-radius: 10px; padding: 1rem; }
.promo-tag { font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-bottom: 0.3rem; }
.carousel-dots { display: flex; justify-content: center; gap: 0.35rem; }
.dot { width: 9px; height: 9px; border-radius: 999px; border: none; background: #cbd5e1; cursor: pointer; }
.dot.active { background: var(--primary); }
.filter-chip { margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 0.55rem 0.7rem; background: #f8fafc; }
.products-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; }
.product-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; }
.thumb-link { display: block; }
.product-thumb { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #f8fafc; }
.product-info { padding: 0.7rem; display: grid; gap: 0.35rem; }
.product-name { color: #111827; text-decoration: none; font-weight: 600; line-height: 1.3; min-height: 38px; }
.product-price { color: var(--primary); font-weight: 700; }
.product-stock { color: #64748b; font-size: 0.78rem; }
.variant-picker { display: grid; gap: 0.3rem; }
.product-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.2rem; }
@media (max-width: 1100px) { .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 900px) { .shop-topbar { grid-template-columns: 1fr; } .slide-link img { height: 220px; } .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .products-grid { grid-template-columns: 1fr; } }
</style>
