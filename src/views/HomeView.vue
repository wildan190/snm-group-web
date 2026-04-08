<template>
  <div v-if="homePage" class="home-container">
    <CmsContentRenderer :page="homePage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSiteStore } from "@/stores/site";
import { Icon } from "@iconify/vue";
import api from "@/utils/api";
import CmsContentRenderer from "@/components/cms/CmsContentRenderer.vue";
import { applySeoFromPage } from "@/composables/useSeo";

const router = useRouter();
const siteStore = useSiteStore();
const site = siteStore.site;
const homePage = ref<any | null>(null);
const isLoading = ref(true);

async function loadHomePage(): Promise<void> {
  isLoading.value = true;
  try {
    const res = await api.get("/pages");
    const pages: any[] = res.data;
    const found = pages.find((page) => page.isHomepage) || null;
    if (!found) {
      router.push("/cms/login");
      return;
    }
    homePage.value = found;
    applySeoFromPage(found, siteStore.site, "/");
  } catch (err) {
    console.warn("Unable to load homepage", err);
    router.push("/cms/login");
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await siteStore.loadSite();
  await loadHomePage();
});
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
