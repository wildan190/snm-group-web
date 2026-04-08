<template>
  <section class="card auth-panel">
    <div class="section-panel">
      <div class="panel-header">
        <div>
          <span class="overline">Secure Login</span>
          <h2 class="page-title">Masuk ke CMS</h2>
          <p class="hero-copy">
            Kelola halaman, produk, aset, dan konfigurasi situs dengan tampilan
            yang rapi.
          </p>
        </div>
      </div>
      <form @submit.prevent="onSubmit" class="form-layout">
        <div class="form-field">
          <label>Username</label>
          <input v-model="username" placeholder="Admin" />
        </div>
        <div class="form-field">
          <label>Password</label>
          <input
            type="password"
            v-model="password"
            placeholder="Manchester@2025"
          />
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          Masuk Sekarang
        </button>
        <p v-if="error" class="error-text">{{ error }}</p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const username = ref("Admin");
const password = ref("Manchester@2025");
const error = ref("");

async function onSubmit() {
  error.value = "";
  const success = await auth.login(username.value, password.value);
  if (success) {
    const redirect = route.query.redirect || "/cms/dashboard";
    router.push(redirect as string);
  } else {
    error.value = "Login gagal. Periksa username dan password.";
  }
}
</script>
