<template>
  <div v-if="page || blocks" class="page-renderer" :class="{ 'is-nested': !!blocks }">
    <!-- ===== AUTOMATIC BREADCRUMBS ===== -->
    <section v-if="showBreadcrumbs" class="breadcrumbs">
      <div class="container text-center">
        <div class="breadcrumbs-content">
          <h1 class="page-title">{{ page.title }}</h1>
          <ul class="breadcrumb-nav">
            <li><router-link to="/">Home</router-link></li>
            <li>{{ page.title }}</li>
          </ul>
        </div>
      </div>
    </section>

    <div
      v-for="(block, index) in computedBlocks"
      :key="index"
      class="block-wrapper"
      :class="[
        (!blocks && Number(index) % 2 === 1) ? 'is-alt-bg' : 'is-default-bg',
        `block-type-${block.type}`
      ]"
    >
      <!-- ===== HERO BLOCK ===== -->
      <section
        v-if="block.type === 'hero'"
        class="hero-area"
        :class="[block.layout || 'centered']"
        :style="block.backgroundImageAssetId
          ? { backgroundImage: `url(${getAssetUrl(block.backgroundImageAssetId)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}"
      >
        <div v-if="block.backgroundImageAssetId" class="hero-overlay"></div>
        <div class="container">
          <div class="hero-inner" :class="{ 'split': block.layout === 'left' || block.layout === 'right', 'reverse': block.layout === 'right' }">
            <div class="hero-content">
              <h4 v-if="block.overline" class="hero-overline">{{ block.overline }}</h4>
              <h1 class="hero-title">{{ block.title }}</h1>
              <p v-if="block.subtitle" class="hero-subtitle">{{ block.subtitle }}</p>
              <div v-if="block.content" class="hero-body" v-html="block.content"></div>
              <div v-if="block.ctaText && block.ctaUrl" class="hero-buttons">
                <a :href="block.ctaUrl" class="btn btn-primary">{{ block.ctaText }}</a>
              </div>
            </div>
            <div v-if="block.imageAssetId && (block.layout === 'left' || block.layout === 'right')" class="hero-image">
              <img :src="getAssetUrl(block.imageAssetId)" :alt="block.title" />
            </div>
          </div>
        </div>
      </section>

      <!-- ===== TEXT BLOCK ===== -->
      <section v-else-if="block.type === 'text'" class="section">
        <div class="container">
          <div class="section-title" v-if="block.title">
            <h3 v-if="block.overline">{{ block.overline }}</h3>
            <h2>{{ block.title }}</h2>
          </div>
          <div class="rich-content" v-html="block.content"></div>
        </div>
      </section>

      <!-- ===== IMAGE BLOCK ===== -->
      <section v-else-if="block.type === 'image'" class="section">
        <div class="container">
          <figure class="image-block">
            <img :src="getAssetUrl(block.imageAssetId)" :alt="block.caption || ''" />
            <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
          </figure>
        </div>
      </section>

      <!-- ===== SPLIT CONTENT BLOCK ===== -->
      <section v-else-if="block.type === 'split-content'" class="section split-content-section">
        <div class="container">
          <div class="split-wrapper" :class="{ 'reverse': block.layout === 'right' }">
            <div class="split-image-col">
              <div class="split-image-container glass">
                <img v-if="block.imageAssetId" :src="getAssetUrl(block.imageAssetId)" :alt="block.title" />
                <div v-else class="image-placeholder">
                  <Icon icon="lucide:image" width="48" />
                </div>
              </div>
            </div>
            <div class="split-text-col">
              <div class="split-text-content">
                <h2 v-if="block.title">{{ block.title }}</h2>
                <div class="split-body quill-content" v-html="block.content"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== COLUMNS / FEATURES BLOCK ===== -->
      <section v-else-if="block.type === 'columns'" class="section services">
        <div class="container">
          <div class="services-grid">
            <div v-for="(col, i) in block.columns" :key="i" class="single-service">
              <h4 class="text-title" v-if="col.columnTitle">{{ col.columnTitle }}</h4>
              <div v-if="col.blocks && col.blocks.length > 0" class="nested-column-blocks">
                <CmsContentRenderer :blocks="col.blocks" />
              </div>
              <!-- Fallback for legacy columns -->
              <div v-else class="legacy-column-content">
                <div class="service-icon" v-if="(col as any).imageAssetId">
                  <img :src="getAssetUrl((col as any).imageAssetId)" />
                </div>
                <div class="service-icon icon-fallback" v-else-if="(col as any).title || (col as any).content">
                  <Icon icon="lucide:sparkles" width="28" />
                </div>
                <h4 class="text-title" v-if="(col as any).title">{{ (col as any).title }}</h4>
                <div class="service-body" v-if="(col as any).content" v-html="(col as any).content"></div>
                <a v-if="(col as any).ctaText && (col as any).ctaUrl" :href="(col as any).ctaUrl" class="service-link">
                  {{ (col as any).ctaText }} <Icon icon="lucide:arrow-right" width="14" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== GALLERY BLOCK ===== -->
      <section v-else-if="block.type === 'gallery'" class="section">
        <div class="container">
          <div class="gallery-head" v-if="block.title || block.description">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <p v-if="block.description" class="gallery-description">
              {{ block.description }}
            </p>
          </div>
          <div class="gallery-grid">
            <div v-for="(img, i) in getVisibleGalleryImages(block, index)" :key="i" class="gallery-item">
              <img :src="getAssetUrl(img.assetId)" :alt="img.caption || ''" />
              <div v-if="img.caption" class="gallery-caption">{{ img.caption }}</div>
            </div>
          </div>
          <div v-if="shouldShowGalleryToggle(block)" class="gallery-actions">
            <button type="button" class="btn btn-secondary" @click="toggleGallery(index)">
              {{ isGalleryExpanded(index) ? "Show Less" : "Show All" }}
            </button>
          </div>
        </div>
      </section>

      <!-- ===== PRODUCT BLOCK ===== -->
      <section v-else-if="block.type === 'product'" class="section">
        <div class="container">
          <div class="product-section-head" v-if="block.title || block.description">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <p v-if="block.description">{{ block.description }}</p>
          </div>
          <div class="products-grid">
            <div v-for="product in getSelectedProducts(block.productIds)" :key="product._id" class="product-card">
              <div class="product-thumb">
                <img v-if="product.imageAssetId" :src="getAssetUrl(product.imageAssetId)" :alt="product.name" />
                <div v-else class="product-thumb-placeholder">
                  <Icon icon="lucide:package" width="40" />
                </div>
              </div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <p class="product-price">Rp {{ product.price?.toLocaleString('id-ID') }}</p>
                <router-link :to="'/products/' + product._id" class="btn btn-primary" style="font-size: 13px; padding: 10px 20px;">
                  Lihat Detail
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== BUTTON / CTA BLOCK ===== -->
      <section v-else-if="block.type === 'btn'" class="section call-action">
        <div class="container">
          <div class="cta-inner">
            <div class="cta-text">
              <h2 v-if="block.title">{{ block.title }}</h2>
            </div>
            <div class="cta-button">
              <a :href="block.buttonUrl" class="btn btn-alt">{{ block.buttonText }}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== FAQ BLOCK ===== -->
      <section v-else-if="block.type === 'faq'" class="section">
        <div class="container">
          <div class="section-title" v-if="block.title">
            <h3 v-if="block.overline">{{ block.overline }}</h3>
            <h2>{{ block.title }}</h2>
          </div>
          <div class="faq-list">
            <div
              v-for="(item, i) in block.items"
              :key="i"
              class="faq-item"
              :class="{ active: isFaqOpen(index, i) }"
            >
              <button class="faq-question" @click="toggleFaq(index, i)">
                <span>{{ item.question }}</span>
                <Icon :icon="isFaqOpen(index, i) ? 'lucide:minus' : 'lucide:plus'" width="18" />
              </button>
              <div class="faq-answer" v-show="isFaqOpen(index, i)">
                {{ item.answer }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CTA SECTION BLOCK ===== -->
      <section 
        v-else-if="block.type === 'cta-section'" 
        class="section cta-section-public"
        :style="block.backgroundImageAssetId ? { backgroundImage: `url(${getAssetUrl(block.backgroundImageAssetId)})` } : {}"
      >
        <div v-if="block.backgroundImageAssetId" class="cta-overlay-public"></div>
        <div class="container">
          <div class="cta-content-public">
            <h2>{{ block.title }}</h2>
            <p>{{ block.content }}</p>
            <div class="cta-btns-public">
              <a :href="block.buttonUrl" class="btn btn-primary lg">{{ block.buttonText }}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== MAPS BLOCK ===== -->
      <section v-else-if="block.type === 'maps'" class="section maps-section">
        <div class="container">
          <div class="section-title text-center" v-if="block.title">
            <h2>{{ block.title }}</h2>
          </div>
          <p v-if="block.description" class="maps-description">
            {{ block.description }}
          </p>
          <div class="map-embed-wrapper" v-html="block.mapEmbedCode"></div>
        </div>
      </section>

      <!-- ===== WHATSAPP FLOATING BUTTON BLOCK ===== -->
      <div v-else-if="block.type === 'whatsapp-float'" class="wa-float-wrapper">
        <a
          class="wa-float-btn"
          :href="getWhatsappHref(block.phoneNumber, block.message)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon icon="mdi:whatsapp" width="22" height="22" />
          <span v-if="block.label" class="wa-float-label">{{ block.label }}</span>
        </a>
      </div>

      <!-- ===== CAROUSEL / SLIDER BLOCK ===== -->
      <section v-else-if="block.type === 'carousel'" class="carousel-section">
        <div class="carousel-outer">
          <div 
            class="carousel-slides" 
            :style="{ transform: `translateX(-${(activeSlides[Number(index)] || 0) * 100}%)` }"
          >
            <div 
              v-for="(slide, sIdx) in block.slides" 
              :key="sIdx" 
              class="single-carousel-slide"
              :style="{ backgroundImage: `url(${getAssetUrl(slide.imageAssetId)})` }"
            >
              <div class="slide-overlay"></div>
              <div class="container slide-content-container">
                <div class="slide-content">
                  <h2 class="slide-title">{{ slide.title }}</h2>
                  <p class="slide-subtitle text-white">{{ slide.subtitle }}</p>
                  <div v-if="slide.ctaText && slide.ctaUrl" class="slide-btns mt-6">
                    <a :href="slide.ctaUrl" class="btn btn-primary">{{ slide.ctaText }}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Controls -->
          <div v-if="block.slides.length > 1" class="carousel-controls">
            <button class="nav-btn prev" @click="prevCarousel(Number(index), block.slides.length)">
              <Icon icon="lucide:chevron-left" width="24" height="24" />
            </button>
            <button class="nav-btn next" @click="nextCarousel(Number(index), block.slides.length)">
              <Icon icon="lucide:chevron-right" width="24" height="24" />
            </button>
          </div>
          
          <!-- Dots -->
          <div v-if="block.slides.length > 1" class="carousel-dots">
            <button 
              v-for="(_, dotIdx) in block.slides" 
              :key="dotIdx"
              class="dot-btn"
              :class="{ active: (activeSlides[Number(index)] || 0) === dotIdx }"
              @click="setCarouselSlide(index, Number(dotIdx))"
            ></button>
          </div>
        </div>
      </section>

      <!-- ===== FORM / CONTACT BLOCK ===== -->
      <section v-else-if="block.type === 'form'" class="section contact-section">
        <div class="container">
          <div class="contact-grid">
            <div class="contact-info">
              <div class="section-title left">
                <h3 v-if="block.overline">{{ block.overline }}</h3>
                <h2>{{ block.title }}</h2>
                <p>{{ block.subtitle }}</p>
              </div>
              <div class="contact-details">
                <div class="detail-item">
                  <div class="icon-box"><Icon icon="lucide:mail" /></div>
                  <div class="text-box">
                    <label>Email Kami</label>
                    <p>{{ block.formTargetEmail || 'info@snmgroup.co.id' }}</p>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="icon-box"><Icon icon="lucide:phone" /></div>
                  <div class="text-box">
                    <label>Telepon</label>
                    <p>+62 21 1234 5678</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-form-wrapper">
              <form v-if="!formStatus[index]" @submit.prevent="handleFormSubmit(index)" class="premium-form">
                <div class="form-row">
                  <div class="form-group">
                    <input type="text" placeholder="Nama Lengkap" required />
                  </div>
                  <div class="form-group">
                    <input type="email" placeholder="Alamat Email" required />
                  </div>
                </div>
                <div class="form-group">
                  <input type="text" placeholder="Subjek" required />
                </div>
                <div class="form-group">
                  <textarea placeholder="Pesan Anda" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full" :disabled="isSubmitting[index]">
                  <span v-if="isSubmitting[index]">Mengirim...</span>
                  <span v-else>Kirim Pesan</span>
                </button>
              </form>
              <div v-else class="form-success-state">
                <div class="success-icon">
                  <Icon icon="lucide:check-circle" width="64" />
                </div>
                <h3>Pesan Terkirim!</h3>
                <p>Terima kasih telah menghubungi kami. Tim kami akan segera merespons pesan Anda.</p>
                <button @click="resetForm(index)" class="btn btn-ghost mt-4">Kirim Pesan Lagi</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "CmsContentRenderer",
};
</script>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import api from "@/utils/api";
import type { PageBlock } from "@/types/pageTypes";

const route = useRoute();

interface Props {
  page?: any;
  blocks?: PageBlock[];
}

const props = defineProps<Props>();

const computedBlocks = computed(() => {
  return props.blocks || props.page?.blocks || [];
});

const showBreadcrumbs = computed(() => {
  // Hide if rendering nested blocks
  if (props.blocks) return false;
  
  // Hide on home page (empty slug or root)
  if (!route.params.slug || route.path === '/') return false;
  
  // Hide if first block is a hero
  const firstBlock = props.page?.blocks?.[0];
  if (firstBlock?.type === 'hero') return false;
  
  return true;
});

const assets = ref<any[]>([]);
const products = ref<any[]>([]);
const openedFaqs = ref<Record<string | number, number[]>>({});
const formStatus = ref<Record<string | number, boolean>>({});
const isSubmitting = ref<Record<string | number, boolean>>({});
const activeSlides = ref<Record<string | number, number>>({});
const carouselIntervals = ref<any[]>([]);
const expandedGalleries = ref<Record<string | number, boolean>>({});

const GALLERY_PREVIEW_LIMIT = 6;

onMounted(() => {
  // Setup auto-play for all carousels
  if (computedBlocks.value) {
    computedBlocks.value.forEach((block: any, idx: number) => {
      if (block.type === 'carousel' && block.slides?.length > 1) {
        const interval = setInterval(() => {
          nextCarousel(idx, block.slides.length);
        }, 5000);
        carouselIntervals.value.push(interval);
      }
    });
  }
});

function nextCarousel(idx: any, total: number) {
  const index = Number(idx);
  const current = activeSlides.value[index] || 0;
  activeSlides.value[index] = (current + 1) % total;
}

function prevCarousel(idx: any, total: number) {
  const index = Number(idx);
  const current = activeSlides.value[index] || 0;
  activeSlides.value[index] = (current - 1 + total) % total;
}

function setCarouselSlide(idx: any, slideIdx: number) {
  const index = Number(idx);
  activeSlides.value[index] = slideIdx;
}

async function loadAssets() {
  try {
    const res = await api.get("/assets");
    assets.value = res.data;
  } catch (err) {
    console.error("Failed to load assets", err);
  }
}

async function loadProducts() {
  try {
    const res = await api.get("/products");
    products.value = res.data;
  } catch (err) {
    console.error("Failed to load products", err);
  }
}

function handleFormSubmit(idx: any) {
  const index = Number(idx);
  isSubmitting.value[index] = true;
  // Simulate API call
  setTimeout(() => {
    isSubmitting.value[index] = false;
    formStatus.value[index] = true;
  }, 1500);
}

function resetForm(idx: any) {
  const index = Number(idx);
  formStatus.value[index] = false;
}

function getAssetUrl(assetId?: string): string {
  if (!assetId) return "";
  const asset = assets.value.find((a) => a._id === assetId);
  return asset ? asset.url : "";
}

function getSelectedProducts(productIds?: string[]) {
  if (!productIds) return [];
  return products.value.filter((product) => productIds.includes(product._id));
}

function getWhatsappHref(phoneNumber?: string, message?: string) {
  const phone = (phoneNumber || "").replace(/[^\d]/g, "");
  const text = message ? message.trim() : "";
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${phone}${params}`;
}

