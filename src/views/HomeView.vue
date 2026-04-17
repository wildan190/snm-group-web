<template>
  <div v-if="homePage" class="home-container">
    <CmsContentRenderer :page="homePage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSiteStore } from "@/stores/site";
import api from "@/utils/api";
import CmsContentRenderer from "@/components/cms/CmsContentRenderer.vue";
import { applySeoFromPage } from "@/composables/useSeo";

const router = useRouter();
const siteStore = useSiteStore();
const homePage = ref<any | null>(null);

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 800;

function isNetworkError(err: any): boolean {
  // Axios network errors have no response (ECONNREFUSED, timeout, etc.)
  return !err.response || err.code === "ERR_NETWORK" || err.code === "ECONNABORTED";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadHomePage(): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await api.get("/pages");
      const pages: any[] = res.data;
      const found = pages.find((page) => page.isHomepage) || null;

      if (!found) {
        // Server is responding but no homepage configured — go to CMS
        router.push("/cms/login");
        return;
      }

      homePage.value = found;
      applySeoFromPage(found, siteStore.site, "/", siteStore.site.logoUrl);
      return; // success — exit loop
    } catch (err: any) {
      if (isNetworkError(err) && attempt < MAX_RETRIES - 1) {
        // Backend not ready yet — wait and retry
        const delay = Math.min(BASE_DELAY_MS * Math.pow(1.5, attempt), 4000);
        await sleep(delay);
        continue;
      }
      // Non-network error or max retries exceeded — give up
      console.warn("Unable to load homepage after retries", err);
      router.push("/cms/login");
      return;
    }
  }
}

onMounted(async () => {
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

