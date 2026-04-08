import { ref } from "vue";
import api from "@/utils/api";
import type { Product } from "@/types/pageTypes";

export function useProducts() {
  const products = ref<Product[]>([]);

  async function loadProducts(): Promise<void> {
    const res = await api.get("/products");
    products.value = res.data;
  }

  function getProductName(productId: string): string {
    const product = products.value.find((p) => p._id === productId);
    return product ? product.name : "";
  }

  function getProductDescription(productId: string): string {
    const product = products.value.find((p) => p._id === productId);
    return product ? product.description : "";
  }

  function getProductImage(productId: string, getAssetUrl: (id: string) => string): string {
    const product = products.value.find((p) => p._id === productId);
    return product?.imageAssetId ? getAssetUrl(product.imageAssetId) : "";
  }

  function getProductPrice(productId: string): string {
    const product = products.value.find((p) => p._id === productId);
    return product?.price || "0";
  }

  return {
    products,
    loadProducts,
    getProductName,
    getProductDescription,
    getProductImage,
    getProductPrice,
  };
}