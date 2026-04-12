<template>
  <div class="ecom-cms">
    <div class="card head">
      <div>
        <h1 class="page-title">Ecommerce Module</h1>
        <p class="text-slate-500">
          Kelola selling, stok, variant, discount, Midtrans, dan order.
        </p>
      </div>
      <button class="btn-secondary" @click="loadAll">Refresh</button>
    </div>

    <!-- Dashboard Section -->
    <EcomDashboard
      :stats="stats"
      :total-orders="orders.length"
      :sales-by-day="salesByDay"
      :sales-by-week="salesByWeek"
    />

    <div class="split-grid">
      <!-- Payment Config Section -->
      <EcomPaymentConfig :config="config" @save="saveConfig" />

      <!-- Banner Manager Section -->
      <EcomBannerManager
        :banners="config.carouselBanners"
        :products="products"
        :get-asset-url="getAssetUrl"
        :get-asset-name="getAssetName"
        @add="addBanner"
        @remove="removeBanner"
        @open-picker="openBannerAssetModal"
        @save="saveConfig"
      />
    </div>

    <!-- Product Management Section -->
    <EcomProductManager
      v-model:filter="productFilter"
      v-model:page="productPage"
      v-model:bulkAction="bulkProductAction"
      :products="pagedProducts"
      :total-items="filteredProductCards.length"
      :total-pages="totalProductPages"
      :selected-ids="selectedProductIds"
      :is-all-selected="selectedProductIds.length === pagedProducts.length && pagedProducts.length > 0"
      :get-asset-url="getAssetUrl"
      @run-bulk="runBulkProductAction"
      @toggle-all="toggleSelectAllProducts"
      @toggle-select="(id) => toggleProductSelectionById(id)"
      @toggle-status="(p) => toggleProductStatus(p)"
      @save-inline="(p) => saveProductEcommerce(p, true)"
      @edit="openProductEdit"
    />

    <!-- Order Management Section -->
    <EcomOrderTable
      v-model:search="orderSearch"
      v-model:filter="orderFilter"
      v-model:startDate="exportStartDate"
      v-model:endDate="exportEndDate"
      v-model:bulkAction="bulkAction"
      v-model:page="orderPage"
      :orders="pagedOrders"
      :total-items="filteredOrders.length"
      :total-pages="totalOrderPages"
      :selected-ids="selectedOrderIds"
      :status-class="statusClass"
      :payment-class="paymentClass"
      :can-confirm="canConfirmOrder"
      @toggle-select="(id) => toggleOrderSelectionById(id)"
      @run-bulk="runBulkAction"
      @view="openOrderDetail"
      @confirm="confirmOrder"
      @sync="syncMidtrans"
      @export="exportCsv"
    />

    <!-- Modals -->
    <EcomProductEditModal
      :product="editingProduct"
      @close="closeProductEdit"
      @save="saveProductEcommerce(editingProduct)"
      @add-variant="addVariantRow"
      @remove-variant="(idx) => removeVariantRow(editingProduct, idx)"
    />

    <EcomOrderModal
      :order="selectedOrder"
      :status-class="statusClass"
      :payment-class="paymentClass"
      :format-date="formatDate"
      @close="selectedOrder = null"
      @copy-id="copyOrderId"
    />

    <AssetModal
      v-if="showBannerAssetModal"
      :show="showBannerAssetModal"
      title="Pilih Gambar Banner Carousel"
      :assets="assets"
      @select-asset="applyBannerAsset"
      @close="closeBannerAssetModal"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import AssetModal from "@/components/cms/AssetModal.vue";

// New Components
import EcomDashboard from "@/components/cms/ecommerce/EcomDashboard.vue";
import EcomPaymentConfig from "@/components/cms/ecommerce/EcomPaymentConfig.vue";
import EcomBannerManager from "@/components/cms/ecommerce/EcomBannerManager.vue";
import EcomProductManager from "@/components/cms/ecommerce/EcomProductManager.vue";
import EcomOrderTable from "@/components/cms/ecommerce/EcomOrderTable.vue";
import EcomProductEditModal from "@/components/cms/ecommerce/EcomProductEditModal.vue";
import EcomOrderModal from "@/components/cms/ecommerce/EcomOrderModal.vue";

