<template>
  <div class="dashboard-view">
    <header class="dashboard-header card">
      <div>
        <span class="overline">CMS Overview</span>
        <h1 class="page-title">Dashboard CMS</h1>
        <p class="subtitle">Pantau ringkasan website, konten terbaru, dan akses cepat fitur utama.</p>
      </div>
      <button class="btn-secondary" :disabled="isLoading" @click="loadDashboard">
        Muat Ulang
      </button>
    </header>

    <section class="stats-grid">
      <div class="stat-card card">
        <p class="stat-title">Pengguna</p>
        <h3>{{ stats.users }}</h3>
      </div>
      <div class="stat-card card">
        <p class="stat-title">Halaman</p>
        <h3>{{ stats.pages }}</h3>
      </div>
      <div class="stat-card card">
        <p class="stat-title">Produk</p>
        <h3>{{ stats.products }}</h3>
      </div>
      <div class="stat-card card">
        <p class="stat-title">Aset</p>
        <h3>{{ stats.assets }}</h3>
      </div>
    </section>

    <section class="quick-grid">
      <router-link class="quick-card card" to="/cms/pages">Kelola Halaman</router-link>
      <router-link class="quick-card card" to="/cms/products">Kelola Produk</router-link>
      <router-link class="quick-card card" to="/cms/assets">Kelola Aset</router-link>
      <router-link class="quick-card card" to="/cms/settings">Pengaturan Situs</router-link>
    </section>

    <section class="content-grid">
      <article class="card panel-card">
        <div class="panel-head">
          <h3>Halaman Terbaru</h3>
          <router-link to="/cms/pages" class="panel-link">Lihat semua</router-link>
        </div>
        <div v-if="recentPages.length" class="table-wrap">
          <table class="mini-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Slug</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="page in recentPages" :key="page._id">
                <td>{{ page.title }}</td>
                <td>/{{ page.slug }}</td>
                <td>{{ page.isHomepage ? "Homepage" : "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-text">Belum ada data halaman.</p>
      </article>

      <article class="card panel-card">
        <div class="panel-head">
          <h3>Produk Terbaru</h3>
          <router-link to="/cms/products" class="panel-link">Lihat semua</router-link>
        </div>
        <div v-if="recentProducts.length" class="table-wrap">
          <table class="mini-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Slug</th>
                <th>Harga</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in recentProducts" :key="product._id">
                <td>{{ product.name }}</td>
                <td>{{ product.slug }}</td>
                <td>Rp {{ product.price || "0" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-text">Belum ada data produk.</p>
      </article>
    </section>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "@/utils/api";

type Page = { _id?: string; title: string; slug: string; isHomepage?: boolean };
type Product = { _id?: string; name: string; slug: string; price?: string };

const isLoading = ref(false);
const errorMessage = ref("");
const stats = ref({ users: 0, pages: 0, products: 0, assets: 0 });
const recentPages = ref<Page[]>([]);
const recentProducts = ref<Product[]>([]);

async function loadDashboard() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const [usersRes, pagesRes, productsRes, assetsRes] = await Promise.all([
      api.get("/auth/users"),
      api.get("/pages"),
      api.get("/products"),
      api.get("/assets"),
    ]);

    const pages: Page[] = Array.isArray(pagesRes.data) ? pagesRes.data : [];
    const products: Product[] = Array.isArray(productsRes.data) ? productsRes.data : [];

    stats.value = {
      users: usersRes.data.length || 0,
      pages: pages.length,
      products: products.length,
      assets: assetsRes.data.length || 0,
    };

    recentPages.value = pages.slice(0, 5);
    recentProducts.value = products.slice(0, 5);
  } catch (err) {
    errorMessage.value = "Gagal memuat data dashboard.";
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped src="@/styles/cms/dashboard.css"></style>
