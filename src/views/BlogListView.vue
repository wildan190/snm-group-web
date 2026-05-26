<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBlog } from "@/composables/useBlog";
import { Icon } from "@iconify/vue";

const { posts, loadPosts } = useBlog();
const isLoading = ref(true);

onMounted(async () => {
  await loadPosts();
  isLoading.value = false;
});

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <div class="blog-list-page">
    <!-- Breadcrumbs -->
    <div class="breadcrumbs">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6 col-md-6 col-12">
            <div class="breadcrumbs-content">
              <h1 class="page-title">Blog & Artikel</h1>
              <p>Wawasan terbaru mengenai teknologi, bisnis, dan inovasi dari tim kami.</p>
            </div>
          </div>
          <div class="col-lg-6 col-md-6 col-12">
            <ul class="breadcrumb-nav">
              <li><router-link to="/">Home</router-link></li>
              <li>Blog</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Section -->
    <section class="section latest-news-area blog-grid-page">
      <div class="container">
        <div v-if="isLoading" class="p-20 text-center">
          <Icon icon="lucide:loader-2" class="animate-spin mx-auto text-primary" width="48" />
        </div>

        <div v-else-if="posts.length === 0" class="text-center p-20">
          <h3 class="text-slate-500">Belum ada artikel yang diterbitkan.</h3>
        </div>

        <div v-else class="row">
          <div v-for="post in posts" :key="post._id" class="col-lg-4 col-md-6 col-12">
            <div class="single-news wow fadeInUp" data-wow-delay=".2s">
              <div class="image">
                <router-link :to="'/blog/' + post.slug">
                  <img v-if="post.featuredImageAssetId" src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Blog" />
                  <div v-else class="placeholder-img">
                    <Icon icon="lucide:image" width="48" />
                  </div>
                </router-link>
              </div>
              <div class="content-body">
                <h4 class="title">
                  <router-link :to="'/blog/' + post.slug">{{ post.title }}</router-link>
                </h4>
                <p>{{ post.excerpt || 'Temukan wawasan menarik dan informasi terbaru melalui artikel lengkap kami yang membahas topik ini secara mendalam.' }}</p>
                <div class="meta-details">
                  <span>
                    <Icon icon="lucide:calendar" />
                    {{ formatDate(post.publishedAt || post.createdAt) }}
                  </span>
                  <router-link :to="'/blog/' + post.slug" class="read-more">
                    Selengkapnya <Icon icon="lucide:arrow-right" />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.placeholder-img {
  height: 250px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
}

.single-news {
  background: #fff;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-bottom: 30px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.single-news:hover {
  transform: translateY(-10px);
}

.single-news .image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.content-body {
  padding: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-body .title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 15px;
  line-height: 1.4;
}

.content-body .title a {
  color: #081828;
}

.content-body .title a:hover {
  color: #7E57FF;
}

.content-body p {
  color: #727272;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 25px;
  flex: 1;
}

.meta-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
}

.meta-details ul li {
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.read-more {
  font-size: 14px;
  font-weight: 700;
  color: #7E57FF;
  display: flex;
  align-items: center;
}

.read-more:hover {
  gap: 5px;
}
</style>
