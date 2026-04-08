<template>
  <section class="section">
    <div class="container" v-if="product">
      <div class="detail-shell">
        <div class="gallery-card">
          <img v-if="imageUrl" :src="imageUrl" :alt="product.name" class="detail-image" />
          <div v-else class="detail-image placeholder">Tidak ada gambar produk</div>
          <div class="floating-badges">
            <span v-if="isDiscounted" class="badge danger">Diskon</span>
            <span v-if="isLowStock" class="badge warn">Stok terbatas</span>
          </div>
        </div>

        <div class="content-card">
          <p class="overline">SNM Shop</p>
          <h1 class="title">{{ product.name }}</h1>
          <p class="subtitle">{{ product.description || "Produk pilihan dengan kualitas terbaik untuk kebutuhan bisnis Anda." }}</p>

          <div class="price-wrap">
            <p class="price-main">Rp {{ money(finalPrice) }}</p>
            <p v-if="isDiscounted" class="price-old">Rp {{ money(basePrice) }}</p>
            <span v-if="isDiscounted" class="save-chip">Hemat {{ money(basePrice - finalPrice) }}</span>
          </div>

          <div class="quick-info">
            <div class="info-item"><strong>Stok</strong><span>{{ stock }} tersedia</span></div>
            <div class="info-item"><strong>Status</strong><span>{{ stock > 0 ? "Ready" : "Habis" }}</span></div>
            <div class="info-item"><strong>Terjual</strong><span>{{ soldCount }} pcs</span></div>
          </div>

          <div v-if="Array.isArray(product.ecommerce?.variants) && product.ecommerce.variants.length" class="variant-picker">
            <label v-for="v in product.ecommerce.variants" :key="v.key" class="form-field">
              <span>{{ v.key }}</span>
              <select v-model="selectedVariant[v.key]">
                <option v-for="opt in v.values || []" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </label>
          </div>

          <div class="actions">
            <button class="btn-primary" :disabled="stock <= 0" @click="addCurrentToCart">
              {{ stock > 0 ? "Tambah ke Keranjang" : "Stok Habis" }}
            </button>
            <router-link class="btn btn-secondary" to="/shop/cart">Lihat Keranjang</router-link>
            <router-link class="btn btn-ghost" to="/shop">Lanjut Belanja</router-link>
          </div>
        </div>
      </div>

      <div class="lower-grid">
        <div class="card feature-card">
          <h3>Detail & Fitur Produk</h3>
          <div v-if="product.features" class="feature-content rich-content" v-html="product.features"></div>
          <p v-else class="muted">Belum ada rincian fitur tambahan untuk produk ini.</p>
        </div>

        <aside class="card trust-card">
          <h4>Kenapa pilih produk ini?</h4>
          <ul>
            <li>Didukung tim SNM Group</li>
            <li>Harga transparan tanpa biaya tersembunyi</li>
            <li>Tracking order real-time</li>
            <li>Checkout cepat dan aman</li>
          </ul>
        </aside>
      </div>
    </div>

    <div class="container" v-else>
      <div class="card empty-card">
        <h3>Produk tidak ditemukan</h3>
        <p>Produk mungkin sudah tidak dijual atau URL yang dibuka tidak valid.</p>
        <router-link class="btn-primary" to="/shop">Kembali ke Shop</router-link>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { useShopCart } from "@/composables/useShopCart";

const route = useRoute();
const product = ref<any>(null);
const assets = ref<any[]>([]);
const selectedVariant = ref<Record<string, string>>({});
const soldCount = ref(0);
const { addToCart } = useShopCart();

function assetUrl(assetId: string) {
  return assets.value.find((a) => String(a?._id || "") === String(assetId || ""))?.url || "";
}

const basePrice = computed(() => Number(product.value?.price || 0));
const finalPrice = computed(() => Number(product.value?.finalPrice || product.value?.price || 0));
const stock = computed(() => Number(product.value?.ecommerce?.stock || 0));
const isDiscounted = computed(() => finalPrice.value < basePrice.value);
const isLowStock = computed(() => stock.value > 0 && stock.value <= 5);
const imageUrl = computed(() => assetUrl(String(product.value?.imageAssetId || "")));

