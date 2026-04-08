<template>
  <div class="cms-auth-layout">
    <div class="auth-card-wrap">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.cms-auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background:
    radial-gradient(1200px 500px at 10% -10%, rgba(126, 87, 255, 0.14), transparent),
    radial-gradient(800px 400px at 100% 0%, rgba(14, 165, 233, 0.12), transparent),
    #f8fafc;
}

.auth-card-wrap {
  width: 100%;
  max-width: 560px;
}
</style>
