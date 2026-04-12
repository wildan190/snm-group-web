<template>
  <div v-if="product" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-head">
        <div class="flex items-center gap-3">
          <div class="icon-wrap-premium sm">
            <Icon icon="lucide:package-open" width="24" />
          </div>
          <div>
            <h3>Edit Product Logic</h3>
            <p class="text-xs text-slate-500">{{ product.name }}</p>
          </div>
        </div>
        <button class="modal-close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="grid grid-2 gap-4 mb-6">
           <label class="toggle-item">
            <span>Aktif Dijual</span>
            <input type="checkbox" v-model="product.ecommerce.sellingEnabled" />
          </label>
          <label class="toggle-item">
            <span>Highlight / Featured</span>
            <input type="checkbox" v-model="product.ecommerce.featured" />
          </label>
          <label class="form-field full-row">
            <span>Label Highlight (e.g. Best Seller)</span>
            <input v-model="product.ecommerce.highlightText" placeholder="Contoh: Best Seller" />
          </label>
        </div>

        <div class="discount-box mb-6">
          <div class="discount-head">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:ticket-percent" class="text-primary" />
              <h5 class="m-0">Discount Settings</h5>
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="product.ecommerce.discount.enabled" /> 
              Enable Discount
            </label>
          </div>
          <div class="discount-grid mt-4" :class="{ 'opacity-50 pointer-events-none': !product.ecommerce.discount?.enabled }">
            <div class="form-field">
              <label>Type</label>
              <select v-model="product.ecommerce.discount.type">
                <option value="percent">Persen (%)</option>
                <option value="fixed">Fixed (IDR)</option>
              </select>
            </div>
            <div class="form-field">
              <label>Value</label>
              <input type="number" min="0" v-model.number="product.ecommerce.discount.value" placeholder="Nilai diskon" />
            </div>
            <div class="form-field">
              <label>Start Date</label>
              <input type="datetime-local" v-model="product.ecommerce.discount.startAt" />
            </div>
            <div class="form-field">
              <label>End Date</label>
              <input type="datetime-local" v-model="product.ecommerce.discount.endAt" />
            </div>
          </div>
        </div>

        <div class="variant-box">
          <div class="variant-head">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:layers" class="text-primary" />
              <h5 class="m-0">Variant Builder</h5>
            </div>
            <button class="btn-secondary btn-sm" @click="$emit('add-variant')">+ Add Variant Group</button>
          </div>
          <p class="text-xs text-slate-500 mb-3">Example Group: "Size", Values: "S, M, L"</p>
          <div class="variant-list">
            <div v-for="(v, idx) in product._variantRows" :key="idx" class="variant-row-premium">
              <input v-model="v.key" placeholder="Group (e.g. Color)" class="compact-input" />
              <input v-model="v.values" placeholder="Options (comma separated)" class="compact-input" />
              <button class="btn-icon-sm danger" @click="$emit('remove-variant', Number(idx))">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
          </div>
          <div v-if="!product._variantRows?.length" class="empty-variants mt-2">
             No variants defined.
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary px-8" @click="$emit('save')">
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  product: any;
}>();

defineEmits(["close", "save", "add-variant", "remove-variant"]);
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
.modal-content { background: white; border-radius: 14px; max-width: 760px; width: 100%; max-height: 85vh; overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; border: 1px solid #e2e8f0; box-shadow: 0 32px 80px rgba(15, 23, 42, 0.16); }
.modal-head { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 0.7rem; align-items: flex-start; background: linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%); }
.modal-head h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.modal-close-btn { width: 34px; height: 34px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 1.2rem; line-height: 1; cursor: pointer; }
.modal-body { padding: 1rem; overflow-y: auto; }
.modal-footer { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; background: #fafcff; }

.toggle-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.5rem 0.6rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #334155; }
.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.form-field span, .form-field label { font-size: 0.75rem; font-weight: 700; color: #64748b; }
.full-row { grid-column: 1 / -1; }

.discount-box, .variant-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; background: #fff; }
.discount-head, .variant-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; gap: 0.6rem; }
.discount-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }

.variant-row-premium { display: grid; grid-template-columns: 140px 1fr auto; gap: 0.75rem; align-items: center; margin-bottom: 0.5rem; background: #f8fafc; padding: 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.compact-input { padding: 4px 10px !important; font-size: 0.85rem !important; border-radius: 6px !important; border: 1px solid #e2e8f0; }

.icon-wrap-premium.sm { width: 42px; height: 42px; border-radius: 10px; background: var(--primary-light); color: var(--primary); display: grid; place-items: center; }
.empty-variants { color: #94a3b8; font-size: 0.8rem; text-align: center; padding: 1rem; }

@media (max-width: 600px) {
  .grid-2 { grid-template-columns: 1fr; }
  .discount-grid { grid-template-columns: 1fr; }
  .variant-row-premium { grid-template-columns: 1fr; }
}
</style>
