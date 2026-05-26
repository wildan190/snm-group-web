<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/utils/api";
import type { BlogPost } from "@/types/blogTypes";
import { Icon } from "@iconify/vue";

const route = useRoute();
const router = useRouter();
const post = ref<BlogPost | null>(null);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const res = await api.get(`/blog/posts/${route.params.slug}`);
    post.value = res.data;
  } catch (err) {
    router.push("/blog");
  } finally {
    isLoading.value = false;
  }
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
  <div class="blog-detail-page">
    <div v-if="isLoading" class="p-20 text-center">
      <Icon icon="lucide:loader-2" class="animate-spin mx-auto text-primary" width="48" />
    </div>

    <div v-else-if="post">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-12 col-12">
              <div class="breadcrumbs-content text-center">
                <h1 class="page-title">{{ post.title }}</h1>
                <div class="post-meta flex justify-center gap-4 mt-4 text-white opacity-80">
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:calendar" />
                    {{ formatDate(post.publishedAt || post.createdAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Article Content -->
      <section class="section blog-single">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-10 col-12">
              <div class="single-inner">
                <div class="post-details">
                  <div class="detail-inner">
                    <div class="blog-content" v-html="post.content"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.blog-content {
  color: #444;
  line-height: 1.8;
  font-size: 18px;
}

:deep(.blog-content h1),
:deep(.blog-content h2),
:deep(.blog-content h3) {
  color: #081828;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

:deep(.blog-content p) {
  margin-bottom: 1.5rem;
}

:deep(.blog-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 15px;
  margin: 2rem 0;
}

:deep(.blog-content blockquote) {
  border-left: 5px solid #7E57FF;
  padding: 1.5rem;
  background: #f8fafc;
  font-style: italic;
  margin: 2rem 0;
  border-radius: 0 10px 10px 0;
}

:deep(.blog-content ul), 
:deep(.blog-content ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

:deep(.blog-content li) {
  margin-bottom: 0.5rem;
}
</style>
