<template>
  <div v-if="page || blocks" class="page-renderer" :class="{ 'is-nested': !!blocks, 'is-preview': isPreview }">
    <!-- ===== AUTOMATIC BREADCRUMBS ===== -->
    <section v-if="showBreadcrumbs" class="breadcrumbs">
      <div class="container text-center">
        <div class="breadcrumbs-content">
          <h1 class="page-title">{{ page.title }}</h1>
          <ul class="breadcrumb-nav">
            <li><a href="/">Home</a></li>
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
                <CmsContentRenderer :blocks="col.blocks" :is-preview="isPreview" :assets-data="assetsData" :products-data="productsData" />
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
                <a :href="'/shop/product/' + product._id" class="btn btn-primary" style="font-size: 13px; padding: 10px 20px;">
                  Lihat Detail
                </a>
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

      <!-- ===== CUSTOM CODE BLOCK ===== -->
      <div v-else-if="block.type === 'custom-code'" class="custom-code-wrapper" v-html="block.code"></div>

      <!-- ===== CARDS BLOCK ===== -->
      <section v-else-if="block.type === 'cards'" class="section cards-section" :class="`variant-${block.variant || 'default'}`">
        <div class="container">
          <div class="section-title text-center" v-if="block.title || block.description">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <p v-if="block.description">{{ block.description }}</p>
          </div>
          <div class="row">
            <div v-for="(item, i) in block.items" :key="i" :class="block.variant === 'horizontal' ? 'col-lg-6 col-12' : 'col-lg-4 col-md-6 col-12'" class="mb-4">
              <!-- Default Style: Icon Top -->
              <div v-if="!block.variant || block.variant === 'default'" class="single-service wow fadeInUp" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`" style="height: 100%">
                <div class="main-icon" v-if="item.icon">
                  <Icon :icon="item.icon" width="32" />
                </div>
                <h4 class="text-title">{{ item.title }}</h4>
                <p>{{ item.content }}</p>
                <div v-if="item.ctaText && item.ctaUrl" class="mt-4">
                  <a :href="item.ctaUrl" class="btn btn-ghost btn-sm">
                    {{ item.ctaText }} <Icon icon="lucide:arrow-right" class="ml-1" width="14" />
                  </a>
                </div>
              </div>

              <!-- Horizontal Style: Icon Left -->
              <div v-else-if="block.variant === 'horizontal'" class="horizontal-card wow fadeInUp" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
                <div class="card-icon-wrap">
                  <Icon v-if="item.icon" :icon="item.icon" width="28" />
                </div>
                <div class="card-body">
                  <h4 class="text-title">{{ item.title }}</h4>
                  <p class="service-body">{{ item.content }}</p>
                  <a v-if="item.ctaText && item.ctaUrl" :href="item.ctaUrl" class="service-link">
                    {{ item.ctaText }} <Icon icon="lucide:chevron-right" width="16" />
                  </a>
                </div>
              </div>

              <!-- Minimal Style: Bordered -->
              <div v-else-if="block.variant === 'minimal'" class="minimal-card wow fadeInUp" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
                <div class="flex items-center gap-3 mb-4">
                  <Icon v-if="item.icon" :icon="item.icon" width="24" class="text-primary" />
                  <h4 class="text-title mb-0">{{ item.title }}</h4>
                </div>
                <p class="service-body">{{ item.content }}</p>
                <a v-if="item.ctaText && item.ctaUrl" :href="item.ctaUrl" class="btn btn-primary btn-sm w-full">{{ item.ctaText }}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== PRICING CARDS BLOCK ===== -->
      <section v-else-if="block.type === 'pricing-cards'" class="section pricing-section bg-light" :class="`variant-${block.variant || 'default'}`">
        <div class="container">
          <div class="section-title text-center" v-if="block.title || block.description">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <p v-if="block.description">{{ block.description }}</p>
          </div>
          
          <!-- Default Style: Classic Vertical -->
          <div v-if="!block.variant || block.variant === 'default'" class="row align-items-center justify-content-center">
            <div v-for="(plan, i) in block.plans" :key="i" class="col-lg-4 col-md-6 col-12 mb-4">
              <div class="single-table wow fadeInUp" :class="{ 'featured': plan.isFeatured }" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
                <div class="table-head">
                  <h4 class="title">{{ plan.name }}</h4>
                  <div class="price">
                    <p class="amount">Rp {{ plan.price }}<span class="duration">{{ plan.period }}</span></p>
                  </div>
                </div>
                <ul class="table-list">
                  <li v-for="(feature, fIdx) in plan.features" :key="fIdx">
                    <Icon icon="lucide:check" class="mr-2 text-primary" width="16" /> {{ feature }}
                  </li>
                </ul>
                <div class="button">
                  <a :href="plan.ctaUrl" class="btn" :class="plan.isFeatured ? 'btn-primary' : 'btn-alt'">{{ plan.ctaText }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Modern Style: High Shadow & Colors -->
          <div v-else-if="block.variant === 'modern'" class="row justify-content-center">
            <div v-for="(plan, i) in block.plans" :key="i" class="col-lg-4 col-md-6 col-12 mb-4">
              <div class="modern-pricing wow fadeInUp" :class="{ 'featured': plan.isFeatured }" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
                <div class="p-10 text-center" :class="plan.isFeatured ? 'bg-primary text-white' : 'bg-slate-50'">
                  <span v-if="plan.isFeatured" class="bg-white text-primary px-4 py-1 rounded-full text-[11px] font-bold uppercase mb-4 inline-block">Populer</span>
                  <h4 class="text-2xl font-bold mb-3" :class="plan.isFeatured ? 'text-white' : 'text-slate-900'">{{ plan.name }}</h4>
                  <div class="flex items-baseline justify-center gap-1">
                    <span class="text-sm font-bold">Rp</span>
                    <span class="text-4xl font-black">{{ plan.price }}</span>
                    <span class="text-sm opacity-70">{{ plan.period }}</span>
                  </div>
                </div>
                <div class="p-10">
                  <ul class="table-list mb-10">
                    <li v-for="(feature, fIdx) in plan.features" :key="fIdx" class="flex items-start gap-3 border-0 p-0 mb-4">
                      <div class="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon icon="lucide:check" width="12" />
                      </div>
                      <span class="text-slate-600 font-medium">{{ feature }}</span>
                    </li>
                  </ul>
                  <a :href="plan.ctaUrl" class="btn btn-primary w-full py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-transform">{{ plan.ctaText }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Compact Style: Horizontal Rows -->
          <div v-else-if="block.variant === 'compact'" class="max-w-4xl mx-auto space-y-4">
            <div v-for="(plan, i) in block.plans" :key="i" class="compact-plan wow fadeInUp" :class="{ 'featured': plan.isFeatured }" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <h4 class="text-xl font-bold mb-0">{{ plan.name }}</h4>
                  <span v-if="plan.isFeatured" class="bg-primary text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Rekomendasi</span>
                </div>
                <p class="service-body mb-0">{{ plan.features.join(', ') }}</p>
              </div>
              <div class="text-center md:text-right px-6 md:border-x-2 border-slate-50">
                <div class="text-2xl font-black text-primary">Rp {{ plan.price }}</div>
                <div class="text-xs text-slate-400">{{ plan.period }}</div>
              </div>
              <div class="w-full md:w-auto">
                <a :href="plan.ctaUrl" class="btn btn-primary btn-sm px-8">{{ plan.ctaText }}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== CLIENTS BLOCK ===== -->
      <section v-else-if="block.type === 'clients'" class="section clients-section" :class="`variant-${block.variant || 'grid'}`">
        <div class="container">
          <div class="section-title text-center" v-if="block.title || block.description">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <p v-if="block.description">{{ block.description }}</p>
          </div>

          <!-- Style 1: Grid (Static) -->
          <div v-if="!block.variant || block.variant === 'grid'" class="row justify-content-center align-items-center">
            <div v-for="(client, i) in block.items" :key="i" class="col-lg-3 col-md-4 col-6 mb-6">
              <div class="client-logo-box wow fadeInUp" :data-wow-delay="`${0.1 * (Number(i) + 1)}s`">
                <a :href="client.link || '#'" :target="client.link ? '_blank' : '_self'" class="client-link">
                  <img v-if="client.imageAssetId" :src="getAssetUrl(client.imageAssetId)" :alt="client.name" class="client-img" />
                  <div v-else class="client-placeholder">{{ client.name || 'Logo Client' }}</div>
                </a>
              </div>
            </div>
          </div>

          <!-- Style 2: Marquee (Running) -->
          <div v-else-if="block.variant === 'marquee'" class="marquee-wrapper overflow-hidden">
            <div class="marquee-track">
              <!-- Double the items for seamless loop -->
              <div v-for="(client, i) in [...block.items, ...block.items]" :key="i" class="marquee-item">
                <div class="client-logo-box minimal">
                   <img v-if="client.imageAssetId" :src="getAssetUrl(client.imageAssetId)" :alt="client.name" class="client-img" />
                   <div v-else class="client-placeholder">{{ client.name || 'Logo Client' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Style 3: Minimal List -->
          <div v-else-if="block.variant === 'minimal'" class="row justify-content-center">
            <div class="col-lg-10">
              <div class="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                <div v-for="(client, i) in block.items" :key="i" class="client-logo-mini">
                  <img v-if="client.imageAssetId" :src="getAssetUrl(client.imageAssetId)" :alt="client.name" style="height: 40px; width: auto; object-fit: contain;" />
                  <span v-else class="text-sm font-bold">{{ client.name }}</span>
                </div>
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
  isPreview?: boolean;
  assetsData?: any[];
  productsData?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  isPreview: false
});

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

const assets = ref<any[]>(props.assetsData || []);
const products = ref<any[]>(props.productsData || []);
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
  if (props.assetsData && props.assetsData.length > 0) return;
  try {
    const res = await api.get("/assets");
    assets.value = res.data;
  } catch (err) {
    console.error("Failed to load assets", err);
  }
}

async function loadProducts() {
  if (props.productsData && props.productsData.length > 0) return;
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

<style scoped src="@/styles/cms/components/content-renderer.css"></style>