function isGalleryExpanded(blockIndex: string | number): boolean {
  const index = Number(blockIndex);
  return !!expandedGalleries.value[index];
}

function toggleGallery(blockIndex: string | number): void {
  const index = Number(blockIndex);
  expandedGalleries.value[index] = !expandedGalleries.value[index];
}

function shouldShowGalleryToggle(block: any): boolean {
  return Array.isArray(block.images) && block.images.length > GALLERY_PREVIEW_LIMIT;
}

function getVisibleGalleryImages(block: any, blockIndex: string | number) {
  if (!Array.isArray(block.images)) return [];
  if (isGalleryExpanded(blockIndex)) return block.images;
  return block.images.slice(0, GALLERY_PREVIEW_LIMIT);
}

function isFaqOpen(blockIndex: string | number, itemIndex: string | number): boolean {
  const key = `block-${blockIndex}`;
  const idx = typeof itemIndex === 'string' ? parseInt(itemIndex) : itemIndex;
  return openedFaqs.value[key]?.includes(idx) || false;
}

function toggleFaq(blockIndex: string | number, itemIndex: string | number): void {
  const key = `block-${blockIndex}`;
  const idx = typeof itemIndex === 'string' ? parseInt(itemIndex) : itemIndex;
  if (!openedFaqs.value[key]) {
    openedFaqs.value[key] = [idx];
  } else {
    const index = openedFaqs.value[key].indexOf(idx);
    if (index > -1) {
      openedFaqs.value[key].splice(index, 1);
    } else {
      openedFaqs.value[key].push(idx);
    }
  }
}

