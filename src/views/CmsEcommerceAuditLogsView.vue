<template>
  <div class="audit-page">
    <div class="hero card">
      <div class="hero-left">
        <p class="hero-overline">Compliance & Activity Trail</p>
        <h1 class="page-title">Audit Log Ecommerce</h1>
        <p class="text-slate-500">Riwayat perubahan konfigurasi, order action, dan event payment untuk monitoring operasional.</p>
      </div>
      <div class="hero-actions">
        <button class="btn-secondary" @click="loadLogs">Refresh</button>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span>Total Event</span>
        <strong>{{ logs.length }}</strong>
      </div>
      <div class="stat-card">
        <span>Hasil Filter</span>
        <strong>{{ filteredLogs.length }}</strong>
      </div>
      <div class="stat-card">
        <span>User Aktif (tercatat)</span>
        <strong>{{ activeActors }}</strong>
      </div>
      <div class="stat-card">
        <span>Action Type</span>
        <strong>{{ actionTypes }}</strong>
      </div>
    </div>

    <div class="card section">
      <div class="toolbar card-soft">
        <input v-model="searchQuery" placeholder="Cari aksi / user / payload..." />
      </div>
      <div class="table-wrap">
        <table class="mini-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Aksi</th>
              <th>User</th>
              <th>Role</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log._id">
              <td class="time-col">{{ formatDate(log.createdAt) }}</td>
              <td><span class="action-chip">{{ log.action }}</span></td>
              <td>{{ log.actorUsername || "-" }}</td>
              <td>
                <span class="role-chip" :class="roleClass(log.actorRole)">
                  {{ log.actorRole || "-" }}
                </span>
              </td>
              <td><code class="payload">{{ stringifyPayload(log.payload) }}</code></td>
            </tr>
            <tr v-if="!filteredLogs.length">
              <td colspan="5" class="empty-row">Belum ada audit log.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "@/utils/api";

const logs = ref<any[]>([]);
const searchQuery = ref("");

const filteredLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return logs.value;
  return logs.value.filter((log) => {
    const hay = `${log?.action || ""} ${log?.actorUsername || ""} ${log?.actorRole || ""} ${JSON.stringify(log?.payload || {})}`.toLowerCase();
    return hay.includes(q);
  });
});

const activeActors = computed(() => {
  const users = new Set(
    logs.value
      .map((x) => String(x?.actorUsername || "").trim())
      .filter(Boolean),
  );
  return users.size;
});

const actionTypes = computed(() => {
  const actions = new Set(
    logs.value
      .map((x) => String(x?.action || "").trim())
      .filter(Boolean),
  );
  return actions.size;
});

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

function stringifyPayload(payload: any) {
  try {
    return JSON.stringify(payload || {}, null, 0);
  } catch {
    return "{}";
  }
}

function roleClass(role?: string) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return "admin";
  if (value === "editor") return "editor";
  return "default";
}

async function loadLogs() {
  const res = await api.get("/ecommerce/audit-logs");
  logs.value = res.data || [];
}

onMounted(loadLogs);
</script>

<style scoped>
.audit-page { display: grid; gap: 0.8rem; padding: 0.75rem; }
.hero { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.8rem; padding: 1rem; border: 1px solid #e2e8f0; background: linear-gradient(120deg, #ffffff 0%, #f8faff 65%, #f3f4ff 100%); }
.hero-overline { font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.25rem; }
.hero-actions { display: flex; gap: 0.5rem; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; }
.stat-card { border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 0.65rem 0.75rem; display: grid; gap: 0.2rem; }
.stat-card span { color: #64748b; font-size: 0.76rem; }
.stat-card strong { font-size: 1.05rem; color: #0f172a; }
.card-soft { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.55rem; }
.toolbar { margin-bottom: 0.55rem; }
.table-wrap { overflow-x: auto; }
.mini-table { width: 100%; border-collapse: collapse; }
.mini-table th,.mini-table td { border-bottom: 1px solid #f1f5f9; padding: 0.55rem 0.6rem; vertical-align: top; font-size: 0.83rem; }
.mini-table thead th { background: #f8fafc; position: sticky; top: 0; z-index: 2; }
.time-col { white-space: nowrap; color: #475569; }
.action-chip { display: inline-block; border: 1px solid #dbeafe; background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.75rem; font-weight: 600; }
.role-chip { display: inline-block; border-radius: 999px; padding: 0.12rem 0.45rem; font-size: 0.74rem; font-weight: 700; text-transform: uppercase; }
.role-chip.admin { background: #fee2e2; color: #b91c1c; }
.role-chip.editor { background: #dcfce7; color: #166534; }
.role-chip.default { background: #e2e8f0; color: #334155; }
.payload { display: inline-block; max-width: 520px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.2rem 0.35rem; border-radius: 6px; }
.empty-row { text-align: center; color: #64748b; padding: 1rem 0; }
@media (max-width: 900px) {
  .hero { flex-direction: column; }
  .stats { grid-template-columns: 1fr 1fr; }
}
</style>
