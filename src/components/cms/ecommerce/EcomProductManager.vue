<template>
  <div class="card section">
    <div class="product-head">
      <div class="product-head-left">
        <h3>Product Catalog Management</h3>
        <span class="order-count">{{ totalItems }} items</span>
      </div>
      <div class="flex gap-2">
        <input 
          :value="filter" 
          @input="$emit('update:filter', ($event.target as HTMLInputElement).value)" 
          placeholder="Cari produk..." 
          class="product-search" 
        />
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div class="order-toolbar card-soft mb-4">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:layers" class="text-slate-400" />
        <select 
          :value="bulkAction" 
          @change="$emit('update:bulkAction', ($event.target as HTMLSelectElement).value)" 
          class="select-clean"
        >
          <option value="">Mass Action</option>
          <option value="enable">Enable Selling</option>
          <option value="disable">Disable Selling</option>
        </select>
        <button 
          class="btn-secondary btn-sm" 
          @click="$emit('run-bulk')" 
          :disabled="!bulkAction || selectedIds.length === 0"
        >
          Apply to {{ selectedIds.length }} selected
        </button>
      </div>
    </div>

    <div class="table-wrap">
      <table class="mini-table">
        <thead>
          <tr>
            <th width="40">
              <input 
                type="checkbox" 
                @change="$emit('toggle-all')" 
                :checked="isAllSelected" 
              />
            </th>
            <th>Product</th>
            <th>Base Price</th>
            <th width="120">Stock</th>
            <th width="150">Status</th>
            <th>Details</th>
            <th width="100">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p._id" :class="{ 'row-selected': selectedIds.includes(p._id) }">
            <td>
              <input 
                type="checkbox" 
                :value="p._id" 
                :checked="selectedIds.includes(p._id)"
                @change="$emit('toggle-select', p._id)"
              />
            </td>
            <td>
              <div class="product-cell">
                <img :src="getAssetUrl(p.imageAssetId)" class="prod-thumb" v-if="p.imageAssetId" />
                <div class="prod-info">
                  <strong>{{ p.name }}</strong>
                  <span class="text-xs text-slate-400">{{ p.slug }}</span>
                </div>
              </div>
            </td>
            <td>Rp {{ Number(p.price || 0).toLocaleString("id-ID") }}</td>
            <td>
              <div class="stock-input-wrap">
                <input 
                  type="number" 
                  v-model.number="p.ecommerce.stock" 
                  @change="$emit('save-inline', p)" 
                  class="stock-mini" 
                />
              </div>
            </td>
            <td>
              <button 
                class="status-toggle" 
                :class="{ active: p.ecommerce.sellingEnabled }"
                @click="$emit('toggle-status', p)"
              >
                {{ p.ecommerce.sellingEnabled ? 'Aktif' : 'Nonaktif' }}
              </button>
            </td>
            <td>
              <div class="badge-row">
                <span v-if="p.ecommerce.discount?.enabled" class="badge-stat discount">Sale</span>
                <span v-if="p.ecommerce.featured" class="badge-stat featured">Featured</span>
                <span v-if="p._variantRows?.length" class="badge-stat variant">{{ p._variantRows.length }} Var</span>
              </div>
            </td>
            <td>
              <button class="btn btn-ghost btn-sm" @click="$emit('edit', p)">
                <Icon icon="lucide:edit-3" class="mr-1" />
                Details
              </button>
            </td>
          </tr>
          <tr v-if="!products.length">
            <td colspan="7" class="text-center py-8 text-slate-400">No products found.</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="pager">
      <button class="btn-secondary btn-sm" :disabled="page <= 1" @click="$emit('update:page', page - 1)">Prev</button>
      <span class="text-sm">Page {{ page }} / {{ totalPages }}</span>
      <button class="btn-secondary btn-sm" :disabled="page >= totalPages" @click="$emit('update:page', page + 1)">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  products: any[];
  totalItems: number;
  filter: string;
  page: number;
  totalPages: number;
  selectedIds: string[];
  isAllSelected: boolean;
  bulkAction: string;
  getAssetUrl: (id?: string) => string;
}>();

defineEmits([
  "update:filter", 
  "update:page", 
  "update:bulkAction", 
  "run-bulk", 
  "toggle-all", 
  "toggle-select", 
  "toggle-status",
  "save-inline",
  "edit"
]);
</script>

<style scoped>
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.product-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.65rem; }
.product-head-left { display: flex; align-items: center; gap: 0.75rem; }
.order-count { font-size: 0.78rem; border: 1px solid #dbeafe; color: #1d4ed8; background: #eff6ff; border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; }
.product-search { max-width: 260px; padding: 0.6rem 1rem; border-radius: 999px; border: 1px solid #e2e8f0; font-size: 0.875rem; }
.product-toolbar { grid-template-columns: auto auto 1fr; align-items: center; padding: 0.75rem 1rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
.order-toolbar { display: flex; align-items: center; gap: 0.75rem; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; }
.select-clean { border: none; background: transparent; font-weight: 600; color: #475569; font-size: 0.875rem; cursor: pointer; }

/* Table styles */
.table-wrap { overflow-x: auto; }
.mini-table { width: 100%; border-collapse: collapse; }
.mini-table th, .mini-table td { border-bottom: 1px solid #f1f5f9; padding: 0.5rem 0.55rem; vertical-align: middle; font-size: 0.84rem; text-align: left; }
.mini-table th { font-weight: 700; color: #64748b; background: #f8fafc; }

.row-selected { background: #fdfbff; }
.product-cell { display: flex; align-items: center; gap: 0.85rem; }
.prod-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; }
.prod-info { display: flex; flex-direction: column; gap: 1px; }
.prod-info strong { color: #0f172a; font-size: 0.95rem; }

.stock-input-wrap { display: flex; align-items: center; }
.stock-mini { width: 70px !important; padding: 4px 8px !important; text-align: center; border-radius: 6px !important; border-color: #e2e8f0 !important; background: white !important; font-weight: 700; }

.status-toggle { border: 1px solid #e2e8f0; background: #f1f5f9; color: #64748b; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.status-toggle.active { background: #dcfce7; color: #166534; border-color: #bbf7d0; }

.badge-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.badge-stat { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
.badge-stat.discount { background: #fee2e2; color: #b91c1c; }
.badge-stat.featured { background: #fef9c3; color: #854d0e; }
.badge-stat.variant { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

.pager { margin-top: 0.75rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem; }

@media (max-width: 900px) {
  .product-head { flex-direction: column; align-items: flex-start; }
}
</style>