onMounted(() => {
  loadAssets();
  loadProducts();
});
</script>

<style scoped>
/* === Block Wrapper (Alternating Backgrounds) === */
.block-wrapper.is-alt-bg {
  background-color: #f8fafc; /* Harmonious subtle background */
}

.block-wrapper.is-default-bg {
  background-color: #ffffff;
}

/* Ensure blocks with their own backgrounds/overlays ignore the wrapper bg */
.block-wrapper.block-type-hero,
.block-wrapper.block-type-carousel,
.block-wrapper.block-type-cta-section {
  background-color: transparent !important;
}

/* === Global Container === */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
}

/* === Section Wrapper === */
.section {
  padding-top: 110px;
  padding-bottom: 110px;
}

/* === Nested Compact Mode === */
.page-renderer.is-nested .section {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.page-renderer.is-nested .block-wrapper {
  background-color: transparent !important;
}

.page-renderer.is-nested .container {
  padding: 0 1.5rem;
  max-width: none;
}

/* Full-bleed blocks (do not apply landing page side gutters) */
.split-content-section .container,
.cta-section-public .container,
.maps-section .container,
.carousel-section .container {
  padding: 0 1.5rem;
}

/* === Split Content Section === */
.split-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.split-wrapper.reverse {
  direction: ltr; /* Reset direction */
}

.split-wrapper.reverse .split-image-col {
  order: 2;
}

.split-wrapper.reverse .split-text-col {
  order: 1;
}

.split-image-container {
  border-radius: 2rem;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}

.split-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.split-text-content h2 {
  font-family: 'Spartan', sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #081828;
  margin-bottom: 1.5rem;
}

.split-body {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #555;
}

@media (max-width: 991px) {
  .split-wrapper {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  
  .split-wrapper.reverse .split-image-col {
    order: 1;
  }

  .split-wrapper.reverse .split-text-col {
    order: 2;
  }
}

/* === Section Title (Craft Pattern) === */
.section-title {
  text-align: center;
  margin-bottom: 60px;
}

/* Gallery Head (mirip Maps: left align + deskripsi di bawah judul) */
.gallery-head {
  text-align: left;
  margin-bottom: 40px;
}

.gallery-head h2 {
  font-family: 'Spartan', sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #081828;
  line-height: 1.3;
  margin-bottom: 16px;
}

.gallery-description {
  text-align: left;
  max-width: none;
  width: 100%;
  margin: 0;
  color: #727272;
  line-height: 1.8;
  font-size: 16px;
}

/* Product Section Head (lebih rapih, tanpa spacing berlebih dari .section-title) */
.product-section-head {
  text-align: center;
  margin-bottom: 40px;
}

.product-section-head h2 {
  font-family: 'Spartan', sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #081828;
  line-height: 1.3;
  margin-bottom: 14px;
}

.product-section-head p {
  font-size: 16px;
  color: #727272;
  line-height: 1.8;
  max-width: 700px;
  margin: 0 auto;
}

.section-title h3 {
  font-size: 14px;
  font-weight: 600;
  color: #7E57FF;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  display: block;
}

.section-title h2 {
  font-family: 'Spartan', sans-serif;
  font-size: 34px;
  font-weight: 700;
  color: #081828;
  line-height: 1.3;
  margin-bottom: 16px;
}

.section-title p {
  font-size: 16px;
  color: #727272;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.8;
}

/* === Hero Area === */
.hero-area {
  position: relative;
  min-height: 100vh;
  background-color: #081828;
  display: flex;
  align-items: center;
  padding-top: 56px; /* Reduced to match navbar height */
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(8, 24, 40, 0.85), rgba(8, 24, 40, 0.6));
  z-index: 1;
}

.hero-area .container {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 0 1.5rem; /* Keep content aligned with navbar gutters */
}

.hero-inner {
  display: flex;
  align-items: center;
  gap: 4rem;
  padding: 60px 0;
}

.hero-inner.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
}

