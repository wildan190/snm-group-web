<template>
  <div class="cms-page-editor-view">
    <div class="page-header">
      <div>
        <h1>{{ isCreateMode ? "Create New Page" : "Edit Page" }}</h1>
        <p class="text-sm text-slate-500">Editor halaman terpisah dari daftar halaman.</p>
      </div>
      <router-link to="/cms/pages" class="btn btn-ghost">
        <Icon icon="lucide:arrow-left" class="mr-2" />
        Kembali ke Daftar
      </router-link>
    </div>

    <div class="editor-content">
      <PageForm
        v-if="current.blocks"
        :current="current"
        :new-block-type="newBlockType"
        :get-asset-url="getAssetUrl"
        :get-asset-name="getAssetName"
        :get-product-name="getProductName"
        :get-product-description="getProductDescription"
        :get-product-image="(id) => getProductImage(id, getAssetUrl)"
        :get-product-price="getProductPrice"
        @add-block="addBlock"
        @remove-block="removeBlock"
        @move-block-up="moveBlockUp"
        @move-block-down="moveBlockDown"
        @add-column="(block) => addColumn(block as Extract<PageBlock, { type: 'columns' }>)"
        @remove-column="(block, index) => removeColumn(block as Extract<PageBlock, { type: 'columns' }>, index)"
        @add-gallery-image="(block) => addGalleryImage(block as Extract<PageBlock, { type: 'gallery' }>)"
        @remove-gallery-image="(block, index) => removeGalleryImage(block as Extract<PageBlock, { type: 'gallery' }>, index)"
        @add-faq-item="(block) => addFaqItem(block as Extract<PageBlock, { type: 'faq' }>)"
        @remove-faq-item="(block, index) => removeFaqItem(block as Extract<PageBlock, { type: 'faq' }>, index)"
        @open-image-picker="openAssetModal"
        @open-gallery-picker="openAssetModalForGallery"
        @open-hero-bg-picker="(index) => openAssetModalForHero(index, 'background')"
        @open-hero-image-picker="(index) => openAssetModalForHero(index, 'image')"
        @open-product-modal="(block) => openProductModalForBlock(block as Extract<PageBlock, { type: 'product' }>)"
        @add-carousel-slide="(block: any) => addCarouselSlide(block as Extract<PageBlock, { type: 'carousel' }>)"
        @remove-carousel-slide="(block: any, index: number) => removeCarouselSlide(block as Extract<PageBlock, { type: 'carousel' }>, index)"
        @open-carousel-image-picker="(index: number, slideIndex: number) => openCarouselImagePicker(index, slideIndex)"
        @open-cta-bg-picker="(index: number) => openAssetModalForHero(index, 'background')"
        @add-block-to-column="addBlockToColumn"
        @remove-block-from-column="removeBlockFromColumn"
        @open-nested-image-picker="openAssetModalForNested"
        @update-new-block-type="updateNewBlockType"
        @open-og-image-picker="openOgImagePicker"
        @save-page="savePageAndStay"
      />
    </div>

    <ProductModal
      v-if="showProductModal"
      :show="showProductModal"
      :products="products"
      :selected-ids="currentProductBlock?.productIds || []"
      :get-asset-url="getAssetUrl"
      @toggle="toggleProductSelection"
      @save="closeProductModal"
      @close="closeProductModal"
    />

    <AssetModal
      v-if="showAssetModal"
      :show="showAssetModal"
      :title="'Pilih Asset'"
      :assets="assets"
      @select-asset="selectAsset"
      @upload="handleAssetUpload"
      @close="closeAssetModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import PageForm from "@/components/cms/PageForm.vue";
import ProductModal from "@/components/cms/ProductModal.vue";
import AssetModal from "@/components/cms/AssetModal.vue";
import { usePages } from "@/composables/usePages";
import { useProducts } from "@/composables/useProducts";
import { useAssets } from "@/composables/useAssets";
import type { Asset, PageBlock } from "@/types/pageTypes";

const route = useRoute();
const pageId = computed(() => String(route.params.id || ""));
const isCreateMode = computed(() => route.path.endsWith("/new"));

const {
  pages,
  current,
  newBlockType,
  loadPages,
  createPage,
  selectPage,
  addBlock,
  removeBlock,
  addColumn,
  removeColumn,
  addGalleryImage,
  removeGalleryImage,
  moveBlockUp,
  moveBlockDown,
  addFaqItem,
  removeFaqItem,
  addCarouselSlide,
  removeCarouselSlide,
  addBlockToColumn,
  removeBlockFromColumn,
  savePage,
} = usePages();
const { products, loadProducts, getProductName, getProductDescription, getProductImage, getProductPrice } = useProducts();
const { assets, loadAssets, getAssetUrl, getAssetName, uploadAsset, selectedFile: assetModalFile } = useAssets();

