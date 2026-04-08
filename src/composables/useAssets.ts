import { ref } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import type { Asset } from "@/types/pageTypes";

export function useAssets() {
  const assets = ref<Asset[]>([]);
  const selectedFile = ref<File | null>(null);

  async function loadAssets(): Promise<void> {
    const res = await api.get("/assets");
    assets.value = res.data;
  }

  function getAssetUrl(assetId: string): string {
    const asset = assets.value.find((item) => item._id === assetId);
    return asset ? asset.url : "";
  }

  function getAssetName(assetId: string): string {
    const asset = assets.value.find((item) => item._id === assetId);
    return asset ? asset.originalName : "Pilih gambar";
  }

  function onAssetFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    selectedFile.value = target.files?.[0] ?? null;
  }

  async function uploadAsset(): Promise<void> {
    if (!selectedFile.value) {
      await Swal.fire({
        icon: "warning",
        title: "Pilih file terlebih dahulu",
        confirmButtonText: "OK",
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile.value);
    await api.post("/assets", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    selectedFile.value = null;
    await loadAssets();
  }

  return {
    assets,
    selectedFile,
    loadAssets,
    getAssetUrl,
    getAssetName,
    onAssetFileChange,
    uploadAsset,
  };
}