.hero-inner.reverse {
  direction: rtl;
}
.hero-inner.reverse > * {
  direction: ltr;
}

.hero-area.centered .hero-inner {
  flex-direction: column;
  text-align: center;
  align-items: center;
  max-width: 760px;
  margin: 0 auto;
  justify-content: center;
}

.hero-overline {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255,255,255,0.7);
  margin-bottom: 1rem;
}

.hero-title {
  font-family: 'Spartan', sans-serif;
  font-size: clamp(2.2rem, 4.5vw, 3.8rem);
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  margin-bottom: 1.5rem;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  max-width: 560px;
}

.hero-body {
  color: rgba(255,255,255,0.8);
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 2rem;
}

/* Quill / rich text inside hero must stay readable on dark bg */
.hero-body :deep(*) {
  color: inherit !important;
}

.hero-body :deep(a) {
  color: rgba(255,255,255,0.95) !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hero-body :deep(a:hover) {
  color: #fff !important;
}

.hero-body :deep(ul),
.hero-body :deep(ol) {
  padding-left: 1.25rem;
}

.hero-body :deep(code) {
  color: #fff !important;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.hero-area.centered .hero-buttons {
  justify-content: center;
}

.hero-image img {
  width: 100%;
  border-radius: 12px;
}

/* === Rich Text Content === */
.rich-content {
  max-width: none;
  margin: 0;
  font-size: 16px;
  line-height: 1.9;
  color: #555;
}

/* === Image Block === */
.image-block {
  text-align: center;
}
.image-block img {
  max-width: 100%;
  border-radius: 12px;
}
.image-block figcaption {
  margin-top: 1rem;
  font-size: 14px;
  color: #999;
}

/* === Services / Columns Grid === */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.single-service {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  transition: all 0.4s ease;
  text-align: left;
}

.single-service:hover {
  transform: translateY(-4px);
}

.service-icon {
  width: 54px;
  height: 54px;
  background: #f3f0ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #7E57FF;
}

.service-icon img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.icon-fallback {
  color: #7E57FF;
}

.text-title {
  font-family: 'Spartan', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #081828;
  margin-bottom: 0.75rem;
  text-align: left;
}

.service-body {
  font-size: 15px;
  color: #727272;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.service-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #7E57FF;
  transition: gap 0.3s;
}
.service-link:hover {
  gap: 10px;
}

/* === Gallery Grid === */
.gallery-grid {
  column-count: 3;
  column-gap: 1.5rem;
}

.gallery-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 0 1.5rem;
  break-inside: avoid;
}

