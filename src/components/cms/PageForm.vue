<template>
  <div class="page-form-container">
    <!-- Tabs -->
    <div class="tabs-premium glass mb-6">
      <button
        class="tab-btn-premium"
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <Icon icon="lucide:settings-2" width="18" />
        Pengaturan
      </button>
      <button
        class="tab-btn-premium"
        :class="{ active: activeTab === 'content' }"
        @click="activeTab = 'content'"
      >
        <Icon icon="lucide:layout-panel-left" width="18" />
        Konten Blok
      </button>
    </div>

    <!-- Tab Content: Settings -->
    <div v-if="activeTab === 'settings'" class="tab-content fade-in">
      <div class="card premium-card">
        <h3 class="section-title">
          <Icon icon="lucide:info" class="mr-2" />
          Informasi Halaman
        </h3>
        <div class="grid grid-2 gap-6">
          <div class="form-field">
            <label>Judul Halaman</label>
            <input v-model="current.title" placeholder="Contoh: Tentang Kami" />
          </div>
          <div class="form-field">
            <label>Slug (URL)</label>
            <div class="slug-input-wrapper">
              <span class="slug-prefix">/</span>
              <input v-model="current.slug" placeholder="contoh-halaman" />
            </div>
          </div>
        </div>
        <div class="form-field mt-6">
          <label class="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              v-model="current.isHomepage" 
              class="w-5 h-5 accent-primary"
            />
            <div>
              <span class="font-bold text-slate-800 block">Jadikan Halaman Utama (Homepage)</span>
              <span class="text-xs text-slate-500">Halaman ini akan muncul saat pengunjung membuka domain utama Anda.</span>
            </div>
          </label>
        </div>
        <div class="form-field mt-6">
          <label>Deskripsi SEO (Meta Description)</label>
          <textarea
            v-model="current.seoDescription"
            rows="3"
            placeholder="Deskripsi untuk hasil pencarian Google..."
          ></textarea>
        </div>
        <div class="grid grid-2 gap-6 mt-6">
          <div class="form-field">
            <label>SEO Title (Opsional)</label>
            <input
              v-model="current.seoTitle"
              placeholder="Judul SEO khusus (default: Judul Halaman)"
            />
          </div>
          <div class="form-field">
            <label>Canonical URL (Opsional)</label>
            <input
              v-model="current.canonicalUrl"
              placeholder="https://domainanda.com/slug-halaman"
            />
          </div>
        </div>
        <div class="grid grid-2 gap-6 mt-6">
          <div class="form-field">
            <label>OG Title (Meta Share)</label>
            <input
              v-model="current.ogTitle"
              placeholder="Judul saat dibagikan ke sosial media"
            />
          </div>
          <div class="form-field">
            <label>OG Description (Meta Share)</label>
            <input
              v-model="current.ogDescription"
              placeholder="Deskripsi saat dibagikan ke sosial media"
            />
          </div>
        </div>
        <div class="form-field mt-6">
          <label>OG Image URL (Meta Share)</label>
          <input
            v-model="current.ogImageUrl"
            placeholder="https://domainanda.com/uploads/og-image.jpg"
          />
        </div>
        <div class="grid grid-2 gap-6 mt-6">
          <div class="form-field">
            <label>Tipe Schema Markup</label>
            <select v-model="current.schemaType">
              <option value="none">Tanpa Schema</option>
              <option value="organization">Organization</option>
              <option value="website">WebSite</option>
              <option value="product">Product</option>
              <option value="aboutus">AboutPage (About Us)</option>
            </select>
          </div>
          <div class="form-field">
            <label>Schema JSON Kustom (Opsional)</label>
            <textarea
              v-model="current.schemaCustomJson"
              rows="4"
              placeholder='Contoh: {"brand":"SNM Group","sku":"PRD-001"}'
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Content -->
    <div v-else class="tab-content fade-in">
      <!-- Visual Block Picker -->
      <div class="card premium-card block-picker-card">
        <h3 class="section-title">
          <Icon icon="lucide:plus-circle" class="mr-2" />
          Tambah Blok Baru
        </h3>
        <div class="visual-picker">
          <div
            v-for="type in blockTypes"
            :key="type.value"
            class="picker-item"
            :class="{ selected: newBlockType === type.value }"
            @click="$emit('updateNewBlockType', type.value)"
          >
            <div class="picker-icon">
              <Icon :icon="type.icon" />
            </div>
            <span class="picker-label">{{ type.label }}</span>
          </div>
        </div>
        <div class="block-picker-actions flex justify-end">
          <button class="btn-primary" type="button" @click="$emit('addBlock')">
            <Icon icon="lucide:plus" class="mr-2" />
            Tambah ke Halaman
          </button>
        </div>
      </div>

      <!-- Blocks List -->
      <div class="blocks-list">
        <div v-if="current.blocks.length === 0" class="empty-blocks-state">
          <div class="empty-icon-wrapper">
            <Icon icon="lucide:layout" width="48" />
          </div>
          <h4>Belum ada konten</h4>
          <p>Gunakan pemilih blok di atas untuk mulai membangun halaman Anda.</p>
        </div>

        <TransitionGroup name="list">
          <div
            v-for="(block, index) in current.blocks"
            :key="block.id || index"
            class="block-card-premium"
            :class="[`is-${block.type}`]"
            @dragover.prevent
            @drop="onDropBlock(index)"
          >
            <div class="block-card-header">
              <div class="flex items-center gap-3">
                <div class="block-number">{{ index + 1 }}</div>
                <div class="picker-icon small">
                    <Icon :icon="getBlockCardIcon(block)" />
                </div>
                  <span class="block-type-badge">{{ getBlockCardLabel(block) }}</span>
              </div>
              <div class="block-header-actions">
                <button
                  type="button"
                  class="btn-icon-xs drag-handle"
                  title="Geser untuk reorder"
                  draggable="true"
                  @dragstart="onDragStartBlock(index)"
                >
                  <Icon icon="lucide:grip-vertical" width="16" />
                </button>

                <div class="reorder-actions">
                  <button
                    class="btn-icon-xs"
                    title="Naik"
                    :disabled="index === 0"
                    @click="$emit('moveBlockUp', index)"
                  >
                    <Icon icon="lucide:arrow-up" width="14" />
                  </button>
                  <button
                    class="btn-icon-xs"
                    title="Turun"
                    :disabled="index === current.blocks.length - 1"
                    @click="$emit('moveBlockDown', index)"
                  >
                    <Icon icon="lucide:arrow-down" width="14" />
                  </button>
                </div>

                <button
                  type="button"
                  class="btn-icon-xs"
                  :title="isBlockCollapsed(block) ? 'Expand' : 'Collapse'"
                  @click="toggleBlockCollapsed(block)"
                >
                  <Icon :icon="isBlockCollapsed(block) ? 'lucide:chevron-down' : 'lucide:chevron-up'" width="16" />
                </button>

                <button
                  class="btn-icon-sm danger"
                  title="Hapus blok"
                  @click="$emit('removeBlock', index)"
                >
                  <Icon icon="lucide:trash-2" width="16" />
                </button>
              </div>
            </div>

            <div v-show="!isBlockCollapsed(block)" class="block-card-body">
              <!-- Hero Block -->
              <div v-if="block.type === 'hero'" class="grid gap-6">
                <div class="form-field">
                  <label>Layout Hero</label>
                  <div class="layout-picker">
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'centered' }"
                      @click="block.layout = 'centered'"
                    >
                      <Icon icon="lucide:align-center" />
                      <span>Centered</span>
                    </button>
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'left' }"
                      @click="block.layout = 'left'"
                    >
                      <Icon icon="lucide:panel-left" />
                      <span>Split Left</span>
                    </button>
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'right' }"
                      @click="block.layout = 'right'"
                    >
                      <Icon icon="lucide:panel-right" />
                      <span>Split Right</span>
                    </button>
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'background' }"
                      @click="block.layout = 'background'"
                    >
                      <Icon icon="lucide:image" />
                      <span>Background</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-2 gap-6">
                  <div class="form-field">
                    <label>Judul Hero</label>
                    <input v-model="block.title" placeholder="Main Headline..." />
                  </div>
                  <div class="form-field">
                    <label>Subtitle</label>
                    <input v-model="block.subtitle" placeholder="Sub-headline..." />
                  </div>
                </div>

                <div class="form-field">
                  <label>Konten / Overlay Text</label>
                  <QuillEditor v-model:content="block.content" content-type="html" />
                </div>

                <div class="grid grid-2 gap-6">
                  <div class="form-field">
                    <label>Background Image</label>
                    <div class="asset-selector-premium mini" @click="$emit('openHeroBgPicker', index)">
                      <div v-if="block.backgroundImageAssetId" class="image-preview-mini">
                        <img :src="getAssetUrl(block.backgroundImageAssetId)" />
                        <Icon icon="lucide:refresh-cw" class="refresh-icon" />
                      </div>
                      <div v-else class="upload-placeholder-mini">
                        <Icon icon="lucide:image-plus" />
                        <span>Pilih Background</span>
                      </div>
                    </div>
                  </div>
                  <div class="form-field" v-if="block.layout !== 'centered' && block.layout !== 'background'">
                    <label>Side Image</label>
                    <div class="asset-selector-premium mini" @click="$emit('openHeroImagePicker', index)">
                      <div v-if="block.imageAssetId" class="image-preview-mini">
                        <img :src="getAssetUrl(block.imageAssetId)" />
                        <Icon icon="lucide:refresh-cw" class="refresh-icon" />
                      </div>
                      <div v-else class="upload-placeholder-mini">
                        <Icon icon="lucide:image-plus" />
                        <span>Pilih Gambar Samping</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-2 gap-6">
                  <div class="form-field">
                    <label>Teks Tombol CTA</label>
                    <input v-model="block.ctaText" placeholder="Contoh: Mulai Sekarang" />
                  </div>
                  <div class="form-field">
                    <label>Link Tombol CTA</label>
                    <input v-model="block.ctaUrl" placeholder="https://..." />
                  </div>
                </div>
              </div>

              <!-- Text Block -->
              <div v-if="block.type === 'text'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Seksi</label>
                  <input v-model="block.title" placeholder="Judul artikel..." />
                </div>
                <div class="form-field">
                  <label>Isi Konten</label>
                  <QuillEditor v-model:content="block.content" content-type="html" />
                </div>
              </div>

              <!-- Image Block -->
              <div v-if="block.type === 'image'" class="grid gap-5">
                <div class="asset-selector-premium">
                  <div v-if="block.imageAssetId" class="image-preview-premium">
                    <img
                      :src="getAssetUrl(block.imageAssetId)"
                      alt="Image preview"
                    />
                    <div class="preview-overlay">
                      <button class="btn-icon-sm" type="button" @click="$emit('openImagePicker', index)">
                        <Icon icon="lucide:refresh-cw" />
                      </button>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder" @click="$emit('openImagePicker', index)">
                    <Icon icon="lucide:image-plus" width="32" />
                    <span>Pilih Gambar dari Asset</span>
                  </div>
                </div>
                <div class="form-field">
                  <label>Caption / Alt Text</label>
                  <input v-model="block.caption" placeholder="Deskripsi gambar..." />
                </div>
              </div>

              <!-- Columns Block -->
              <div v-if="block.type === 'columns'" class="grid gap-6">
                <div class="columns-management">
                  <div 
                    v-for="(col, cIdx) in block.columns" 
                    :key="cIdx" 
                    class="column-edit-card"
                  >
                    <div class="column-header-premium">
                      <div class="flex items-center gap-3">
                        <span class="badge badge-indigo">Kolom {{ cIdx + 1 }}</span>
                        <input v-model="col.columnTitle" class="column-title-input" placeholder="Nama kolom..." />
                      </div>
                      <button 
                        class="btn-icon-xs danger" 
                        type="button"
                        @click="$emit('removeColumn', block, cIdx)"
                      >
                        <Icon icon="lucide:trash-2" width="14" />
                      </button>
                    </div>

                    <!-- Nested Blocks List -->
                    <div class="nested-blocks-container">
                      <div v-if="col.blocks.length === 0" class="empty-nested-blocks">
                        Belum ada blok di kolom ini.
                      </div>
                      <div 
                        v-for="(nBlock, nIdx) in col.blocks" 
                        :key="nIdx"
                        class="nested-block-card"
                      >
                        <div class="nested-block-header">
                          <div class="flex items-center gap-2">
                            <Icon :icon="getBlockIcon(nBlock.type)" width="14" />
                            <span class="text-xs font-semibold uppercase">{{ nBlock.type }}</span>
                          </div>
                          <button 
                            class="btn-icon-xxs danger"
                            type="button"
                            @click="$emit('removeBlockFromColumn', col, nIdx)"
                          >
                            <Icon icon="lucide:x" width="12" />
                          </button>
                        </div>
                        
                        <div class="nested-block-body p-3">
                          <!-- Text Nested -->
                          <div v-if="nBlock.type === 'text'" class="grid gap-2">
                            <input v-model="nBlock.title" class="input-xs" placeholder="Judul Teks..." />
                            <textarea v-model="nBlock.content" class="input-xs" rows="2" placeholder="Isi teks..."></textarea>
                          </div>
                          <!-- Image Nested -->
                          <div v-if="nBlock.type === 'image'" class="grid gap-2">
                            <div class="asset-selector-premium mini" style="height: 60px;" @click="$emit('openNestedImagePicker', index, cIdx, nIdx)">
                              <div v-if="nBlock.imageAssetId" class="image-preview-mini">
                                <img :src="getAssetUrl(nBlock.imageAssetId)" />
                              </div>
                              <div v-else class="upload-placeholder-mini py-1">
                                <Icon icon="lucide:image-plus" width="16" />
                              </div>
                            </div>
                            <input v-model="nBlock.caption" class="input-xs" placeholder="Caption..." />
                          </div>
                          <!-- Button Nested -->
                          <div v-if="nBlock.type === 'btn'" class="grid gap-2">
                            <input v-model="nBlock.buttonText" class="input-xs" placeholder="Teks Tombol..." />
                            <input v-model="nBlock.buttonUrl" class="input-xs" placeholder="Link..." />
                          </div>
                          <!-- Product Nested -->
                          <div v-if="nBlock.type === 'product'" class="grid gap-2">
                             <button class="btn-xs-primary" type="button" @click="$emit('openProductModal', nBlock)">Pilih Produk</button>
                          </div>
                        </div>
                      </div>

                      <!-- Add Nested Block Selector -->
                      <div class="add-nested-block-actions mt-3">
                        <select 
                          class="select-xs w-full"
                          @change="(e: any) => { 
                            if(e.target.value) {
                              $emit('addBlockToColumn', col, e.target.value);
                              e.target.value = '';
                            }
                          }"
                        >
                          <option value="">+ Tambah Blok ke Kolom...</option>
                          <option v-for="t in nestedAvailableTypes" :key="t.value" :value="t.value">
                            {{ t.label }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button class="btn-secondary-dashed w-full" type="button" @click="$emit('addColumn', block)">
                    <Icon icon="lucide:plus" class="mr-2" />
                    Tambah Kolom Baru
                  </button>
                </div>
              </div>

              <!-- Gallery Block -->
              <div v-if="block.type === 'gallery'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Galeri</label>
                  <input v-model="block.title" />
                </div>
                <div class="form-field">
                  <label>Deskripsi Galeri</label>
                  <textarea v-model="block.description" rows="3" placeholder="Deskripsi singkat untuk section galeri..." />
                </div>
                <div class="gallery-grid">
                  <div
                    v-for="(img, idx) in block.images"
                    :key="idx"
                    class="gallery-item-premium"
                  >
                    <div v-if="img.assetId" class="gallery-preview-thumb">
                      <img
                        :src="getAssetUrl(img.assetId)"
                        alt="Gallery preview"
                      />
                      <button
                        class="remove-gallery-img"
                        type="button"
                        @click="$emit('removeGalleryImage', block, idx)"
                      >
                        <Icon icon="lucide:x" width="12" />
                      </button>
                    </div>
                    <div v-else class="gallery-add-thumb" @click="$emit('openGalleryPicker', index, idx)">
                      <Icon icon="lucide:image-plus" />
                    </div>
                    <input v-model="img.caption" placeholder="Caption..." class="gallery-caption-input" />
                  </div>
                  <div class="gallery-add-card" @click="$emit('addGalleryImage', block)">
                    <Icon icon="lucide:plus-circle" width="24" />
                    <span>Baru</span>
                  </div>
                </div>
              </div>

              <!-- Product Block -->
              <div v-if="block.type === 'product'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Seksi Produk</label>
                  <input v-model="block.title" />
                </div>
                <div class="form-field">
                  <label>Deskripsi Seksi Produk</label>
                  <textarea v-model="block.description" rows="3" placeholder="Deskripsi singkat untuk section produk..." />
                </div>
                <div class="product-selection-premium">
                  <div v-if="block.productIds.length" class="selected-products-list">
                    <div
                      v-for="productId in block.productIds"
                      :key="productId"
                      class="product-item-chip"
                    >
                      <div class="chip-thumb">
                        <img :src="getProductImage(productId)" alt="" v-if="getProductImage(productId)" />
                        <Icon icon="lucide:package" v-else />
                      </div>
                      <div class="chip-info">
                        <span class="chip-name">{{ getProductName(productId) }}</span>
                        <span class="chip-price">Rp {{ getProductPrice(productId) }}</span>
                      </div>
                      <button class="chip-remove" type="button" @click="removeProductId(block, productId)">
                        <Icon icon="lucide:x" width="14" />
                      </button>
                    </div>
                  </div>
                  <button
                    class="btn-secondary w-full py-4 mt-2"
                    type="button"
                    @click="$emit('openProductModal', block)"
                  >
                    <Icon icon="lucide:layout-grid" class="mr-2" />
                    Pilih Produk Dari Katalog
                  </button>
                </div>
              </div>

              <!-- Button Block -->
              <div v-if="block.type === 'btn'" class="grid grid-2 gap-5">
                <div class="form-field col-span-2">
                  <label>Judul Seksi (Opsional)</label>
                  <input v-model="block.title" />
                </div>
                <div class="form-field">
                  <label>Teks Tombol</label>
                  <input v-model="block.buttonText" placeholder="Hubungi Kami" />
                </div>
                <div class="form-field">
                  <label>Link Tombol</label>
                  <input v-model="block.buttonUrl" placeholder="https://..." />
                </div>
              </div>

              <!-- FAQ Block -->
              <div v-if="block.type === 'faq'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul FAQ</label>
                  <input v-model="block.title" />
                </div>
                <div class="faq-list-premium">
                  <div
                    v-for="(item, idx) in block.items"
                    :key="idx"
                    class="faq-item-premium"
                  >
                    <div class="flex justify-between items-center mb-3">
                      <span class="badge badge-blue">Tanya Jawab #{{ idx + 1 }}</span>
                      <button
                        class="btn-icon-xs danger"
                        type="button"
                        @click="$emit('removeFaqItem', block, idx)"
                      >
                        <Icon icon="lucide:trash-2" width="14" />
                      </button>
                    </div>
                    <div class="form-field mb-3">
                      <label>Pertanyaan</label>
                      <input v-model="item.question" placeholder="Apa itu...?" />
                    </div>
                    <div class="form-field">
                      <label>Jawaban</label>
                      <textarea v-model="item.answer" rows="2" placeholder="Jawabannya adalah..."></textarea>
                    </div>
                  </div>
                </div>
                <button class="btn-secondary-dashed w-full" type="button" @click="$emit('addFaqItem', block)">
                  <Icon icon="lucide:plus" class="mr-2" />
                  Tambah Item FAQ
                </button>
              </div>

              <!-- Form Block -->
              <div v-if="block.type === 'form'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Seksi Kontak</label>
                  <input v-model="block.title" placeholder="Hubungi Kami" />
                </div>
                <div class="form-field">
                  <label>Sub-judul / Deskripsi Pendek</label>
                  <input v-model="block.subtitle" placeholder="Punya pertanyaan? Kami siap membantu..." />
                </div>
                <div class="form-field">
                  <label>Email Tujuan (Opsional)</label>
                  <input v-model="block.formTargetEmail" placeholder="admin@perusahaan.com" />
                  <p class="text-xs text-slate-400 mt-1">Data formulir akan dikirim ke email ini.</p>
                </div>
              </div>

              <!-- Carousel Block -->
              <div v-if="block.type === 'carousel'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Seksi Carousel (Opsional)</label>
                  <input v-model="block.title" placeholder="Layanan Unggulan" />
                </div>
                <div class="carousel-editor">
                  <div
                    v-for="(slide, sIdx) in block.slides"
                    :key="sIdx"
                    class="slide-item-premium"
                  >
                    <div class="flex justify-between items-center mb-4">
                      <span class="badge badge-indigo">Slide {{ sIdx + 1 }}</span>
                      <button
                        class="btn-icon-xs danger"
                        type="button"
                        @click="$emit('removeCarouselSlide', block, sIdx)"
                      >
                        <Icon icon="lucide:trash-2" width="14" />
                      </button>
                    </div>
                    
                    <div class="grid grid-2-1 gap-6">
                      <div class="grid gap-4">
                        <div class="form-field">
                          <label>Judul Slide</label>
                          <input v-model="slide.title" placeholder="Headline..." />
                        </div>
                        <div class="form-field">
                          <label>Sub-judul</label>
                          <textarea v-model="slide.subtitle" rows="2" placeholder="Keterangan singkat..."></textarea>
                        </div>
                      </div>
                      <div class="form-field">
                        <label>Gambar Slide</label>
                        <div class="asset-selector-premium" style="height: 120px;" @click="$emit('openCarouselImagePicker', index, sIdx)">
                          <div v-if="slide.imageAssetId" class="image-preview-mini">
                            <img :src="getAssetUrl(slide.imageAssetId)" />
                            <div class="preview-overlay" style="opacity: 1; background: rgba(0,0,0,0.2)">
                              <Icon icon="lucide:refresh-cw" class="text-white" />
                            </div>
                          </div>
                          <div v-else class="upload-placeholder-mini py-4">
                            <Icon icon="lucide:image-plus" width="24" />
                            <span>Pilih Gambar</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-2 gap-4 mt-4">
                      <div class="form-field">
                        <label>Teks Tombol CTA</label>
                        <input v-model="slide.ctaText" placeholder="Contoh: Mulai" />
                      </div>
                      <div class="form-field">
                        <label>Link Tombol CTA</label>
                        <input v-model="slide.ctaUrl" placeholder="https://..." />
                      </div>
                    </div>
                  </div>
                  
                  <button class="btn-secondary-dashed w-full mt-2" type="button" @click="$emit('addCarouselSlide', block)">
                    <Icon icon="lucide:plus" class="mr-2" />
                    Tambah Slide Baru
                  </button>
                </div>
              </div>

              <!-- CTA Block -->
              <div v-if="block.type === 'cta-section'" class="grid gap-5">
                <div class="grid grid-2 gap-6">
                  <div class="form-field">
                    <label>Judul CTA</label>
                    <input v-model="block.title" placeholder="Siap untuk memulai?" />
                  </div>
                  <div class="form-field">
                    <label>Latar Belakang (Opsional)</label>
                    <div class="asset-selector-premium mini" @click="$emit('openCtaBgPicker', index)">
                      <div v-if="block.backgroundImageAssetId" class="image-preview-mini">
                        <img :src="getAssetUrl(block.backgroundImageAssetId)" />
                        <Icon icon="lucide:refresh-cw" class="refresh-icon" />
                      </div>
                      <div v-else class="upload-placeholder-mini">
                        <Icon icon="lucide:image-plus" />
                        <span>Pilih Background</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-field">
                  <label>Isi Konten CTA</label>
                  <textarea v-model="block.content" placeholder="Keterangan singkat yang menarik minat pengunjung..."></textarea>
                </div>
                <div class="grid grid-2 gap-6">
                  <div class="form-field">
                    <label>Teks Tombol CTA</label>
                    <input v-model="block.buttonText" placeholder="Hubungi Kami" />
                  </div>
                  <div class="form-field">
                    <label>Link Tombol CTA</label>
                    <input v-model="block.buttonUrl" placeholder="/contact" />
                  </div>
                </div>
              </div>

              <!-- Split Content Block -->
              <div v-if="block.type === 'split-content'" class="grid gap-6">
                <div class="form-field">
                  <label>Layout Konten</label>
                  <div class="layout-picker">
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'left' }"
                      @click="block.layout = 'left'"
                    >
                      <Icon icon="lucide:panel-left" />
                      <span>Gambar Kiri</span>
                    </button>
                    <button 
                      type="button"
                      class="layout-btn" 
                      :class="{ active: block.layout === 'right' }"
                      @click="block.layout = 'right'"
                    >
                      <Icon icon="lucide:panel-right" />
                      <span>Gambar Kanan</span>
                    </button>
                  </div>
                </div>

                <div class="form-field">
                  <label>Judul Konten</label>
                  <input v-model="block.title" placeholder="Judul konten..." />
                </div>

                <div class="form-field">
                  <label>Isi Konten</label>
                  <QuillEditor v-model:content="block.content" content-type="html" />
                </div>

                <div class="form-field">
                  <label>Pilih Gambar</label>
                  <div class="asset-selector-premium" @click="$emit('openImagePicker', index)">
                    <div v-if="block.imageAssetId" class="image-preview-premium">
                      <img :src="getAssetUrl(block.imageAssetId)" />
                      <div class="preview-overlay">
                        <button class="btn-icon-sm" type="button">
                          <Icon icon="lucide:refresh-cw" />
                        </button>
                      </div>
                    </div>
                    <div v-else class="upload-placeholder">
                      <Icon icon="lucide:image-plus" width="32" />
                      <span>Pilih Gambar dari Asset</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Maps Block -->
              <div v-if="block.type === 'maps'" class="grid gap-5">
                <div class="form-field">
                  <label>Judul Seksi Peta (Opsional)</label>
                  <input v-model="block.title" placeholder="Lokasi Kami" />
                </div>
                <div class="form-field">
                  <label>Deskripsi Seksi Peta (Opsional)</label>
                  <textarea v-model="block.description" rows="3" placeholder="Deskripsi singkat lokasi/petunjuk..." />
                </div>
                <div class="form-field">
                  <label>Kode Embed Peta (Google Maps Iframe)</label>
                  <textarea 
                    v-model="block.mapEmbedCode" 
                    rows="6" 
                    placeholder="Tempel kode <iframe> dari Google Maps di sini..." 
                    class="font-mono text-xs"
                  ></textarea>
                  <div class="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mt-2 flex gap-2">
                    <Icon icon="lucide:info" class="flex-shrink-0" />
                    <span>Dapatkan kode ini di Google Maps > Share > Embed a map > Copy HTML.</span>
                  </div>
                </div>
              </div>

              <!-- WhatsApp Floating Block -->
              <div v-if="block.type === 'whatsapp-float'" class="grid gap-5">
                <div class="form-field">
                  <label>Nomor WhatsApp</label>
                  <input v-model="block.phoneNumber" placeholder="62812xxxxxxx" />
                  <p class="text-xs text-slate-400 mt-1">Gunakan format internasional tanpa tanda +, contoh: 6281234567890</p>
                </div>
                <div class="form-field">
                  <label>Pesan Default (Opsional)</label>
                  <textarea v-model="block.message" rows="3" placeholder="Halo, saya ingin bertanya..." />
                </div>
                <div class="form-field">
                  <label>Label Tombol (Opsional)</label>
                  <input v-model="block.label" placeholder="WhatsApp" />
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- Sticky Actions -->
    <div class="sticky-footer glass">
      <div class="flex gap-3">
        <button class="btn-ghost" type="button" @click="activeTab = activeTab === 'settings' ? 'content' : 'settings'">
          <Icon :icon="activeTab === 'settings' ? 'lucide:layout' : 'lucide:settings'" class="mr-2" />
          {{ activeTab === 'settings' ? 'Edit Konten' : 'Pengaturan' }}
        </button>
      </div>
      <button class="btn-primary px-10" type="button" @click="$emit('savePage')">
        <Icon icon="lucide:save" class="mr-2" />
        Simpan Perubahan
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import type { PageData, PageBlock } from "@/types/pageTypes";

