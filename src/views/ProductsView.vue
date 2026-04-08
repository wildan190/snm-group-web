<template>
  <div class="products-page">
    <!-- ===== BREADCRUMBS ===== -->
    <section class="breadcrumbs">
      <div class="container text-center">
        <div class="breadcrumbs-content">
          <h1 class="page-title">Produk & Layanan</h1>
          <ul class="breadcrumb-nav">
            <li><router-link to="/">Home</router-link></li>
            <li>Produk</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ===== PRODUCTS GRID ===== -->
    <section class="section">
      <div class="container">
        <div class="section-title">
          <h3>Pilihan Terbaik</h3>
          <h2>Produk SNM Group</h2>
          <p>Pilih produk dan layanan bisnis untuk memajukan perusahaan Anda.</p>
        </div>

        <div v-if="products.length > 0" class="products-grid">
          <div v-for="product in products" :key="product._id" class="product-card">
            <div class="product-thumb">
              <img v-if="product.image" :src="product.image" :alt="product.name" />
              <div v-else class="product-thumb-placeholder">
                <Icon icon="lucide:package" width="40" />
              </div>
            </div>
            <div class="product-info">
              <h4>{{ product.name }}</h4>
              <p v-if="product.price" class="product-price">Rp {{ Number(product.price).toLocaleString('id-ID') }}</p>
              <p class="product-desc">{{ product.description }}</p>
              <router-link :to="'/products/' + product._id" class="btn btn-primary mt-auto" style="font-size: 13px; padding: 10px 20px; align-self: flex-start;">
                Lihat Detail
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-20">
          <p class="text-slate-400">Belum ada produk yang tersedia.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import api from "@/utils/api";
import { useSiteStore } from "@/stores/site";
import { applySeo } from "@/composables/useSeo";

type Product = {
  _id?: string;
  name: string;
  description: string;
  price?: string | number;
  image?: string;
  features?: string;
};

const products = ref<Product[]>([]);
const isLoading = ref(true);
const siteStore = useSiteStore();

async function loadProducts(): Promise<void> {
  isLoading.value = true;
  try {
    const res = await api.get("/products");
    products.value = res.data;
    const canonical = new URL("/products", window.location.origin).toString();
    applySeo({
      title: `Produk & Layanan | ${siteStore.site.companyName || "SNM Group"}`,
      description:
        "Katalog produk dan layanan SNM Group untuk kebutuhan bisnis Anda.",
      canonical,
      ogTitle: `Produk & Layanan | ${siteStore.site.companyName || "SNM Group"}`,
      ogDescription:
        "Katalog produk dan layanan SNM Group untuk kebutuhan bisnis Anda.",
      schema: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Produk SNM Group",
        itemListElement: res.data.map((item: Product, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          description: item.description,
        })),
      },
    });
  } catch (err) {
    console.warn("Unable to load products", err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await siteStore.loadSite();
  await loadProducts();
});
</script>

<style scoped>
.products-page {
  display: flex;
  flex-direction: column;
}

/* Reusing grid styles to ensure consistency with CMS pages */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.product-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-thumb {
  background: #f7f7f7;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-thumb img {
  transform: scale(1.05);
}

.product-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.product-info h4 {
  font-family: 'Spartan', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #081828;
}

.product-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.product-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  display: -webkit-box;
  overflow: hidden;
}

</style>
