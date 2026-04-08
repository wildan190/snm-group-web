<template>
  <div class="cms-pages-view">
    <div class="page-header">
      <div>
        <h1>Page Management</h1>
        <p class="text-sm text-slate-500">Kelola konten dan struktur halaman website</p>
      </div>
      <button @click="createNewPage" class="btn-primary">
        <Icon icon="lucide:plus" class="mr-2" />
        Create New Page
      </button>
    </div>

    <div class="page-content">
      <div class="sidebar-wrapper">
        <PageList
          :pages="pages"
          :current-id="current._id"
          @select="selectPage"
          @delete="deletePage"
          @set-homepage="setHomepage"
        />
      </div>

      <div class="form-wrapper">
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
          @add-column="
            (block) => addColumn(block as Extract<PageBlock, { type: 'columns' }>)
          "
          @remove-column="
            (block, index) =>
              removeColumn(
                block as Extract<PageBlock, { type: 'columns' }>,
                index,
              )
          "
          @add-gallery-image="
            (block) =>
              addGalleryImage(block as Extract<PageBlock, { type: 'gallery' }>)
          "
          @remove-gallery-image="
            (block, index) =>
              removeGalleryImage(
                block as Extract<PageBlock, { type: 'gallery' }>,
                index,
              )
          "
          @add-faq-item="
            (block) => addFaqItem(block as Extract<PageBlock, { type: 'faq' }>)
          "
          @remove-faq-item="
            (block, index) =>
              removeFaqItem(block as Extract<PageBlock, { type: 'faq' }>, index)
          "
          @open-image-picker="openAssetModal"
          @open-gallery-picker="openAssetModalForGallery"
          @open-hero-bg-picker="(index) => openAssetModalForHero(index, 'background')"
          @open-hero-image-picker="(index) => openAssetModalForHero(index, 'image')"
          @open-product-modal="
            (block) =>
              openProductModalForBlock(
                block as Extract<PageBlock, { type: 'product' }>,
              )
          "
          @add-carousel-slide="
            (block: any) => addCarouselSlide(block as Extract<PageBlock, { type: 'carousel' }>)
          "
          @remove-carousel-slide="
            (block: any, index: number) => removeCarouselSlide(block as Extract<PageBlock, { type: 'carousel' }>, index)
          "
          @open-carousel-image-picker="(index: number, slideIndex: number) => openCarouselImagePicker(index, slideIndex)"
          @open-cta-bg-picker="(index: number) => openAssetModalForHero(index, 'background')"
          @add-block-to-column="addBlockToColumn"
          @remove-block-from-column="removeBlockFromColumn"
          @open-nested-image-picker="openAssetModalForNested"
          @update-new-block-type="updateNewBlockType"
          @save-page="savePage"
        />
        <div v-else class="empty-state-full">
          <Icon icon="lucide:mouse-pointer-click" width="64" class="text-slate-200 mb-4" />
          <h2>Pilih Halaman</h2>
          <p>Pilih halaman dari daftar di samping atau buat halaman baru untuk mulai mengedit.</p>
        </div>
      </div>
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
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";
import PageList from "@/components/cms/PageList.vue";
import PageForm from "@/components/cms/PageForm.vue";
import ProductModal from "@/components/cms/ProductModal.vue";
import AssetModal from "@/components/cms/AssetModal.vue";
import { usePages } from "@/composables/usePages";
import { useProducts } from "@/composables/useProducts";
import { useAssets } from "@/composables/useAssets";
import type { PageBlock, Product, Asset } from "@/types/pageTypes";

