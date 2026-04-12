<template>
  <div class="card section">
    <h3>Payment Gateway (Midtrans)</h3>
    <p class="text-slate-500 mb-3 text-sm">Webhook URL: <code>{{ webhookUrl }}</code></p>
    <div class="payment-panel">
      <div class="switch-grid">
        <label class="switch-card">
          <div>
            <strong>Enable Ecommerce</strong>
            <p>Aktifkan modul belanja publik dan checkout.</p>
          </div>
          <input type="checkbox" v-model="config.enabled" />
        </label>
        <label class="switch-card">
          <div>
            <strong>Production Mode</strong>
            <p>Gunakan endpoint Midtrans production.</p>
          </div>
          <input type="checkbox" v-model="config.payment.isProduction" />
        </label>
      </div>

      <div class="grid grid-2 compact-grid mt-2">
        <label class="form-field"><span>Shop Title</span><input v-model="config.shopTitle" /></label>
        <label class="form-field"><span>Shop Description</span><input v-model="config.shopDescription" /></label>
        <label class="form-field"><span>Merchant ID</span><input v-model="config.payment.merchantId" /></label>
        <label class="form-field"><span>Client Key</span><input v-model="config.payment.clientKey" /></label>
        <label class="form-field full-row"><span>Server Key</span><input v-model="config.payment.serverKey" /></label>
      </div>
    </div>
    <button class="btn-primary mt-4" @click="$emit('save')">Simpan Konfigurasi Ecommerce</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  config: any;
}>();

defineEmits(["save"]);

const webhookUrl = computed(() => `${window.location.origin}/api/ecommerce/midtrans/webhook`);
</script>

<style scoped>
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.payment-panel { display: grid; gap: 0.6rem; }
.switch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.switch-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; background: #fff; cursor: pointer; }
.switch-card strong { font-size: 0.88rem; color: #0f172a; }
.switch-card p { margin-top: 0.15rem; font-size: 0.78rem; color: #64748b; line-height: 1.45; }
.switch-card input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--primary); }
.compact-grid { gap: 0.45rem; }
.full-row { grid-column: 1 / -1; }

@media (max-width: 900px) {
  .switch-grid { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
