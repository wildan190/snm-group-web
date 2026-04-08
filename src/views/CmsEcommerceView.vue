<template>
  <div class="ecom-cms">
    <div class="card head">
      <div>
        <h1 class="page-title">Ecommerce Module</h1>
        <p class="text-slate-500">Kelola selling, stok, variant, discount, Midtrans, dan order.</p>
      </div>
      <button class="btn-secondary" @click="loadAll">Refresh</button>
    </div>

    <div class="card section">
      <h3>Dashboard Ecommerce</h3>
      <div class="stats">
        <div class="stat"><span>Produk Selling</span><strong>{{ stats.selling }}</strong></div>
        <div class="stat"><span>Total Stock</span><strong>{{ stats.stock }}</strong></div>
        <div class="stat"><span>Order Pending</span><strong>{{ stats.pending }}</strong></div>
        <div class="stat"><span>Total Order</span><strong>{{ orders.length }}</strong></div>
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

    <div class="split-grid">
      <div class="card section">
        <h3>Payment Gateway (Midtrans)</h3>
        <p class="text-slate-500 mb-3">Webhook URL: <code>{{ webhookUrl }}</code></p>
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

          <div class="grid grid-2 compact-grid">
            <label class="form-field"><span>Shop Title</span><input v-model="config.shopTitle" /></label>
            <label class="form-field"><span>Shop Description</span><input v-model="config.shopDescription" /></label>
            <label class="form-field"><span>Merchant ID</span><input v-model="config.payment.merchantId" /></label>
            <label class="form-field"><span>Client Key</span><input v-model="config.payment.clientKey" /></label>
            <label class="form-field" style="grid-column: 1 / -1;"><span>Server Key</span><input v-model="config.payment.serverKey" /></label>
          </div>
        </div>
        <button class="btn-primary mt-4" @click="saveConfig">Simpan Konfigurasi Ecommerce</button>
      </div>

      <div class="card section">
        <div class="carousel-head">
          <div>
            <h3>Carousel Iklan Ecommerce</h3>
            <p class="text-slate-500">Klik slide pada halaman shop akan memfilter produk sesuai program iklan.</p>
          </div>
          <div class="carousel-head-actions">
            <span class="carousel-count">{{ Array.isArray(config.carouselBanners) ? config.carouselBanners.length : 0 }} Banner</span>
            <button class="btn-secondary" @click="addBanner">+ Tambah Banner</button>
          </div>
        </div>
        <div class="banner-list">
          <div class="banner-row" v-for="(banner, idx) in config.carouselBanners" :key="idx">
            <div class="banner-card">
              <div class="banner-card-top">
                <span class="banner-index">Banner {{ Number(idx) + 1 }}</span>
                <button class="btn-ghost danger" @click="removeBanner(Number(idx))">Hapus</button>
              </div>

              <div class="banner-asset-cell">
                <img v-if="getAssetUrl(banner.imageAssetId)" :src="getAssetUrl(banner.imageAssetId)" alt="banner asset" class="banner-thumb" />
                <div class="banner-asset-actions">
                  <button class="btn-secondary" @click="openBannerAssetModal(Number(idx))">Pilih dari Media Library</button>
                  <small>{{ getAssetName(banner.imageAssetId) || "Belum ada gambar dipilih" }}</small>
                </div>
              </div>

              <div class="banner-form-grid">
                <input v-model="banner.title" placeholder="Judul banner" />
                <input v-model="banner.subtitle" placeholder="Subtitle banner" />
                <select v-model="banner.filterType">
                  <option value="featured">Produk Featured</option>
                  <option value="discount">Produk Diskon</option>
                  <option value="inStock">Stok Tersedia</option>
                  <option value="latest">Produk Terbaru</option>
                </select>
                <select multiple v-model="banner.productIds" class="banner-product-select">
                  <option v-for="p in products" :key="p._id" :value="String(p._id)">{{ p.name }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="banner-actions">
          <button class="btn-primary mt-2" @click="saveConfig">Simpan Carousel</button>
        </div>
      </div>
    </div>

    <div class="card section">
      <div class="product-head">
        <h3>Product Selling, Stock, Variant, Discount</h3>
        <input v-model="productFilter" placeholder="Cari produk..." class="product-search" />
      </div>
      <div class="product-cards">
        <article v-for="p in filteredProductCards" :key="p._id" class="product-config-card">
          <div class="product-config-top">
            <div>
              <h4>{{ p.name }}</h4>
              <p class="text-slate-500 text-sm">Kelola pengaturan jual untuk produk ini</p>
            </div>
            <button class="btn-primary" @click="saveProductEcommerce(p)">Simpan</button>
          </div>

          <div class="product-config-grid">
            <label class="toggle-item">
              <span>Aktif Dijual</span>
              <input type="checkbox" v-model="p.ecommerce.sellingEnabled" />
            </label>
            <label class="toggle-item">
              <span>Highlight</span>
              <input type="checkbox" v-model="p.ecommerce.featured" />
            </label>
            <label class="form-field">
              <span>Label Highlight</span>
              <input v-model="p.ecommerce.highlightText" placeholder="Contoh: Best Seller" />
            </label>
            <label class="form-field">
              <span>Stock</span>
              <input type="number" min="0" v-model.number="p.ecommerce.stock" />
            </label>
          </div>

          <div class="discount-box">
            <div class="discount-head">
              <h5>Discount + Schedule</h5>
              <label><input type="checkbox" v-model="p.ecommerce.discount.enabled" /> Aktifkan Diskon</label>
            </div>
            <div class="discount-grid">
              <select v-model="p.ecommerce.discount.type">
                <option value="percent">Persen (%)</option>
                <option value="fixed">Fixed (IDR)</option>
              </select>
              <input type="number" min="0" v-model.number="p.ecommerce.discount.value" placeholder="Nilai diskon" />
              <input type="datetime-local" v-model="p.ecommerce.discount.startAt" />
              <input type="datetime-local" v-model="p.ecommerce.discount.endAt" />
            </div>
          </div>

          <div class="variant-box">
            <div class="variant-head">
              <h5>Variant Builder</h5>
              <button class="btn-secondary" @click="addVariantRow(p)">+ Variant</button>
            </div>
            <div class="variant-list">
              <div v-for="(v, idx) in p._variantRows" :key="idx" class="variant-row">
                <input v-model="v.key" placeholder="Contoh: Size" />
                <input v-model="v.values" placeholder="Contoh: S,M,L" />
                <button class="btn-ghost danger" @click="removeVariantRow(p, Number(idx))">x</button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="card section">
      <div class="order-head">
        <div class="order-head-left">
          <h3>Order List / History / Confirmation</h3>
          <span class="order-count">{{ filteredOrders.length }} order</span>
        </div>
        <button class="btn-secondary" @click="exportCsv">Export CSV</button>
      </div>
      <div class="order-toolbar card-soft">
        <input v-model="orderSearch" placeholder="Cari order id / customer..." />
        <select v-model="orderFilter">
          <option value="">Semua Status</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <input type="date" v-model="exportStartDate" />
        <input type="date" v-model="exportEndDate" />
        <select v-model="bulkAction">
          <option value="">Bulk Action</option>
          <option value="confirm">Confirm</option>
          <option value="cancel">Cancel</option>
          <option value="ship">Mark Shipped</option>
        </select>
        <button class="btn-secondary" @click="runBulkAction" :disabled="!bulkAction || selectedOrderIds.length === 0">Apply</button>
      </div>
      <div class="table-wrap">
        <table class="mini-table">
          <thead><tr><th></th><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="o in pagedOrders" :key="o._id">
              <td><input type="checkbox" :value="o._id" v-model="selectedOrderIds" /></td>
              <td>{{ o.orderId }}</td>
              <td>{{ o.customer?.name || "Guest" }}</td>
              <td>Rp {{ Number(o.totalAmount || 0).toLocaleString("id-ID") }}</td>
              <td><span class="status-chip" :class="statusClass(o.orderStatus)">{{ o.orderStatus }}</span></td>
              <td><span class="status-chip payment" :class="paymentClass(o.paymentStatus)">{{ o.paymentStatus }}</span></td>
              <td>
                <button class="btn-ghost" @click="openOrderDetail(o)">Detail</button>
                <button v-if="canConfirmOrder(o)" class="btn-secondary" @click="confirmOrder(o)">Confirm</button>
                <button class="btn-ghost" @click="syncMidtrans(o)">Sync Midtrans</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button class="btn-secondary" :disabled="orderPage <= 1" @click="orderPage--">Prev</button>
        <span>Page {{ orderPage }} / {{ totalOrderPages }}</span>
        <button class="btn-secondary" :disabled="orderPage >= totalOrderPages" @click="orderPage++">Next</button>
      </div>
    </div>

    <div v-if="selectedOrder" class="modal-overlay" @click="selectedOrder = null">
      <div class="modal-content" @click.stop>
        <div class="modal-head">
          <div class="order-modal-head">
            <div>
              <p class="text-xs text-slate-500">Order Detail</p>
              <h3>{{ selectedOrder.orderId }}</h3>
            </div>
            <div class="order-status-pills">
              <span class="status-chip" :class="statusClass(selectedOrder.orderStatus)">{{ selectedOrder.orderStatus }}</span>
              <span class="status-chip payment" :class="paymentClass(selectedOrder.paymentStatus)">{{ selectedOrder.paymentStatus }}</span>
            </div>
          </div>
          <button class="modal-close-btn" @click="selectedOrder = null">×</button>
        </div>

        <div class="modal-body">
          <div class="order-meta-grid">
            <div class="meta-card">
              <span>Customer</span>
              <strong>{{ selectedOrder.customer?.name || "-" }}</strong>
            </div>
            <div class="meta-card">
              <span>Email</span>
              <strong>{{ selectedOrder.customer?.email || "-" }}</strong>
            </div>
            <div class="meta-card">
              <span>Phone</span>
              <strong>{{ selectedOrder.customer?.phone || "-" }}</strong>
            </div>
            <div class="meta-card">
              <span>Total</span>
              <strong>Rp {{ Number(selectedOrder.totalAmount || 0).toLocaleString("id-ID") }}</strong>
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
                  <tr v-for="(it, idx) in selectedOrder.items || []" :key="idx">
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
              <li v-for="(h, idx) in selectedOrder.statusHistory || []" :key="idx" class="timeline-item">
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
          <button class="btn-ghost" @click="copyOrderId(selectedOrder.orderId)">Copy Order ID</button>
          <button class="btn-secondary" @click="selectedOrder = null">Tutup</button>
        </div>
      </div>
    </div>

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

async function saveProductEcommerce(p: any) {
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
  await Swal.fire({ icon: "success", title: "Produk ecommerce tersimpan", timer: 1000, showConfirmButton: false });
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
.section { padding: 0.85rem; }
.section h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.split-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 0.75rem; }
.payment-panel { display: grid; gap: 0.6rem; }
.switch-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.switch-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; background: #fff; }
.switch-card strong { font-size: 0.88rem; color: #0f172a; }
.switch-card p { margin-top: 0.15rem; font-size: 0.78rem; color: #64748b; line-height: 1.45; }
.switch-card input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--primary); }
.compact-grid { gap: 0.45rem; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
.stat { padding: 0.65rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; }
.stat span { color: #64748b; font-size: 0.8rem; }
.charts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 0.9rem; }
.bars { height: 124px; display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 0.3rem; align-items: end; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.45rem; }
.bar-col { display: grid; gap: 0.25rem; justify-items: center; }
.bar { width: 100%; border-radius: 6px; background: var(--primary); min-height: 6px; }
.bar.alt { background: #22c55e; }
.table-wrap { overflow-x: auto; }
.mini-table { width: 100%; border-collapse: collapse; }
.mini-table th,.mini-table td { border-bottom: 1px solid #f1f5f9; padding: 0.5rem 0.55rem; vertical-align: top; font-size: 0.84rem; }
.product-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.65rem; }
.product-search { max-width: 260px; }
.product-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
.product-config-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; background: #fff; display: grid; gap: 0.65rem; }
.product-config-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; }
.product-config-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.45rem; }
.toggle-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.5rem 0.6rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem; color: #334155; }
.discount-box, .variant-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.55rem; }
.discount-head, .variant-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; gap: 0.6rem; }
.discount-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.4rem; }
.variant-list { display: grid; gap: 0.35rem; min-width: 260px; }
.variant-row { display: grid; grid-template-columns: 120px 1fr auto; gap: 0.35rem; align-items: center; }
.banner-list { display: grid; gap: 0.5rem; }
.carousel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.55rem; }
.carousel-head-actions { display: flex; align-items: center; gap: 0.5rem; }
.carousel-count { font-size: 0.78rem; border: 1px solid #dbeafe; color: #1d4ed8; background: #eff6ff; border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; }
.banner-row { display: block; }
.banner-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.65rem; background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%); display: grid; gap: 0.55rem; }
.banner-card-top { display: flex; justify-content: space-between; align-items: center; }
.banner-index { font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--primary); }
.banner-asset-cell { display: grid; grid-template-columns: 130px 1fr; gap: 0.55rem; align-items: center; }
.banner-thumb { width: 130px; height: 76px; object-fit: cover; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; }
.banner-asset-actions { display: grid; gap: 0.25rem; }
.banner-form-grid { display: grid; grid-template-columns: 1fr 1fr 220px; gap: 0.45rem; align-items: start; }
.banner-product-select { min-height: 84px; }
.banner-actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
.order-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
.order-head-left { display: flex; align-items: center; gap: 0.5rem; }
.order-count { font-size: 0.78rem; border: 1px solid #dbeafe; color: #1d4ed8; background: #eff6ff; border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; }
.order-toolbar { display: grid; grid-template-columns: minmax(200px,1fr) repeat(2, minmax(130px, 180px)) minmax(130px, 160px) auto auto; gap: 0.4rem; margin-bottom: 0.55rem; }
.status-chip { display: inline-block; border-radius: 999px; padding: 0.12rem 0.5rem; font-size: 0.74rem; font-weight: 700; text-transform: capitalize; }
.status-chip.ok { background: #dcfce7; color: #166534; }
.status-chip.warn { background: #fef9c3; color: #854d0e; }
.status-chip.info { background: #dbeafe; color: #1d4ed8; }
.status-chip.danger { background: #fee2e2; color: #b91c1c; }
.status-chip.payment { text-transform: uppercase; }
.pager { margin-top: 0.75rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
.modal-content { background: white; border-radius: 14px; max-width: 760px; width: 100%; max-height: 85vh; overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; border: 1px solid #e2e8f0; }
.modal-head { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; gap: 0.7rem; align-items: flex-start; background: linear-gradient(135deg, #ffffff 0%, #f7f9ff 100%); }
.order-modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; width: 100%; }
.modal-close-btn { width: 34px; height: 34px; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-size: 1.2rem; line-height: 1; cursor: pointer; }
.modal-body { padding: 0.85rem 1rem; overflow-y: auto; }
.order-status-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.order-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem; }
.meta-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.55rem 0.65rem; display: grid; gap: 0.2rem; }
.meta-card span { font-size: 0.74rem; color: #64748b; }
.meta-card strong { color: #0f172a; }
.order-modal-section { margin-top: 0.6rem; }
.order-modal-section h4 { margin-bottom: 0.45rem; }
.timeline-list { list-style: none; display: grid; gap: 0.45rem; }
.timeline-item { display: grid; grid-template-columns: 16px 1fr; gap: 0.45rem; align-items: start; }
.timeline-dot { width: 10px; height: 10px; border-radius: 999px; background: var(--primary); margin-top: 0.35rem; }
.timeline-content { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.6rem; }
.timeline-top { display: flex; justify-content: space-between; gap: 0.6rem; align-items: center; margin-bottom: 0.2rem; }
.timeline-content p { color: #475569; margin: 0; font-size: 0.84rem; }
.modal-footer { padding: 0.75rem 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; background: #fafcff; }
@media (max-width: 1200px) { .split-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) { .stats { grid-template-columns: 1fr 1fr; } .order-toolbar { grid-template-columns: 1fr; } .charts { grid-template-columns: 1fr; } .product-cards { grid-template-columns: 1fr; } .product-config-grid { grid-template-columns: 1fr; } .discount-grid { grid-template-columns: 1fr; } .switch-grid { grid-template-columns: 1fr; } .carousel-head { flex-direction: column; } .banner-asset-cell { grid-template-columns: 1fr; } .banner-thumb { width: 100%; height: 170px; } .banner-form-grid { grid-template-columns: 1fr; } .order-meta-grid { grid-template-columns: 1fr; } .timeline-top { flex-direction: column; align-items: flex-start; } }
</style>