const {
  pages,
  current,
  newBlockType,
  loadPages,
  createPage,
  selectPage,
  setHomepage,
  deletePage,
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
const {
  products,
  loadProducts,
  getProductName,
  getProductDescription,
  getProductImage,
  getProductPrice,
} = useProducts();
const { assets, loadAssets, getAssetUrl, getAssetName, uploadAsset, selectedFile: assetModalFile } = useAssets();

const showProductModal = ref(false);
const showAssetModal = ref(false);
const currentBlockIndex = ref<number | null>(null);
const currentGalleryIndex = ref<number | null>(null);
const currentSlideIndex = ref<number | null>(null);
const currentNestedColIndex = ref<number | null>(null);
const currentNestedIndex = ref<number | null>(null);
const currentHeroTarget = ref<"background" | "image" | null>(null);
const currentProductBlock = ref<Extract<PageBlock, { type: "product" }> | null>(
  null,
);

onMounted(async () => {
  await loadPages();
  await loadProducts();
  await loadAssets();
});

const createNewPage = () => {
  createPage();
};

const openProductModalForBlock = (
  block: Extract<PageBlock, { type: "product" }>,
) => {
  currentProductBlock.value = block;
  showProductModal.value = true;
};

const closeProductModal = () => {
  showProductModal.value = false;
  currentProductBlock.value = null;
};

const toggleProductSelection = (productId: string) => {
  if (currentProductBlock.value) {
    const index = currentProductBlock.value.productIds.indexOf(productId);
    if (index === -1) {
      currentProductBlock.value.productIds.push(productId);
    } else {
      currentProductBlock.value.productIds.splice(index, 1);
    }
  }
};

const openAssetModal = (blockIndex: number) => {
  currentBlockIndex.value = blockIndex;
  showAssetModal.value = true;
};

const openAssetModalForGallery = (blockIndex: number, galleryIndex: number) => {
  currentBlockIndex.value = blockIndex;
  currentGalleryIndex.value = galleryIndex;
  showAssetModal.value = true;
};

const openAssetModalForHero = (
  blockIndex: number,
  target: "background" | "image",
) => {
  currentBlockIndex.value = blockIndex;
  currentHeroTarget.value = target;
  showAssetModal.value = true;
};

const openCarouselImagePicker = (blockIndex: number, slideIndex: number) => {
  currentBlockIndex.value = blockIndex;
  currentSlideIndex.value = slideIndex;
  showAssetModal.value = true;
};

const openAssetModalForNested = (blockIndex: number, colIndex: number, nestedIndex: number) => {
  currentBlockIndex.value = blockIndex;
  currentNestedColIndex.value = colIndex;
  currentNestedIndex.value = nestedIndex;
  showAssetModal.value = true;
};

const closeAssetModal = () => {
  showAssetModal.value = false;
  currentBlockIndex.value = null;
  currentGalleryIndex.value = null;
  currentSlideIndex.value = null;
  currentNestedColIndex.value = null;
  currentNestedIndex.value = null;
  currentHeroTarget.value = null;
};

const selectAsset = (asset: Asset) => {
  const blockIndex = currentBlockIndex.value;
  if (blockIndex !== null) {
    const block = current.value.blocks[blockIndex];
    if (!block) return;

    if (block.type === "image") {
      block.imageAssetId = asset._id;
    } else if (block.type === "hero") {
      const heroBlock = block as Extract<PageBlock, { type: "hero" }>;
      if (currentHeroTarget.value === "background") {
        heroBlock.backgroundImageAssetId = asset._id;
      } else {
        heroBlock.imageAssetId = asset._id;
      }
    } else if (block.type === "gallery" && currentGalleryIndex.value !== null) {
      const galleryBlock = block as Extract<PageBlock, { type: "gallery" }>;
      const image = galleryBlock.images[currentGalleryIndex.value];
      if (image) {
        image.assetId = asset._id;
      }
    } else if (block.type === "cta-section") {
      const ctaBlock = block as Extract<PageBlock, { type: "cta-section" }>;
      ctaBlock.backgroundImageAssetId = asset._id;
    } else if (block.type === "carousel" && currentSlideIndex.value !== null) {
      const carouselBlock = block as Extract<PageBlock, { type: "carousel" }>;
      const slide = carouselBlock.slides[currentSlideIndex.value];
      if (slide) {
        slide.imageAssetId = asset._id;
      }
    } else if (
      block.type === "columns" &&
      currentNestedColIndex.value !== null &&
      currentNestedIndex.value !== null
    ) {
      const columnBlock = block as Extract<PageBlock, { type: "columns" }>;
      const column = columnBlock.columns[currentNestedColIndex.value];
      if (column) {
        const nestedBlock = column.blocks[currentNestedIndex.value];
        if (nestedBlock && nestedBlock.type === "image") {
          nestedBlock.imageAssetId = asset._id;
        }
      }
    } else if (block.type === "split-content") {
      const splitBlock = block as Extract<PageBlock, { type: "split-content" }>;
      splitBlock.imageAssetId = asset._id;
    }
  }
  closeAssetModal();
};

const handleAssetUpload = async (file: File) => {
  assetModalFile.value = file;
  await uploadAsset();
  // The assets list is automatically refreshed inside uploadAsset
};

const updateNewBlockType = (type: string) => {
  newBlockType.value = type as typeof newBlockType.value;
};
</script>

<style scoped>
.cms-pages-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f8fafc;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.page-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-wrapper {
  width: 380px;
  flex-shrink: 0;
  border-right: 1px solid #e2e8f0;
  background: white;
  overflow-y: auto;
}

.form-wrapper {
  flex: 1;
  background: #f8fafc;
  position: relative;
  overflow: hidden; /* Prevent double scrollbars */
}

.empty-state-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 4rem;
  text-align: center;
  color: #64748b;
}

.empty-state-full h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.empty-state-full p {
  max-width: 400px;
  margin: 0 auto;
}
</style>