.gallery-item img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gallery-item:hover img {
  transform: scale(1.06);
}

.gallery-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.25rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.gallery-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

@media (max-width: 991px) {
  .gallery-grid { column-count: 2; }
}

@media (max-width: 600px) {
  .gallery-grid { column-count: 1; }
}

/* === Product Cards === */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 2rem;
}

.product-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-3px);
}

.product-thumb {
  background: #f7f7f7;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-thumb img {
  transform: scale(1.05);
}

.product-thumb-placeholder {
  color: #ccc;
}

.product-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.product-info h4 {
  font-family: 'Spartan', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #081828;
}

.product-price {
  font-size: 15px;
  font-weight: 600;
  color: #7E57FF;
}

/* === CTA / Button Block === */
.call-action {
  background: #7E57FF;
  padding: 80px 0;
}

.cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  background: rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 3rem 4rem;
}

.cta-text h2 {
  font-family: 'Spartan', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
}

.btn-alt {
  display: inline-block;
  background: #fff;
  color: #7E57FF;
  padding: 14px 36px;
  border-radius: 30px;
  font-weight: 700;
  border: 2px solid #fff;
  transition: all 0.4s ease;
  white-space: nowrap;
  font-size: 15px;
}

.btn-alt:hover {
  background: transparent;
  color: #fff;
}

