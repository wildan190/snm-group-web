<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBlog } from "@/composables/useBlog";
import { Icon } from "@iconify/vue";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import api from "@/utils/api";

const { currentPost, selectPost, savePost, loadPosts, posts } = useBlog();
const route = useRoute();
const router = useRouter();
const isEditMode = computed(() => !!route.params.id);
const isLoading = ref(true);

onMounted(async () => {
  if (isEditMode.value) {
    await loadPosts();
    const post = posts.value.find(p => p._id === route.params.id);
    if (post) {
      await selectPost(post);
    } else {
      router.push("/cms/blog");
    }
  } else {
    currentPost.value = {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  isLoading.value = false;
});

function generateSlug() {
  if (!currentPost.value.title) return;
  currentPost.value.slug = currentPost.value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function handleSave() {
  await savePost();
  router.push("/cms/blog");
}

const quillOptions = {
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "blockquote", "code-block"],
      ["clean"],
    ],
  },
  placeholder: "Tulis isi artikel di sini...",
  theme: "snow",
};
</script>

<template>
  <div class="cms-blog-editor">
    <div v-if="isLoading" class="p-20 text-center">
      <Icon icon="lucide:loader-2" class="animate-spin mx-auto text-primary" width="48" />
    </div>

    <div v-else>
      <div class="view-header mb-6 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <router-link to="/cms/blog" class="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Icon icon="lucide:arrow-left" width="24" />
          </router-link>
          <div>
            <h2 class="text-2xl font-bold text-slate-800">
              {{ isEditMode ? 'Edit Artikel' : 'Tulis Artikel Baru' }}
            </h2>
          </div>
        </div>
        <div class="flex gap-3">
          <select v-model="currentPost.status" class="status-select">
            <option value="draft">Draft</option>
            <option value="published">Terbitkan</option>
          </select>
          <button @click="handleSave" class="btn btn-primary">
            <Icon icon="lucide:save" class="mr-2" />
            Simpan Artikel
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- Main Editor -->
        <div class="col-span-12 lg:col-span-8">
          <div class="card premium-card p-6 mb-6">
            <div class="form-field mb-6">
              <label>Judul Artikel</label>
              <input 
                v-model="currentPost.title" 
                @blur="!currentPost.slug && generateSlug()"
                placeholder="Masukkan judul artikel yang menarik..."
                class="title-input"
              />
            </div>

            <div class="form-field mb-6">
              <label>Isi Artikel</label>
              <div class="quill-wrapper">
                <QuillEditor 
                  v-model:content="currentPost.content" 
                  content-type="html"
                  :options="quillOptions"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Options -->
        <div class="col-span-12 lg:col-span-4">
          <div class="card premium-card p-6 mb-6">
            <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon icon="lucide:settings" />
              Pengaturan Artikel
            </h3>
            
            <div class="form-field mb-4">
              <label>URL Slug</label>
              <div class="flex items-center gap-2">
                <span class="text-slate-400 text-sm">/blog/</span>
                <input v-model="currentPost.slug" class="slug-input" />
              </div>
            </div>

            <div class="form-field mb-4">
              <label>Ringkasan (Excerpt)</label>
              <textarea 
                v-model="currentPost.excerpt" 
                rows="4" 
                placeholder="Ringkasan singkat untuk tampilan daftar blog..."
              ></textarea>
            </div>
          </div>

          <div class="card premium-card p-6">
            <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon icon="lucide:search" />
              SEO & Metadata
            </h3>
            <div class="form-field mb-4">
              <label>SEO Title</label>
              <input v-model="currentPost.seoTitle" placeholder="Judul untuk Google..." />
            </div>
            <div class="form-field">
              <label>SEO Description</label>
              <textarea v-model="currentPost.seoDescription" rows="3" placeholder="Deskripsi untuk Google..."></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid #eef2f6;
}

.form-field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.title-input {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 800;
  border: none;
  border-bottom: 2px solid #f1f5f9;
  padding: 0.5rem 0;
  outline: none;
  transition: border-color 0.3s ease;
}

.title-input:focus {
  border-color: #7E57FF;
}

.quill-wrapper {
  min-height: 400px;
}

:deep(.ql-container) {
  min-height: 350px;
  font-size: 1rem;
  font-family: inherit;
}

:deep(.ql-toolbar) {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-color: #f1f5f9;
  background: #f8fafc;
}

:deep(.ql-container) {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  border-color: #f1f5f9;
}

.status-select {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-weight: 600;
  outline: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #7E57FF;
  color: white;
}

.slug-input, textarea, input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  outline: none;
  font-size: 0.875rem;
}

textarea:focus, input:focus {
  border-color: #7E57FF;
}
</style>