const config = reactive<any>({
  enabled: false,
  shopTitle: "Shop",
  shopDescription: "",
  payment: { merchantId: "", clientKey: "", serverKey: "", isProduction: false },
});
const products = ref<any[]>([]);
const orders = ref<any[]>([]);
const assets = ref<any[]>([]);
const webhookUrl = `${window.location.origin}/api/ecommerce/midtrans/webhook`;
const orderSearch = ref("");
const orderFilter = ref("");
const orderPage = ref(1);
const orderPageSize = 10;
const selectedOrder = ref<any>(null);
const selectedOrderIds = ref<string[]>([]);
const bulkAction = ref("");
const exportStartDate = ref("");
const exportEndDate = ref("");
const showBannerAssetModal = ref(false);
const activeBannerIndex = ref<number | null>(null);
const productFilter = ref("");
const productPage = ref(1);
const productPageSize = 10;
const selectedProductIds = ref<string[]>([]);
const bulkProductAction = ref("");
const editingProduct = ref<any>(null);

const stats = computed(() => ({
  selling: products.value.filter((p) => p.ecommerce?.sellingEnabled).length,
  stock: products.value.reduce((a, p) => a + Number(p.ecommerce?.stock || 0), 0),
  pending: orders.value.filter((o) => o.orderStatus !== "confirmed").length,
}));

const filteredOrders = computed(() => {
  const q = orderSearch.value.trim().toLowerCase();
  return orders.value.filter((o) => {
    if (orderFilter.value && o.orderStatus !== orderFilter.value) return false;
    if (!q) return true;
    const hay = `${o.orderId || ""} ${o.customer?.name || ""}`.toLowerCase();
    return hay.includes(q);
  });
});

const totalOrderPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / orderPageSize)));
const pagedOrders = computed(() => {
  const start = (orderPage.value - 1) * orderPageSize;
  return filteredOrders.value.slice(start, start + orderPageSize);
});

const filteredProductCards = computed(() => {
  const q = productFilter.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter((p) => `${p?.name || ""}`.toLowerCase().includes(q));
});

const totalProductPages = computed(() => Math.max(1, Math.ceil(filteredProductCards.value.length / productPageSize)));
const pagedProducts = computed(() => {
  const start = (productPage.value - 1) * productPageSize;
  return filteredProductCards.value.slice(start, start + productPageSize);
});

const salesByDay = computed(() => {
  const map = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders.value) {
    if (o.paymentStatus !== "paid") continue;
    const key = new Date(o.createdAt || Date.now()).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(o.totalAmount || 0));
  }
  const values = Array.from(map.values());
  const max = Math.max(1, ...values);
  return Array.from(map.entries()).map(([k, v]) => ({
    label: k.slice(5),
    value: v,
    height: Math.max(6, Math.round((v / max) * 100)),
  }));
});

const salesByWeek = computed(() => {
  const list: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const value = orders.value
      .filter((o) => o.paymentStatus === "paid")
      .filter((o) => {
        const c = new Date(o.createdAt || Date.now());
        return c >= start && c < end;
      })
      .reduce((a, o) => a + Number(o.totalAmount || 0), 0);
    list.push({ label: `W${8 - i}`, value });
  }
  const max = Math.max(1, ...list.map((x) => x.value));
  return list.map((x) => ({ ...x, height: Math.max(6, Math.round((x.value / max) * 100)) }));
});

async function loadAll() {
  const [cfg, prods, ords, ast] = await Promise.all([
    api.get("/ecommerce/config"),
    api.get("/ecommerce/products-admin"),
    api.get("/ecommerce/orders"),
    api.get("/assets"),
  ]);
  Object.assign(config, cfg.data);
  if (!Array.isArray(config.carouselBanners)) config.carouselBanners = [];
  config.carouselBanners = config.carouselBanners.map((banner: any) => ({
    ...banner,
    productIds: Array.isArray(banner?.productIds)
      ? banner.productIds.map((id: any) => String(id || "")).filter(Boolean)
      : [],
  }));
  products.value = (prods.data || []).map((p: any) => ({
    ...p,
    _variantRows: Array.isArray(p.ecommerce?.variants)
      ? p.ecommerce.variants.map((v: any) => ({
          key: String(v.key || ""),
          values: Array.isArray(v.values) ? v.values.join(",") : "",
        }))
      : [],
  }));
  orders.value = ords.data || [];
  assets.value = ast.data || [];
}

