<template>
  <div class="card section">
    <h3>Dashboard Ecommerce</h3>
    <div class="stats">
      <div class="stat"><span>Produk Selling</span><strong>{{ stats.selling }}</strong></div>
      <div class="stat"><span>Total Stock</span><strong>{{ stats.stock }}</strong></div>
      <div class="stat"><span>Order Pending</span><strong>{{ stats.pending }}</strong></div>
      <div class="stat"><span>Total Order</span><strong>{{ totalOrders }}</strong></div>
    </div>
    <div class="charts mt-3">
      <div>
        <h4 class="mb-2">Sales 7 Hari Terakhir</h4>
        <div class="bars">
          <div v-for="d in salesByDay" :key="d.label" class="bar-col">
            <div class="bar" :style="{ height: `${d.height}%` }"></div>
            <small>{{ d.label }}</small>
          </div>
        </div>
      </div>
      <div>
        <h4 class="mb-2">Sales 8 Minggu Terakhir</h4>
        <div class="bars">
          <div v-for="w in salesByWeek" :key="w.label" class="bar-col">
            <div class="bar alt" :style="{ height: `${w.height}%` }"></div>
            <small>{{ w.label }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: {
    selling: number;
    stock: number;
    pending: number;
  };
  totalOrders: number;
  salesByDay: any[];
  salesByWeek: any[];
}>();
</script>

<style scoped>
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
.stat { padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; }
.stat span { color: #64748b; font-size: 0.8rem; }
.stat strong { font-size: 1.1rem; color: #0f172a; }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 0.9rem; }
.bars { height: 124px; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 0.3rem; align-items: end; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.45rem; }
.bar-col { display: grid; gap: 0.25rem; justify-items: center; }
.bar { width: 100%; border-radius: 6px; background: var(--primary); min-height: 6px; }
.bar.alt { background: #22c55e; }
small { font-size: 10px; color: #64748b; }

@media (max-width: 900px) {
  .stats { grid-template-columns: 1fr 1fr; }
  .charts { grid-template-columns: 1fr; }
}
</style>
