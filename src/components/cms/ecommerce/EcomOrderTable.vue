<template>
  <div class="card section">
    <div class="order-head">
      <div class="order-head-left">
        <h3>Order List / History / Confirmation</h3>
        <span class="order-count">{{ totalItems }} order</span>
      </div>
      <button class="btn-secondary" @click="$emit('export')">Export CSV</button>
    </div>
    <div class="order-toolbar card-soft">
      <input 
        :value="search" 
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)" 
        placeholder="Cari order id / customer..." 
      />
      <select 
        :value="filter" 
        @change="$emit('update:filter', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Semua Status</option>
        <option value="pending_confirmation">Pending Confirmation</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="cancelled">Cancelled</option>
        <option value="expired">Expired</option>
      </select>
      <input type="date" :value="startDate" @input="$emit('update:startDate', ($event.target as HTMLInputElement).value)" />
      <input type="date" :value="endDate" @input="$emit('update:endDate', ($event.target as HTMLInputElement).value)" />
      <select 
        :value="bulkAction" 
        @change="$emit('update:bulkAction', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Bulk Action</option>
        <option value="confirm">Confirm</option>
        <option value="cancel">Cancel</option>
        <option value="ship">Mark Shipped</option>
      </select>
      <button 
        class="btn-secondary" 
        @click="$emit('run-bulk')" 
        :disabled="!bulkAction || selectedIds.length === 0"
      >
        Apply
      </button>
    </div>
    <div class="table-wrap">
      <table class="mini-table">
        <thead>
          <tr>
            <th></th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o._id">
            <td>
              <input 
                type="checkbox" 
                :checked="selectedIds.includes(o._id)" 
                @change="$emit('toggle-select', o._id)"
              />
            </td>
            <td class="font-mono text-xs">{{ o.orderId }}</td>
            <td>{{ o.customer?.name || "Guest" }}</td>
            <td>Rp {{ Number(o.totalAmount || 0).toLocaleString("id-ID") }}</td>
            <td><span class="status-chip" :class="statusClass(o.orderStatus)">{{ o.orderStatus }}</span></td>
            <td><span class="status-chip payment" :class="paymentClass(o.paymentStatus)">{{ o.paymentStatus }}</span></td>
            <td class="flex gap-1">
              <button class="btn-ghost btn-sm" @click="$emit('view', o)">Detail</button>
              <button v-if="canConfirm(o)" class="btn-secondary btn-sm" @click="$emit('confirm', o)">Confirm</button>
              <button class="btn-ghost btn-sm" @click="$emit('sync', o)">Sync</button>
            </td>
          </tr>
          <tr v-if="!orders.length">
            <td colspan="7" class="text-center py-8 text-slate-400">No orders found.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pager">
      <button class="btn-secondary" :disabled="page <= 1" @click="$emit('update:page', page - 1)">Prev</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button class="btn-secondary" :disabled="page >= totalPages" @click="$emit('update:page', page + 1)">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  orders: any[];
  totalItems: number;
  search: string;
  filter: string;
  startDate: string;
  endDate: string;
  bulkAction: string;
  selectedIds: string[];
  page: number;
  totalPages: number;
  statusClass: (s?: string) => string;
  paymentClass: (s?: string) => string;
  canConfirm: (o: any) => boolean;
}>();

defineEmits([
  "update:search",
  "update:filter",
  "update:startDate",
  "update:endDate",
  "update:bulkAction",
  "update:page",
  "run-bulk",
  "toggle-select",
  "view",
  "confirm",
  "sync",
  "export"
]);
</script>

<style scoped>
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.order-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
.order-head-left { display: flex; align-items: center; gap: 0.5rem; }
.order-count { font-size: 0.78rem; border: 1px solid #dbeafe; color: #1d4ed8; background: #eff6ff; border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; }
.order-toolbar { display: grid; grid-template-columns: minmax(200px, 1fr) repeat(2, minmax(130px, 180px)) minmax(130px, 160px) auto auto; gap: 0.4rem; margin-bottom: 0.55rem; background: #f8fafc; padding: 0.75rem; border-radius: 12px; }
.order-toolbar input, .order-toolbar select { font-size: 0.8rem; padding: 0.5rem; }

.table-wrap { overflow-x: auto; }
.mini-table { width: 100%; border-collapse: collapse; }
.mini-table th, .mini-table td { border-bottom: 1px solid #f1f5f9; padding: 0.5rem 0.55rem; vertical-align: top; font-size: 0.84rem; text-align: left; }
.mini-table th { font-weight: 700; color: #64748b; background: #f8fafc; }

.status-chip { display: inline-block; border-radius: 999px; padding: 0.12rem 0.5rem; font-size: 0.74rem; font-weight: 700; text-transform: capitalize; }
.status-chip.ok { background: #dcfce7; color: #166534; }
.status-chip.warn { background: #fef9c3; color: #854d0e; }
.status-chip.info { background: #dbeafe; color: #1d4ed8; }
.status-chip.danger { background: #fee2e2; color: #b91c1c; }
.status-chip.payment { text-transform: uppercase; }

.pager { margin-top: 0.75rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem; }
.btn-sm { padding: 0.4rem 0.6rem; font-size: 0.75rem; }

@media (max-width: 900px) {
  .order-toolbar { grid-template-columns: 1fr; }
  .order-head { flex-direction: column; align-items: flex-start; }
}
</style>