function addBanner() {
  if (!Array.isArray(config.carouselBanners)) config.carouselBanners = [];
  config.carouselBanners.push({
    imageAssetId: "",
    title: "",
    subtitle: "",
    productIds: [],
    filterType: "featured",
  });
}

function removeBanner(idx: number) {
  if (!Array.isArray(config.carouselBanners)) return;
  config.carouselBanners.splice(idx, 1);
}

function getAssetUrl(assetId?: string) {
  if (!assetId) return "";
  return assets.value.find((a) => a._id === assetId)?.url || "";
}

function getAssetName(assetId?: string) {
  if (!assetId) return "";
  const found = assets.value.find((a) => a._id === assetId);
  return found?.originalName || found?.filename || found?._id || "";
}

function openBannerAssetModal(idx: number) {
  activeBannerIndex.value = idx;
  showBannerAssetModal.value = true;
}

function closeBannerAssetModal() {
  showBannerAssetModal.value = false;
  activeBannerIndex.value = null;
}

function applyBannerAsset(asset: any) {
  if (activeBannerIndex.value === null) return;
  if (!Array.isArray(config.carouselBanners)) config.carouselBanners = [];
  if (!config.carouselBanners[activeBannerIndex.value]) return;
  config.carouselBanners[activeBannerIndex.value].imageAssetId = String(asset?._id || "");
  closeBannerAssetModal();
}

async function saveConfig() {
  await api.post("/ecommerce/config", config);
  await Swal.fire({ icon: "success", title: "Konfigurasi ecommerce tersimpan", timer: 1200, showConfirmButton: false });
}

