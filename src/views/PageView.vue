<template>
  <div v-if="page" class="page-container">
    <CmsContentRenderer :page="page" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import api from "@/utils/api";
import CmsContentRenderer from "@/components/cms/CmsContentRenderer.vue";
import { useSiteStore } from "@/stores/site";
import { applySeoFromPage } from "@/composables/useSeo";

const route = useRoute();
const router = useRouter();
const siteStore = useSiteStore();
const page = ref<any | null>(null);
const isLoading = ref(true);

async function loadPage(): Promise<void> {
  isLoading.value = true;
  try {
    const res = await api.get(`/pages/${route.params.slug}`);
    if (!res.data) {
      router.push("/cms/login");
      return;
    }
    page.value = res.data;
    applySeoFromPage(page.value, siteStore.site, route.fullPath, siteStore.site.logoUrl);
  } catch (err) {
    console.warn("Unable to load page", err);
    page.value = null;
    router.push("/cms/login");
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await siteStore.loadSite();
  await loadPage();
});

watch(() => route.params.slug, () => {
  loadPage();
});
</script>

<style scoped>
</style>