function money(value: number) {
  return Number(value || 0).toLocaleString("id-ID");
}

function addCurrentToCart() {
  if (!product.value?._id) return;
  if (stock.value <= 0) return;
  addToCart({
    productId: product.value._id,
    name: product.value.name,
    qty: 1,
    variant: { ...selectedVariant.value },
    unitPrice: Number(product.value.finalPrice || product.value.price || 0),
    imageAssetId: product.value.imageAssetId,
  });
  Swal.fire({
    icon: "success",
    title: "Produk ditambahkan",
    text: `${product.value.name} masuk ke keranjang`,
    timer: 1100,
    showConfirmButton: false,
  });
}

onMounted(async () => {
  const id = String(route.params.id || "");
  const [prods, ast, statsRes] = await Promise.all([
    api.get("/ecommerce/products"),
    api.get("/assets"),
    api.get(`/ecommerce/products/${encodeURIComponent(id)}/stats`).catch(() => ({ data: { soldCount: 0 } })),
  ]);
  const found = (prods.data || []).find((p: any) => String(p._id) === id);
  product.value = found || null;
  assets.value = ast.data || [];
  soldCount.value = Number(statsRes?.data?.soldCount || 0);

  const initial: Record<string, string> = {};
  for (const v of found?.ecommerce?.variants || []) {
    if (v?.key && Array.isArray(v.values) && v.values.length) initial[v.key] = v.values[0];
  }
  selectedVariant.value = initial;
});
</script>

<style scoped>
.detail-shell { display: grid; grid-template-columns: minmax(300px, 460px) 1fr; gap: 1rem; margin-bottom: 1rem; }
.gallery-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
.detail-image { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; background: #f8fafc; display: block; }
.detail-image.placeholder { display: grid; place-items: center; color: #64748b; }
.floating-badges { position: absolute; top: 12px; left: 12px; display: flex; gap: 0.4rem; }
.badge { border-radius: 999px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 700; color: #fff; }
.badge.danger { background: #ef4444; }
.badge.warn { background: #f59e0b; }
.content-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; display: grid; gap: 0.8rem; align-content: start; }
.overline { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); }
.title { font-size: clamp(1.5rem, 2vw, 2rem); margin: 0; }
.subtitle { color: #475569; line-height: 1.75; }
.price-wrap { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.price-main { color: var(--primary); font-size: 1.5rem; font-weight: 800; }
.price-old { color: #94a3b8; text-decoration: line-through; }
.save-chip { font-size: 0.72rem; border: 1px solid #fecaca; color: #b91c1c; background: #fef2f2; border-radius: 999px; padding: 0.2rem 0.5rem; }
.quick-info { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.55rem; }
.info-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.55rem; display: grid; gap: 0.15rem; }
.info-item strong { font-size: 0.75rem; color: #64748b; }
.info-item span { color: #0f172a; font-weight: 600; }
.variant-picker { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
.actions { display: flex; gap: 0.55rem; flex-wrap: wrap; }
.lower-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1rem; }
.feature-card h3 { margin-bottom: 0.75rem; }
.feature-content { color: #334155; line-height: 1.8; }
.trust-card { height: fit-content; }
.trust-card h4 { margin-bottom: 0.6rem; }
.trust-card ul { list-style: none; display: grid; gap: 0.45rem; color: #475569; }
.trust-card li::before { content: "✓ "; color: #10b981; font-weight: 700; margin-right: 0.2rem; }
.muted { color: #64748b; }
.empty-card { display: grid; gap: 0.7rem; justify-items: start; }
@media (max-width: 980px) {
  .detail-shell { grid-template-columns: 1fr; }
  .lower-grid { grid-template-columns: 1fr; }
  .quick-info { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .variant-picker { grid-template-columns: 1fr; }
  .quick-info { grid-template-columns: 1fr; }
}
</style>