const showProductModal = ref(false);
const showAssetModal = ref(false);
const currentBlockIndex = ref<number | null>(null);
const currentGalleryIndex = ref<number | null>(null);
const currentSlideIndex = ref<number | null>(null);
const currentNestedColIndex = ref<number | null>(null);
const currentNestedIndex = ref<number | null>(null);
const currentHeroTarget = ref<"background" | "image" | null>(null);
const isOgImagePicker = ref(false);
const currentProductBlock = ref<Extract<PageBlock, { type: "product" }> | null>(null);

async function hydrateEditor() {
  await Promise.all([loadPages(), loadProducts(), loadAssets()]);
  if (isCreateMode.value) {
    const isDev = route.query.mode === "dev";
    createPage(isDev);
    return;
  }
  const target = pages.value.find((p) => String(p._id || "") === pageId.value);
  if (target) await selectPage(target);
}

function openProductModalForBlock(block: Extract<PageBlock, { type: "product" }>) {
  currentProductBlock.value = block;
  showProductModal.value = true;
}
function closeProductModal() {
  showProductModal.value = false;
  currentProductBlock.value = null;
}
function toggleProductSelection(productId: string) {
  if (!currentProductBlock.value) return;
  const index = currentProductBlock.value.productIds.indexOf(productId);
  if (index === -1) currentProductBlock.value.productIds.push(productId);
  else currentProductBlock.value.productIds.splice(index, 1);
}
function openAssetModal(blockIndex: number) {
  currentBlockIndex.value = blockIndex;
  showAssetModal.value = true;
}
function openAssetModalForGallery(blockIndex: number, galleryIndex: number) {
  currentBlockIndex.value = blockIndex;
  currentGalleryIndex.value = galleryIndex;
  showAssetModal.value = true;
}
function openAssetModalForHero(blockIndex: number, target: "background" | "image") {
  currentBlockIndex.value = blockIndex;
  currentHeroTarget.value = target;
  showAssetModal.value = true;
}
function openCarouselImagePicker(blockIndex: number, slideIndex: number) {
  currentBlockIndex.value = blockIndex;
  currentSlideIndex.value = slideIndex;
  showAssetModal.value = true;
}
function openAssetModalForNested(blockIndex: number, colIndex: number, nestedIndex: number) {
  currentBlockIndex.value = blockIndex;
  currentNestedColIndex.value = colIndex;
  currentNestedIndex.value = nestedIndex;
  showAssetModal.value = true;
}
function openOgImagePicker() {
  isOgImagePicker.value = true;
  showAssetModal.value = true;
}
function closeAssetModal() {
  showAssetModal.value = false;
  currentBlockIndex.value = null;
  currentGalleryIndex.value = null;
  currentSlideIndex.value = null;
  currentNestedColIndex.value = null;
  currentNestedIndex.value = null;
  currentHeroTarget.value = null;
  isOgImagePicker.value = false;
}
function selectAsset(asset: Asset) {
  if (isOgImagePicker.value) {
    current.value.ogImageAssetId = asset._id;
    return closeAssetModal();
  }
  const blockIndex = currentBlockIndex.value;
  if (blockIndex === null) return closeAssetModal();
  const block = current.value.blocks[blockIndex];
  if (!block) return closeAssetModal();

  if (block.type === "image") block.imageAssetId = asset._id;
  else if (block.type === "hero") {
    if (currentHeroTarget.value === "background") block.backgroundImageAssetId = asset._id;
    else block.imageAssetId = asset._id;
  } else if (block.type === "gallery" && currentGalleryIndex.value !== null) {
    const image = block.images[currentGalleryIndex.value];
    if (image) image.assetId = asset._id;
  } else if (block.type === "clients" && currentGalleryIndex.value !== null) {
    const client = block.items[currentGalleryIndex.value];
    if (client) client.imageAssetId = asset._id;
  } else if (block.type === "cta-section") block.backgroundImageAssetId = asset._id;
  else if (block.type === "carousel" && currentSlideIndex.value !== null) {
    const slide = block.slides[currentSlideIndex.value];
    if (slide) slide.imageAssetId = asset._id;
  } else if (block.type === "columns" && currentNestedColIndex.value !== null && currentNestedIndex.value !== null) {
    const col = block.columns[currentNestedColIndex.value];
    const nested = col?.blocks[currentNestedIndex.value];
    if (nested && nested.type === "image") nested.imageAssetId = asset._id;
  } else if (block.type === "split-content") block.imageAssetId = asset._id;
  closeAssetModal();
}
async function handleAssetUpload(file: File) {
  assetModalFile.value = file;
  await uploadAsset();
}
function updateNewBlockType(type: string) {
  newBlockType.value = type as typeof newBlockType.value;
}
async function savePageAndStay() {
  await savePage();
  await loadPages();
  if (current.value._id) {
    const refreshed = pages.value.find((p) => String(p._id) === String(current.value._id));
    if (refreshed) await selectPage(refreshed);
  }
}

onMounted(hydrateEditor);
</script>

<style scoped>
.cms-page-editor-view { display: grid; gap: 1rem; padding: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
.editor-content { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
</style>