interface Props {
  current: PageData;
  newBlockType: string;
  getAssetUrl: (id: string) => string;
  getAssetName: (id: string) => string;
  getProductName: (id: string) => string;
  getProductDescription: (id: string) => string;
  getProductImage: (id: string) => string;
  getProductPrice: (id: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  addBlock: [];
  moveBlockUp: [index: number];
  moveBlockDown: [index: number];
  removeBlock: [index: number];
  addColumn: [block: PageBlock];
  removeColumn: [block: PageBlock, index: number];
  addGalleryImage: [block: PageBlock];
  removeGalleryImage: [block: PageBlock, index: number];
  addFaqItem: [block: PageBlock];
  removeFaqItem: [block: PageBlock, index: number];
  openImagePicker: [index: number];
  openColumnImagePicker: [index: number, colIndex: number];
  openGalleryPicker: [index: number, galleryIndex: number];
  openProductModal: [block: PageBlock];
  openHeroBgPicker: [index: number];
  openHeroImagePicker: [index: number];
  openCarouselImagePicker: [index: number, slideIndex: number];
  openCtaBgPicker: [index: number];
  openNestedImagePicker: [blockIndex: number, colIndex: number, nestedIndex: number];
  addCarouselSlide: [block: PageBlock];
  removeCarouselSlide: [block: PageBlock, index: number];
  addBlockToColumn: [column: any, type: PageBlock['type']];
  removeBlockFromColumn: [column: any, index: number];
  updateNewBlockType: [type: string];
  savePage: [];
}>();

const activeTab = ref<"settings" | "content">("content");
const collapsedBlocks = ref<Record<string, boolean>>({});
const draggingIndex = ref<number | null>(null);

const blockTypes = [
  { value: "hero", label: "Hero", icon: "lucide:layout-template" },
  { value: "text", label: "Text", icon: "lucide:type" },
  { value: "image", label: "Image", icon: "lucide:image" },
  { value: "columns", label: "Columns", icon: "lucide:columns" },
  { value: "gallery", label: "Gallery", icon: "lucide:layout-grid" },
  { value: "product", label: "Product", icon: "lucide:shopping-bag" },
  { value: "btn", label: "Button", icon: "lucide:mouse-pointer-2" },
  { value: "faq", label: "FAQ", icon: "lucide:help-circle" },
  { value: "form", label: "Contact Form", icon: "lucide:mail" },
  { value: "carousel", label: "Carousel", icon: "lucide:layers" },
  { value: "cta-section", label: "CTA Section", icon: "lucide:megaphone" },
  { value: "maps", label: "Maps", icon: "lucide:map-pin" },
  { value: "split-content-left", label: "Left Align Content", icon: "lucide:panel-left" },
  { value: "split-content-right", label: "Right Align Content", icon: "lucide:panel-right" },
  { value: "whatsapp-float", label: "WhatsApp Floating", icon: "lucide:message-circle" },
];

const nestedAvailableTypes = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "btn", label: "Button" },
  { value: "faq", label: "FAQ" },
  { value: "product", label: "Product" },
];

