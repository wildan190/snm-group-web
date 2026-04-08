import { computed, ref, watch } from "vue";

type VariantMap = Record<string, string>;

export type CartItem = {
  productId: string;
  name: string;
  qty: number;
  variant: VariantMap;
  unitPrice: number;
  imageAssetId?: string;
};

const STORAGE_KEY = "snm_shop_cart_v1";
const cart = ref<CartItem[]>([]);
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart.value = parsed
        .map((item) => ({
          productId: String(item?.productId || ""),
          name: String(item?.name || ""),
          qty: Math.max(1, Number(item?.qty || 1)),
          variant: item?.variant && typeof item.variant === "object" ? item.variant : {},
          unitPrice: Math.max(0, Number(item?.unitPrice || 0)),
          imageAssetId: item?.imageAssetId ? String(item.imageAssetId) : undefined,
        }))
        .filter((item) => item.productId);
    }
  } catch {
    cart.value = [];
  }
}

watch(
  cart,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore persistence errors silently.
    }
  },
  { deep: true },
);

function buildItemKey(productId: string, variant: VariantMap) {
  return `${productId}-${JSON.stringify(variant || {})}`;
}

export function useShopCart() {
  hydrate();

  const cartCount = computed(() => cart.value.reduce((sum, item) => sum + Number(item.qty || 0), 0));
  const cartTotal = computed(() =>
    cart.value.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0), 0),
  );

  function addToCart(payload: CartItem) {
    const key = buildItemKey(payload.productId, payload.variant || {});
    const existing = cart.value.find((item) => buildItemKey(item.productId, item.variant || {}) === key);
    if (existing) {
      existing.qty += Math.max(1, Number(payload.qty || 1));
      return;
    }
    cart.value.push({
      ...payload,
      qty: Math.max(1, Number(payload.qty || 1)),
      unitPrice: Math.max(0, Number(payload.unitPrice || 0)),
      variant: payload.variant || {},
    });
  }

  function removeCartItem(item: CartItem) {
    const key = buildItemKey(item.productId, item.variant || {});
    cart.value = cart.value.filter((it) => buildItemKey(it.productId, it.variant || {}) !== key);
  }

  function decreaseQty(item: CartItem) {
    const target = cart.value.find(
      (it) => buildItemKey(it.productId, it.variant || {}) === buildItemKey(item.productId, item.variant || {}),
    );
    if (!target) return;
    if (target.qty <= 1) {
      removeCartItem(target);
      return;
    }
    target.qty -= 1;
  }

  function increaseQty(item: CartItem) {
    const target = cart.value.find(
      (it) => buildItemKey(it.productId, it.variant || {}) === buildItemKey(item.productId, item.variant || {}),
    );
    if (!target) return;
    target.qty += 1;
  }

  function clearCart() {
    cart.value = [];
  }

  function formatVariant(variant: VariantMap) {
    return Object.entries(variant || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }

  return {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeCartItem,
    decreaseQty,
    increaseQty,
    clearCart,
    formatVariant,
  };
}
