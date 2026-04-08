<template>
  <div class="cms-pages-view">
    <div class="page-header">
      <div>
        <h1>Page Management</h1>
        <p class="text-sm text-slate-500">Kelola daftar halaman website</p>
      </div>
      <router-link to="/cms/pages/new" class="btn btn-primary">
        <Icon icon="lucide:plus" class="mr-2" />
        Create New Page
      </router-link>
    </div>

    <div class="page-content">
      <div class="table-card">
        <div class="table-head">
          <h3>Daftar Halaman</h3>
          <span class="badge badge-primary">{{ pages.length }}</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Slug</th>
                <th>Status</th>
                <th class="actions-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="page in pages" :key="page._id">
                <td>{{ page.title }}</td>
                <td>/{{ page.slug }}</td>
                <td>
                  <span v-if="page.pageStatus === 'draft'" class="badge">Draft</span>
                  <span v-else class="badge badge-success">Published</span>
                  <span v-if="page.isHomepage" class="badge badge-blue">Homepage</span>
                </td>
                <td class="actions-col">
                  <button class="btn-icon-sm" title="Edit" @click="goEdit(page._id)">
                    <Icon icon="lucide:edit-3" width="16" />
                  </button>
                  <button
                    v-if="!page.isHomepage"
                    class="btn-icon-sm success"
                    title="Jadikan Homepage"
                    @click="setHomepage(page)"
                  >
                    <Icon icon="lucide:home" width="16" />
                  </button>
                  <button class="btn-icon-sm danger" title="Hapus" @click="deletePage(page)">
                    <Icon icon="lucide:trash-2" width="16" />
                  </button>
                </td>
              </tr>
              <tr v-if="pages.length === 0">
                <td colspan="4" class="empty-row">Belum ada halaman.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { usePages } from "@/composables/usePages";
import type { PageData } from "@/types/pageTypes";

const {
  pages,
  loadPages,
  setHomepage,
  deletePage,
} = usePages();
const router = useRouter();

onMounted(async () => {
  await loadPages();
});

function goEdit(pageId?: string) {
  if (!pageId) return;
  router.push(`/cms/pages/${pageId}/edit`);
}

async function deletePageAndReload(page: PageData) {
  await deletePage(page);
  await loadPages();
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
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.table-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-head h3 {
  margin: 0;
  font-size: 1rem;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.actions-col {
  width: 180px;
  text-align: right !important;
}

.actions-col .btn-icon-sm {
  margin-left: 0.4rem;
}

.empty-row {
  text-align: center !important;
  color: #94a3b8;
}

</style>