function getBlockIcon(type: string) {
  return blockTypes.find((bt) => bt.value === type)?.icon || "lucide:box";
}

function getBlockKey(block: PageBlock, fallbackIndex?: number) {
  return String((block as any).id ?? fallbackIndex ?? "");
}

function isBlockCollapsed(block: PageBlock) {
  const key = getBlockKey(block);
  return !!collapsedBlocks.value[key];
}

function toggleBlockCollapsed(block: PageBlock) {
  const key = getBlockKey(block);
  collapsedBlocks.value[key] = !collapsedBlocks.value[key];
}

function onDragStartBlock(index: number) {
  draggingIndex.value = index;
}

function onDropBlock(dropIndex: number) {
  if (draggingIndex.value === null) return;
  const from = draggingIndex.value;
  const to = dropIndex;
  draggingIndex.value = null;
  if (from === to) return;
  const arr = props.current.blocks;
  const [moved] = arr.splice(from, 1);
  if (!moved) return;
  arr.splice(to, 0, moved);
}

function getBlockCardLabel(block: PageBlock) {
  if (block.type === "split-content") {
    return block.layout === "right" ? "Right Align Content" : "Left Align Content";
  }
  return block.type;
}

function getBlockCardIcon(block: PageBlock) {
  if (block.type === "split-content") {
    return block.layout === "right" ? "lucide:panel-right" : "lucide:panel-left";
  }
  return getBlockIcon(block.type);
}

function removeProductId(block: any, productId: string) {
  const index = block.productIds.indexOf(productId);
  if (index > -1) {
    block.productIds.splice(index, 1);
  }
}
</script>

<style scoped src="@/styles/cms/components/page-form.css"></style>
