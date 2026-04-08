<template>
  <section class="card dashboard-card">
    <div class="section-panel">
      <div class="panel-header">
        <div>
          <span class="overline">CMS Overview</span>
          <h2 class="page-title">Dashboard CMS</h2>
        </div>
      </div>
      <div class="grid grid-2">
        <div class="card stat-card">
          <p class="stat-title">Pengguna</p>
          <h3>{{ stats.users }}</h3>
        </div>
        <div class="card stat-card">
          <p class="stat-title">Halaman</p>
          <h3>{{ stats.pages }}</h3>
        </div>
        <div class="card stat-card">
          <p class="stat-title">Produk</p>
          <h3>{{ stats.products }}</h3>
        </div>
        <div class="card stat-card">
          <p class="stat-title">Aset</p>
          <h3>{{ stats.assets }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "@/utils/api";

const stats = ref({ users: 0, pages: 0, products: 0, assets: 0 });

async function loadStats() {
  const [users, pages, products, assets] = await Promise.all([
    api.get("/auth/users"),
    api.get("/pages"),
    api.get("/products"),
    api.get("/assets"),
  ]);
  stats.value.users = users.data.length;
  stats.value.pages = pages.data.length;
  stats.value.products = products.data.length;
  stats.value.assets = assets.data.length;
}

onMounted(loadStats);
</script>