async function saveProductEcommerce(p: any, silent = false) {
  const variants = (p._variantRows || [])
    .map((row: any) => ({
      key: String(row.key || "").trim(),
      values: String(row.values || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    }))
    .filter((row: any) => row.key && row.values.length);
  await api.put(`/ecommerce/products/${p._id}`, {
    sellingEnabled: !!p.ecommerce.sellingEnabled,
    featured: !!p.ecommerce.featured,
    highlightText: p.ecommerce.highlightText || "",
    stock: Number(p.ecommerce.stock || 0),
    variants,
    discount: p.ecommerce.discount || {},
  });
  if (!silent) {
    await Swal.fire({ icon: "success", title: "Produk ecommerce tersimpan", timer: 1000, showConfirmButton: false });
  }
}

function openProductEdit(p: any) {
  editingProduct.value = p;
}

function closeProductEdit() {
  editingProduct.value = null;
  loadAll(); // Reload to refresh any partial changes
}

async function runBulkProductAction() {
  if (!bulkProductAction.value || selectedProductIds.value.length === 0) return;
  
  const action = bulkProductAction.value;
  const ids = [...selectedProductIds.value];
  
  if (action === 'delete') {
    const res = await Swal.fire({
      title: 'Hapus Pengaturan?',
      text: 'Anda akan menghapus data ecommerce untuk produk terpilih.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus'
    });
    if (!res.isConfirmed) return;
  }

  // Implementation varies - usually simpler to loop or use a bulk endpoint
  // For now, let's just loop saveProductEcommerce silent for toggles if no dedicated endpoint
  if (action === 'enable' || action === 'disable') {
    for (const id of ids) {
      const p = products.value.find(prod => prod._id === id);
      if (p) {
        p.ecommerce.sellingEnabled = (action === 'enable');
        await saveProductEcommerce(p, true);
      }
    }
    await Swal.fire({ icon: "success", title: "Berhasil diperbarui", timer: 1000, showConfirmButton: false });
  }
  
  selectedProductIds.value = [];
  bulkProductAction.value = "";
  await loadAll();
}

function toggleSelectAllProducts() {
  if (selectedProductIds.value.length === pagedProducts.value.length) {
    selectedProductIds.value = [];
  } else {
    selectedProductIds.value = pagedProducts.value.map(p => p._id);
  }
}

function toggleProductSelectionById(id: string) {
  const idx = selectedProductIds.value.indexOf(id);
  if (idx > -1) selectedProductIds.value.splice(idx, 1);
  else selectedProductIds.value.push(id);
}

function toggleOrderSelectionById(id: string) {
  const idx = selectedOrderIds.value.indexOf(id);
  if (idx > -1) selectedOrderIds.value.splice(idx, 1);
  else selectedOrderIds.value.push(id);
}

async function toggleProductStatus(p: any) {
  p.ecommerce.sellingEnabled = !p.ecommerce.sellingEnabled;
  await saveProductEcommerce(p, true);
}

function addVariantRow(p: any) {
  if (!Array.isArray(p._variantRows)) p._variantRows = [];
  p._variantRows.push({ key: "", values: "" });
}

function removeVariantRow(p: any, idx: number) {
  if (!Array.isArray(p._variantRows)) return;
  p._variantRows.splice(idx, 1);
}

async function confirmOrder(order: any) {
  await api.patch(`/ecommerce/orders/${order._id}/confirm`);
  await loadAll();
}

function canConfirmOrder(order: any) {
  const status = String(order?.orderStatus || "");
  return status === "pending_confirmation";
}

function statusClass(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "ok";
  if (s === "shipped") return "info";
  if (s === "cancelled" || s === "expired") return "danger";
  return "warn";
}

function paymentClass(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "ok";
  if (s === "pending") return "warn";
  if (s === "cancelled" || s === "failed" || s === "expired") return "danger";
  return "info";
}

async function copyOrderId(orderId?: string) {
  const value = String(orderId || "").trim();
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    await Swal.fire({ icon: "success", title: "Order ID disalin", timer: 900, showConfirmButton: false });
  } catch {
    await Swal.fire("Gagal", "Tidak bisa menyalin Order ID.", "error");
  }
}

async function syncMidtrans(order: any) {
  try {
    await api.post(`/ecommerce/orders/${order._id}/sync-midtrans`);
    await loadAll();
    await Swal.fire({ icon: "success", title: "Status Midtrans tersinkron", timer: 1200, showConfirmButton: false });
  } catch (err: any) {
    await Swal.fire("Gagal sync", err?.response?.data?.error || "Tidak dapat sync Midtrans", "error");
  }
}

async function openOrderDetail(order: any) {
  const res = await api.get(`/ecommerce/orders/${order._id}/detail`);
  selectedOrder.value = res.data;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

async function exportCsv() {
  const params = new URLSearchParams();
  if (orderFilter.value) params.set("status", orderFilter.value);
  if (exportStartDate.value) params.set("startDate", exportStartDate.value);
  if (exportEndDate.value) params.set("endDate", exportEndDate.value);
  const query = params.toString();
  const res = await api.get(`/ecommerce/orders-export.csv${query ? `?${query}` : ""}`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ecommerce-orders-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function runBulkAction() {
  if (!bulkAction.value || selectedOrderIds.value.length === 0) return;
  try {
    await api.post("/ecommerce/orders/bulk-action", {
      ids: selectedOrderIds.value,
      action: bulkAction.value,
    });
    selectedOrderIds.value = [];
    bulkAction.value = "";
    await loadAll();
    await Swal.fire({ icon: "success", title: "Bulk action berhasil", timer: 1100, showConfirmButton: false });
  } catch (err: any) {
    await Swal.fire("Gagal", err?.response?.data?.error || "Gagal menjalankan bulk action", "error");
  }
}

onMounted(loadAll);
</script>

<style scoped>
.ecom-cms { display: grid; gap: 0.75rem; padding: 0.75rem; }
.head { display: flex; justify-content: space-between; align-items: flex-start; }
.split-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.75rem; }

@media (max-width: 1200px) { .split-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) { 
  .ecom-cms { padding: 0.4rem; }
}
</style>
