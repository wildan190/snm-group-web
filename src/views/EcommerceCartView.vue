<template>
  <section class="section">
    <div class="container cart-page">
      <div class="card">
        <div class="cart-header">
          <div>
            <h1 class="page-title">Keranjang Belanja</h1>
            <p class="muted">Periksa item dan lanjutkan checkout.</p>
          </div>
          <router-link class="btn-ghost" to="/shop">Lanjut Belanja</router-link>
        </div>

        <div v-if="!cart.length" class="empty-cart">
          <p>Keranjang masih kosong.</p>
          <router-link class="btn-primary" to="/shop">Belanja Sekarang</router-link>
        </div>

        <template v-else>
          <div
            class="cart-item"
            v-for="item in cart"
            :key="`${item.productId}-${JSON.stringify(item.variant || {})}`"
          >
            <img v-if="item.imageAssetId" :src="assetUrl(item.imageAssetId)" :alt="item.name" />
            <div class="item-info">
              <strong>{{ item.name }}</strong>
              <small v-if="Object.keys(item.variant || {}).length">{{ formatVariant(item.variant) }}</small>
              <p>Rp {{ Number(item.unitPrice || 0).toLocaleString("id-ID") }}</p>
            </div>
            <div class="item-actions">
              <button class="btn-ghost" @click="decreaseQty(item)">-</button>
              <span>{{ item.qty }}</span>
              <button class="btn-ghost" @click="increaseQty(item)">+</button>
              <button class="btn-ghost danger" @click="removeCartItem(item)">Hapus</button>
            </div>
          </div>
        </template>
      </div>

      <aside class="card checkout-card" v-if="cart.length">
        <h3>Checkout</h3>
        <label class="form-field"><span>Nama</span><input v-model="customer.name" /></label>
        <label class="form-field"><span>Email</span><input v-model="customer.email" /></label>
        <label class="form-field"><span>Phone</span><input v-model="customer.phone" /></label>
        <label class="form-field"><span>Alamat</span><textarea rows="3" v-model="customer.address"></textarea></label>

        <div class="checkout-total">Total: <strong>Rp {{ Number(cartTotal).toLocaleString("id-ID") }}</strong></div>
        <button class="btn-primary w-full" @click="checkout">Buat Order</button>
        <p v-if="orderId" class="mt-3">Order ID: <strong>{{ orderId }}</strong></p>
        <a v-if="redirectUrl" :href="redirectUrl" target="_blank" class="btn-secondary w-full mt-2">Bayar Sekarang</a>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { useShopCart } from "@/composables/useShopCart";

const assets = ref<any[]>([]);
const customer = ref({ name: "", email: "", phone: "", address: "" });
const orderId = ref("");
const redirectUrl = ref("");

const { cart, cartTotal, decreaseQty, increaseQty, removeCartItem, clearCart, formatVariant } = useShopCart();

function assetUrl(assetId: string) {
  return assets.value.find((a) => a._id === assetId)?.url || "";
}

async function checkout() {
  if (!cart.value.length) return;
  try {
    const res = await api.post("/ecommerce/orders", {
      items: cart.value,
      customer: customer.value,
    });
    orderId.value = res.data.orderId;
    redirectUrl.value = res.data.payment?.redirectUrl || "";
    clearCart();
    await Swal.fire("Order dibuat", `Order ID: ${orderId.value}`, "success");
  } catch (err: any) {
    await Swal.fire("Gagal", err?.response?.data?.error || "Gagal checkout", "error");
  }
}

onMounted(async () => {
  const ast = await api.get("/assets");
  assets.value = ast.data || [];
});
</script>

<style scoped>
.cart-page { display: grid; grid-template-columns: 1fr 340px; gap: 1rem; }
.cart-header { display: flex; justify-content: space-between; gap: 0.8rem; align-items: center; margin-bottom: 1rem; }
.muted { color: #64748b; margin-bottom: 1rem; }
.empty-cart { display: grid; gap: 0.8rem; justify-items: start; }
.cart-item { display: grid; grid-template-columns: 88px 1fr auto; gap: 0.8rem; align-items: center; border-bottom: 1px dashed #e2e8f0; padding: 0.9rem 0; }
.cart-item img { width: 88px; height: 88px; object-fit: cover; border-radius: 10px; background: #f8fafc; }
.item-info { display: grid; gap: 0.2rem; }
.item-actions { display: flex; align-items: center; gap: 0.35rem; }
.checkout-card { position: sticky; top: 90px; height: fit-content; display: grid; gap: 0.55rem; border: 1px solid #e2e8f0; }
.checkout-total { margin: 0.5rem 0; border-top: 1px solid #e2e8f0; padding-top: 0.6rem; }
@media (max-width: 900px) {
  .cart-page { grid-template-columns: 1fr; }
  .checkout-card { position: static; }
  .cart-item { grid-template-columns: 74px 1fr; }
  .item-actions { grid-column: 1 / -1; }
  .cart-header { flex-direction: column; align-items: flex-start; }
}
</style>
