<template>
  <aside class="page-list-sidebar">
    <div class="sidebar-header">
      <h3 class="sidebar-title">Daftar Halaman</h3>
      <span class="badge badge-primary">{{ pages.length }}</span>
    </div>

    <div class="p-4 pt-0">
      <div class="search-input-wrapper">
        <Icon icon="lucide:search" class="search-icon" width="18" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari halaman..."
          class="w-full"
        />
      </div>

      <div class="list-container p-0">
        <div
          v-for="page in filteredPages"
          :key="page._id"
          class="premium-list-item"
          :class="{ active: currentId === page._id }"
          @click="$emit('select', page)"
        >
          <div class="item-icon-wrapper">
            <Icon icon="lucide:file-text" width="22" />
          </div>

          <div class="item-content">
            <span class="item-title">{{ page.title }}</span>
            <span class="item-subtitle">/{{ page.slug }}</span>
            <div v-if="page.isHomepage" class="mt-1">
              <span class="badge badge-blue">
                <Icon icon="lucide:home" class="mr-1" width="10" />
                Homepage
              </span>
            </div>
          </div>

          <div class="item-actions-hover" @click.stop>
            <button
              v-if="!page.isHomepage"
              class="btn-icon-sm success"
              title="Jadikan Homepage"
              @click="$emit('setHomepage', page)"
            >
              <Icon icon="lucide:home" width="16" />
            </button>
            <button
              class="btn-icon-sm"
              title="Edit"
              @click="$emit('select', page)"
            >
              <Icon icon="lucide:edit-3" width="16" />
            </button>
            <button
              class="btn-icon-sm danger"
              title="Hapus"
              @click="$emit('delete', page)"
            >
              <Icon icon="lucide:trash-2" width="16" />
            </button>
          </div>
        </div>

        <div v-if="filteredPages.length === 0" class="empty-state">
          <Icon icon="lucide:search-x" width="48" class="text-slate-200 mb-2" />
          <p>Halaman tidak ditemukan</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import type { PageData } from "@/types/pageTypes";

interface Props {
  pages: PageData[];
  currentId?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  select: [page: PageData];
  delete: [page: PageData];
  setHomepage: [page: PageData];
}>();

const searchQuery = ref("");

const filteredPages = computed(() => {
  if (!searchQuery.value) return props.pages;
  const q = searchQuery.value.toLowerCase();
  return props.pages.filter(
    (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
  );
});
</script>

<style scoped src="@/styles/cms/components/page-list.css"></style>
