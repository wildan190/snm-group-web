<template>
  <section class="card">
    <div class="section-panel">
      <div class="panel-header">
        <div>
          <span class="overline">User Administration</span>
          <h2 class="page-title">Kelola User CMS</h2>
          <p class="hero-copy">
            Tambahkan user baru dan atur hak akses dengan tampilan yang bersih.
          </p>
        </div>
      </div>
      <div class="split-columns two">
        <aside class="card panel-panel">
          <h3 class="section-title">Daftar User</h3>
          <div class="grid">
            <div v-for="user in users" :key="user._id" class="card item-card">
              <div>
                <strong>{{ user.username }}</strong>
                <p class="item-meta">{{ user.role }}</p>
              </div>
              <button class="btn-icon-sm danger" title="Hapus User" @click="deleteUser(user)">
                <Icon icon="lucide:trash-2" width="16" />
              </button>
            </div>
          </div>
        </aside>
        <div class="card panel-panel">
          <h3 class="section-title">Tambah User Baru</h3>
          <div class="form-field">
            <label>Username</label>
            <input v-model="newUser.username" />
          </div>
          <div class="form-field">
            <label>Password</label>
            <input type="password" v-model="newUser.password" />
          </div>
          <div class="form-field">
            <label>Role</label>
            <select v-model="newUser.role">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button class="btn-primary w-full" @click="createUser">
            <Icon icon="lucide:user-plus" class="mr-2" />
            Tambah User
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Swal from "sweetalert2";
import api from "@/utils/api";
import { Icon } from "@iconify/vue";

type User = { _id: string; username: string; role: string };
const users = ref<User[]>([]);
const newUser = ref({ username: "", password: "", role: "editor" });

async function loadUsers(): Promise<void> {
  const res = await api.get("/auth/users");
  users.value = res.data;
}

async function createUser(): Promise<void> {
  if (!newUser.value.username || !newUser.value.password) {
    await Swal.fire({
      icon: "warning",
      title: "Username dan password diperlukan",
      confirmButtonText: "OK",
    });
    return;
  }
  await api.post("/auth/users", newUser.value);
  newUser.value = { username: "", password: "", role: "editor" };
  await loadUsers();
  await Swal.fire({
    icon: "success",
    title: "User tersimpan",
    timer: 1400,
    showConfirmButton: false,
  });
}

async function deleteUser(user: User): Promise<void> {
  const result = await Swal.fire({
    icon: "warning",
    title: "Hapus user ini?",
    text: `User ${user.username} akan dihapus permanen.`,
    showCancelButton: true,
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
    confirmButtonColor: "#ef4444",
  });
  if (!result.isConfirmed) return;

  try {
    await api.delete(`/auth/users/${user._id}`);
    await loadUsers();
    await Swal.fire({
      icon: "success",
      title: "User berhasil dihapus",
      timer: 1400,
      showConfirmButton: false,
    });
  } catch (err: any) {
    await Swal.fire({
      icon: "error",
      title: "Gagal menghapus user",
      text: err?.response?.data?.error || "Terjadi kesalahan saat menghapus user.",
    });
  }
}

onMounted(loadUsers);
</script>

<style scoped>
.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
