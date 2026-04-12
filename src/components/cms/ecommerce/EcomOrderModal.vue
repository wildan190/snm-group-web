<template>
  <div v-if="order" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-head">
        <div class="order-modal-head">
          <div>
            <p class="text-xs text-slate-500">Order Detail</p>
            <h3>{{ order.orderId }}</h3>
          </div>
          <div class="order-status-pills">
            <span class="status-chip" :class="statusClass(order.orderStatus)">{{ order.orderStatus }}</span>
            <span class="status-chip payment" :class="paymentClass(order.paymentStatus)">{{ order.paymentStatus }}</span>
          </div>
        </div>
        <button class="modal-close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="order-meta-grid">
          <div class="meta-card">
            <span>Customer</span>
            <strong>{{ order.customer?.name || "-" }}</strong>
          </div>
          <div class="meta-card">
            <span>Email</span>
            <strong>{{ order.customer?.email || "-" }}</strong>
          </div>
          <div class="meta-card">
            <span>Phone</span>
            <strong>{{ order.customer?.phone || "-" }}</strong>
          </div>
          <div class="meta-card">
            <span>Total</span>
            <strong>Rp {{ Number(order.totalAmount || 0).toLocaleString("id-ID") }}</strong>
          </div>
        </div>

        <div class="order-modal-section">
          <h4>Items</h4>
          <div class="table-wrap">
            <table class="mini-table">
              <thead>
                <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in order.items || []" :key="idx">
                  <td>{{ it.name }}</td>
                  <td>{{ it.qty }}</td>
                  <td>Rp {{ Number(it.unitPrice || 0).toLocaleString("id-ID") }}</td>
                  <td>Rp {{ Number(it.subTotal || 0).toLocaleString("id-ID") }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="order-modal-section">
          <h4>Timeline</h4>
          <ul class="timeline-list">
            <li v-for="(h, idx) in order.statusHistory || []" :key="idx" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-top">
                  <strong>{{ formatDate(h.at) }}</strong>
                  <div class="order-status-pills">
                    <span class="status-chip" :class="statusClass(h.orderStatus)">{{ h.orderStatus }}</span>
                    <span class="status-chip payment" :class="paymentClass(h.paymentStatus)">{{ h.paymentStatus }}</span>
                  </div>
                </div>
                <p>{{ h.note || "-" }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="$emit('copy-id', order.orderId)">Copy Order ID</button>
        <button class="btn btn-secondary" @click="$emit('close')">Tutup</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  order: any;
  statusClass: (s?: string) => string;
  paymentClass: (s?: string) => string;
  formatDate: (d?: string) => string;
}>();

defineEmits(["close", "copy-id"]);
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
.modal-content { background: white; border-radius: 14px; max-width: 760px; width: 100%; max-height: 85vh; overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; border: 1px solid #e2e8f0; }
.modal-head { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 0.7rem; align-items: flex-start; background: linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%); }
.order-modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; width: 100%; }
.order-modal-head h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.modal-close-btn { width: 34px; height: 34px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 1.2rem; line-height: 1; cursor: pointer; }
.modal-body { padding: 1rem; overflow-y: auto; }

.status-chip { display: inline-block; border-radius: 999px; padding: 0.12rem 0.5rem; font-size: 0.74rem; font-weight: 700; text-transform: capitalize; }
.status-chip.ok { background: #dcfce7; color: #166534; }
.status-chip.warn { background: #fef9c3; color: #854d0e; }
.status-chip.info { background: #dbeafe; color: #1d4ed8; }
.status-chip.danger { background: #fee2e2; color: #b91c1c; }
.status-chip.payment { text-transform: uppercase; }

.order-status-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.order-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem; }
.meta-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.55rem 0.65rem; display: grid; gap: 0.2rem; }
.meta-card span { font-size: 0.74rem; color: #64748b; }
.meta-card strong { color: #0f172a; }

.order-modal-section { margin-top: 1rem; }
.order-modal-section h4 { margin-bottom: 0.75rem; font-size: 0.9rem; color: #475569; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.25rem; }

.mini-table { width: 100%; border-collapse: collapse; }
.mini-table th, .mini-table td { border-bottom: 1px solid #f1f5f9; padding: 0.5rem 0.55rem; vertical-align: top; font-size: 0.84rem; text-align: left; }
.table-wrap { overflow-x: auto; }

.timeline-list { list-style: none; display: grid; gap: 0.5rem; padding: 0; }
.timeline-item { display: grid; grid-template-columns: 16px 1fr; gap: 0.5rem; align-items: start; }
.timeline-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--primary); margin-top: 0.35rem; }
.timeline-content { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.6rem; background: #f8fafc; }
.timeline-top { display: flex; justify-content: space-between; gap: 0.6rem; align-items: center; margin-bottom: 0.2rem; }
.timeline-content p { color: #475569; margin: 0; font-size: 0.84rem; }

.modal-footer { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; background: #fafcff; }

@media (max-width: 600px) {
  .order-meta-grid { grid-template-columns: 1fr; }
  .timeline-top { flex-direction: column; align-items: flex-start; }
}
</style>
