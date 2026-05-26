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
    <div class="page-header">
      <div>
        <h1>Blog Management</h1>
        <p class="text-sm text-slate-500">Tulis dan kelola artikel untuk website Anda.</p>
      </div>
      <router-link to="/cms/blog/new" class="btn btn-primary">
        <Icon icon="lucide:plus" class="mr-2" />
        Tulis Artikel Baru
      </router-link>
    </div>

    <div class="page-content">
      <div v-if="posts.length === 0" class="empty-state-card card premium-card">
        <div class="empty-illustration">
          <div class="icon-circle">
            <Icon icon="lucide:pen-tool" width="48" />
          </div>
          <div class="sparkles">
            <Icon icon="lucide:sparkles" class="sparkle s1" />
            <Icon icon="lucide:sparkles" class="sparkle s2" />
          </div>
        </div>
        <h3>Belum ada artikel</h3>
        <p>Mulai tulis artikel pertama Anda hari ini untuk meningkatkan engagement pengunjung.</p>
        <router-link to="/cms/blog/new" class="btn btn-primary px-10 py-4">
          Tulis Sekarang
        </router-link>
      </div>

      <div v-else class="table-card card premium-card overflow-hidden">
        <div class="table-head">
          <h3>Daftar Artikel</h3>
          <span class="badge badge-primary">{{ posts.length }}</span>
        </div>
        <div class="table-wrap overflow-x-auto">
          <table class="data-table w-full text-left border-collapse">
            <thead>
              <tr>
                <th class="uppercase">Judul Artikel</th>
                <th class="uppercase">Status</th>
                <th class="uppercase">Tanggal</th>
                <th class="uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in posts" :key="post._id" class="hover:bg-slate-50/50 transition-colors">
                <td class="p-6">
                  <div class="font-bold text-slate-800">{{ post.title }}</div>
                  <div class="text-xs text-slate-400 mt-1">/blog/{{ post.slug }}</div>
                </td>
                <td class="p-6">
                  <span 
                    class="status-badge"
                    :class="post.status === 'published' ? 'status-published' : 'status-draft'"
                  >
                    {{ post.status === 'published' ? 'Terbit' : 'Draft' }}
                  </span>
                </td>
                <td class="p-6 text-sm text-slate-500">
                  {{ formatDate(post.publishedAt || post.createdAt) }}
                </td>
                <td class="p-6 text-right">
                  <div class="flex justify-end gap-2">
                    <button @click="editPost(post._id!)" class="btn-icon-sm" title="Edit">
                      <Icon icon="lucide:edit-3" width="16" />
                    </button>
                    <button @click="deletePost(post)" class="btn-icon-sm danger" title="Hapus">
                      <Icon icon="lucide:trash-2" width="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cms-blog-view {
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
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.premium-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* Empty State Styling */
.empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  background: white;
}

.empty-illustration {
  position: relative;
  margin-bottom: 2rem;
}

.icon-circle {
  width: 100px;
  height: 100px;
  background: #f3f0ff;
  color: #7e57ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.sparkles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  color: #ffd700;
  animation: float 3s ease-in-out infinite;
}

.sparkle.s1 { top: -10px; right: -10px; }
.sparkle.s2 { bottom: 10px; left: -20px; animation-delay: 1.5s; }

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
}

.empty-state-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
}

.empty-state-card p {
  color: #64748b;
  max-width: 400px;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Table Styling */
.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.data-table th {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

/* Badges & Buttons */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-primary {
  background: #7e57ff;
  color: white;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-published {
  background: #ecfdf5;
  color: #10b981;
}

.status-draft {
  background: #fffbeb;
  color: #f59e0b;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #7e57ff;
  color: white;
}

.btn-primary:hover {
  background: #6a49e0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(126, 87, 255, 0.25);
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-sm:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-icon-sm.danger:hover {
  background: #fef2f2;
  color: #ef4444;
}
</style>
