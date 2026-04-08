<template>
  <section class="section">
    <div class="container">
      <div class="card track-card">
        <div class="track-head">
          <div>
            <h1 class="page-title">Tracking Pembelian</h1>
            <p class="subtle">Masukkan ID order untuk melihat status pembayaran dan progres pesanan.</p>
          </div>
          <router-link class="btn-ghost" to="/shop">Kembali ke Shop</router-link>
        </div>
        <div class="track-form card-soft">
          <input v-model="inputOrderId" placeholder="Masukkan Order ID (contoh: SNM-...)" @keyup.enter="track" />
          <button class="btn-primary" @click="track">Lacak</button>
        </div>
        <div v-if="order" class="result">
          <div class="track-grid">
            <p><strong>Order ID:</strong> {{ order.orderId }}</p>
            <p><strong>Nama:</strong> {{ order.customer?.name }}</p>
            <p><strong>Alamat:</strong> {{ order.customer?.address || "-" }}</p>
            <p><strong>Status Order:</strong> <span class="badge">{{ order.orderStatus }}</span></p>
            <p><strong>Status Payment:</strong> <span class="badge alt">{{ order.paymentStatus }}</span></p>
          </div>
          <p class="total-line"><strong>Total:</strong> Rp {{ Number(order.totalAmount || 0).toLocaleString("id-ID") }}</p>
          <div class="mt-3">
            <h3>Items</h3>
            <ul class="list-box">
              <li v-for="(it, idx) in order.items || []" :key="idx" class="list-item">
                {{ it.name }} x{{ it.qty }} - Rp {{ Number(it.subTotal || 0).toLocaleString("id-ID") }}
                <span v-if="it.variant && Object.keys(it.variant).length"> ({{ formatVariant(it.variant) }})</span>
              </li>
            </ul>
          </div>
          <div class="mt-3">
            <h3>Timeline Status</h3>
            <ul class="list-box">
              <li v-for="(h, idx) in order.statusHistory || []" :key="idx" class="list-item">
                {{ formatDate(h.at) }} - {{ h.orderStatus }} / {{ h.paymentStatus }} - {{ h.note }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import api from "@/utils/api";

const route = useRoute();
const router = useRouter();
const inputOrderId = ref("");
const order = ref<any>(null);

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

function formatVariant(obj: Record<string, string>) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

async function track() {
  if (!inputOrderId.value) return;
  try {
    const res = await api.get(`/ecommerce/orders/${encodeURIComponent(inputOrderId.value)}`);
    order.value = res.data;
    router.replace({ name: "shop-track-detail", params: { orderId: inputOrderId.value } });
  } catch {
    order.value = null;
    await Swal.fire("Tidak ditemukan", "Order ID tidak ditemukan.", "error");
  }
}

async function trackByParam() {
  const fromParam = String(route.params.orderId || "");
  if (!fromParam) return;
  inputOrderId.value = fromParam;
  try {
    const res = await api.get(`/ecommerce/orders/${encodeURIComponent(fromParam)}`);
    order.value = res.data;
  } catch {
    order.value = null;
  }
}

watch(() => route.params.orderId, trackByParam);
onMounted(trackByParam);
</script>

<style scoped>
.track-card { max-width: 860px; margin: 0 auto; display: grid; gap: 1rem; }
.track-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.subtle { color: #64748b; }
.card-soft { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; }
.track-form { display: grid; grid-template-columns: 1fr auto; gap: 0.7rem; }
.track-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.6rem; }
.badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 0.76rem; }
.badge.alt { background: #dcfce7; color: #166534; }
.total-line { font-size: 1.05rem; margin-bottom: 0.65rem; }
.list-box { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.list-item { padding: 0.65rem 0.8rem; border-bottom: 1px dashed #e2e8f0; }
.list-item:last-child { border-bottom: none; }
@media (max-width: 700px) {
  .track-form { grid-template-columns: 1fr; }
  .track-grid { grid-template-columns: 1fr; }
  .track-head { flex-direction: column; }
}
</style>
