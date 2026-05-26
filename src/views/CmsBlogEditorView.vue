<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBlog } from "@/composables/useBlog";
import { Icon } from "@iconify/vue";
import { QuillEditor } from "@vueup/vue-quill";
import AssetModal from "@/components/cms/AssetModal.vue";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import api from "@/utils/api";

const { currentPost, selectPost, savePost, loadPosts, posts } = useBlog();
const route = useRoute();
const router = useRouter();
const isEditMode = computed(() => !!route.params.id);
const isLoading = ref(true);

const assets = ref<any[]>([]);
const showAssetModal = ref(false);

async function loadAssets(): Promise<void> {
  const res = await api.get("/assets");
  assets.value = res.data || [];
}

onMounted(async () => {
  await loadAssets();
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
      featuredImageAssetId: "",
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

function getAssetUrl(assetId: string): string {
  const asset = assets.value.find((item) => String(item?._id || "") === String(assetId || ""));
  return asset ? asset.url : "";
}

function applyAsset(asset: any): void {
  currentPost.value.featuredImageAssetId = asset._id;
  showAssetModal.value = false;
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
  <div class="cms-blog-editor-view">
    <div v-if="isLoading" class="p-20 text-center">
      <Icon icon="lucide:loader-2" class="animate-spin mx-auto text-primary" width="48" />
    </div>

    <div v-else>
      <div class="page-header mb-6">
        <div>
          <h1>{{ isEditMode ? 'Edit Artikel' : 'Tulis Artikel Baru' }}</h1>
          <p class="text-sm text-slate-500">Editor artikel premium untuk blog website Anda.</p>
        </div>
        <router-link to="/cms/blog" class="btn btn-ghost">
          <Icon icon="lucide:arrow-left" class="mr-2" />
          Kembali ke Daftar
        </router-link>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <!-- Main Editor -->
        <div class="col-span-12 lg:col-span-8">
          <div class="card premium-card p-8">
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
              Publikasi
            </h3>
            
            <div class="form-field mb-4">
              <label>Status</label>
              <select v-model="currentPost.status" class="w-full">
                <option value="draft">Draft (Disimpan)</option>
                <option value="published">Terbitkan (Publik)</option>
              </select>
            </div>

            <div class="form-field mb-4">
              <label>URL Slug</label>
              <div class="flex items-center gap-2">
                <span class="text-slate-400 text-xs">/blog/</span>
                <input v-model="currentPost.slug" class="text-xs" />
              </div>
            </div>

            <button @click="handleSave" class="btn btn-primary w-full py-4 mt-2">
              <Icon icon="lucide:save" class="mr-2" />
              Simpan Perubahan
            </button>
          </div>

          <div class="card premium-card p-6 mb-6">
            <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon icon="lucide:image" />
              Gambar Utama
            </h3>
            
            <div class="asset-selector-wrapper">
              <button class="btn btn-secondary w-full" @click.prevent="showAssetModal = true">
                <Icon icon="lucide:image-plus" class="mr-2" />
                {{ currentPost.featuredImageAssetId ? "Ganti Gambar" : "Pilih Gambar" }}
              </button>
              
              <div v-if="currentPost.featuredImageAssetId" class="image-preview-box mt-4">
                <img :src="getAssetUrl(currentPost.featuredImageAssetId)" alt="Preview" />
                <button class="remove-img" @click="currentPost.featuredImageAssetId = ''">
                  <Icon icon="lucide:x" width="14" />
                </button>
              </div>
            </div>
          </div>

          <div class="card premium-card p-6 mb-6">
            <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Icon icon="lucide:align-left" />
              Ringkasan
            </h3>
            <div class="form-field">
              <textarea 
                v-model="currentPost.excerpt" 
                rows="4" 
                placeholder="Ringkasan singkat untuk tampilan daftar blog..."
                class="text-sm"
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
              <input v-model="currentPost.seoTitle" placeholder="Judul untuk Google..." class="text-sm" />
            </div>
            <div class="form-field">
              <label>SEO Description</label>
              <textarea v-model="currentPost.seoDescription" rows="3" placeholder="Deskripsi untuk Google..." class="text-sm"></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AssetModal
      v-if="showAssetModal"
      :show="showAssetModal"
      title="Pilih Gambar Artikel"
      :assets="assets"
      @select-asset="applyAsset"
      @close="showAssetModal = false"
    />
  </div>
</template>

<style scoped>
.cms-blog-editor-view { display: grid; gap: 1rem; padding: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; }
.page-header h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }

.premium-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid #eef2f6;
}

.form-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.title-input {
  width: 100%;
  font-size: 1.75rem;
  font-weight: 800;
  border: none;
  border-bottom: 2px solid #f1f5f9;
  padding: 0.5rem 0;
  outline: none;
  transition: border-color 0.3s ease;
  color: #0f172a;
}

.title-input:focus {
  border-color: #7E57FF;
}

.quill-wrapper {
  margin-top: 1rem;
}

:deep(.ql-container) {
  min-height: 450px;
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

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-primary {
  background: #7E57FF;
  color: white;
  border: none;
}

.btn-primary:hover {
  background: #6a3fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(126, 87, 255, 0.3);
}

.btn-secondary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-ghost {
  color: #64748b;
}

.btn-ghost:hover {
  background: #f1f5f9;
}

select, textarea, input:not(.title-input) {
  width: 100%;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  outline: none;
  background: #fdfdfd;
  transition: all 0.3s;
}

select:focus, textarea:focus, input:not(.title-input):focus {
  border-color: #7E57FF;
  background: white;
  box-shadow: 0 0 0 4px rgba(126, 87, 255, 0.1);
}

.image-preview-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.image-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #ef4444;
}
</style>