/* === FAQ === */
.faq-list {
  max-width: 100%;
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.faq-item.active,
.faq-item:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.07);
  border-color: #7E57FF;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #081828;
  text-align: left;
  gap: 1rem;
  border-radius: inherit;
}

.faq-item.active .faq-question {
  color: #7E57FF;
}

.faq-answer {
  padding: 0 1.5rem 1.25rem;
  font-size: 15px;
  color: #727272;
  line-height: 1.8;
}

/* === Responsive === */
@media (max-width: 900px) {
  .section {
    padding-top: 70px;
    padding-bottom: 70px;
  }
  .hero-inner.split {
    grid-template-columns: 1fr;
  }
  .hero-title {
    font-size: 2rem;
  }
  .cta-inner {
    flex-direction: column;
    text-align: center;
    padding: 2rem;
  }
}

@media (max-width: 600px) {
  .section {
    padding-top: 50px;
    padding-bottom: 50px;
  }
  .section-title {
    margin-bottom: 40px;
  }
  .section-title h2 {
    font-size: 24px;
  }
}

/* Contact Block Styles */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: flex-start;
}

@media (max-width: 991px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

.contact-info .section-title.left {
  text-align: left;
  margin-bottom: 2.5rem;
}

.contact-info .section-title.left h2 {
  margin-left: 0;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-item {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.icon-box {
  width: 48px;
  height: 48px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.text-box label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.text-box p {
  font-size: 1rem;
  color: var(--text-muted);
}

.premium-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 575px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: #fdfdfd;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.form-success-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  animation: fadeIn 0.5s ease-out;
}

.success-icon {
  color: #10b981;
  margin-bottom: 1.5rem;
}

.form-success-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Carousel Styles */
.carousel-section {
  position: relative;
  overflow: hidden;
  padding: 0; /* Full impact */
  margin-bottom: 0;
}

.carousel-outer {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
}

.carousel-slides {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}

.single-carousel-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%);
}

.slide-content-container {
  position: relative;
  z-index: 10;
}

.slide-content {
  max-width: 650px;
  animation: slideUpFade 1s ease-out;
}

.slide-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.1;
}

