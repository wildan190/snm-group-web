<script setup lang="ts">
import { onMounted } from "vue";
import { useBlog } from "@/composables/useBlog";
import { Icon } from "@iconify/vue";
import { useRouter } from "vue-router";

const { posts, loadPosts, deletePost } = useBlog();
const router = useRouter();

onMounted(async () => {
  await loadPosts();
});

function editPost(id: string) {
  router.push(`/cms/blog/${id}/edit`);
}

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
  <div class="cms-blog-view">
    <div class="view-header mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Manajemen Blog</h2>
        <p class="text-slate-500">Tulis dan kelola artikel untuk website Anda.</p>
      </div>
      <router-link to="/cms/blog/new" class="btn btn-primary">
        <Icon icon="lucide:plus" class="mr-2" />
        Tulis Artikel Baru
      </router-link>
    </div>

    <div class="card premium-card overflow-hidden">
      <div v-if="posts.length === 0" class="p-20 text-center">
        <div class="text-slate-300 mb-4">
          <Icon icon="lucide:file-text" width="64" class="mx-auto" />
        </div>
        <h3 class="text-xl font-bold text-slate-700">Belum ada artikel</h3>
        <p class="text-slate-500 mb-6">Mulai tulis artikel pertama Anda hari ini.</p>
        <router-link to="/cms/blog/new" class="btn btn-primary">
          Tulis Sekarang
        </router-link>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="p-4 text-xs font-bold uppercase text-slate-500">Judul Artikel</th>
              <th class="p-4 text-xs font-bold uppercase text-slate-500">Status</th>
              <th class="p-4 text-xs font-bold uppercase text-slate-500">Tanggal</th>
              <th class="p-4 text-xs font-bold uppercase text-slate-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post._id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="p-4">
                <div class="font-bold text-slate-800">{{ post.title }}</div>
                <div class="text-xs text-slate-400">/blog/{{ post.slug }}</div>
              </td>
              <td class="p-4">
                <span 
                  class="px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                  :class="post.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'"
                >
                  {{ post.status === 'published' ? 'Terbit' : 'Draft' }}
                </span>
              </td>
              <td class="p-4 text-sm text-slate-500">
                {{ formatDate(post.publishedAt || post.createdAt) }}
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="editPost(post._id!)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Icon icon="lucide:edit-3" />
                  </button>
                  <button @click="deletePost(post)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                    <Icon icon="lucide:trash-2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

.btn-primary:hover {
  background: #6a3fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(126, 87, 255, 0.3);
}
</style>