.slide-subtitle {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.9);
  line-height: 1.6;
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.carousel-controls .nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 20;
  transition: all 0.3s;
}

.nav-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
}

.nav-btn.prev { left: 40px; }
.nav-btn.next { right: 40px; }

.carousel-dots {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 20;
}

.dot-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s;
}

.dot-btn.active {
  background: var(--primary);
  width: 34px;
  border-radius: 6px;
}

@media (max-width: 991px) {
  .carousel-outer { height: 450px; }
  .slide-title { font-size: 2.5rem; }
  .carousel-controls .nav-btn {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
  }
  .nav-btn.prev { left: 15px; }
  .nav-btn.next { right: 15px; }
}

@media (max-width: 575px) {
  .carousel-outer { height: 400px; }
  .slide-title { font-size: 1.8rem; }
  .nav-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  .nav-btn.prev { left: 10px; }
  .nav-btn.next { right: 10px; }
}

/* CTA Section Public */
.cta-section-public {
  position: relative;
  /* Override `.section` spacing explicitly to prevent overlap/stacking issues */
  padding-top: 120px;
  padding-bottom: 120px;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-color: #081828;
  color: white;
  text-align: center;
}

.cta-overlay-public {
  position: absolute;
  inset: 0;
  background: rgba(8, 24, 40, 0.7);
}

.cta-content-public {
  position: relative;
  z-index: 10;
  max-width: 800px;
  margin: 0 auto;
}

.cta-content-public h2 {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
}

.cta-content-public p {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.9);
  margin-bottom: 2.5rem;
}

.btn.lg {
  padding: 18px 40px;
  font-size: 1.1rem;
}

/* Maps Block Styles */
.maps-description {
  text-align: left;
  max-width: none;
  width: 100%;
  margin: -30px 0 40px;
  color: #727272;
  line-height: 1.8;
  font-size: 16px;
}

.map-embed-wrapper {
  position: relative;
  width: 100%;
  height: 450px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.map-embed-wrapper :deep(iframe) {
  width: 100% !important;
  height: 100% !important;
  border: 0;
}

/* WhatsApp Floating Button */
.wa-float-wrapper {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1200;
}

.wa-float-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #25d366;
  color: #fff;
  padding: 12px 16px;
  border-radius: 999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  font-weight: 700;
}

.wa-float-btn:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.wa-float-label {
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}
</style>
