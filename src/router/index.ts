import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import PageView from '@/views/PageView.vue'
import ProductsView from '@/views/ProductsView.vue'
import CmsLoginView from '@/views/CmsLoginView.vue'
import CmsDashboardView from '@/views/CmsDashboardView.vue'
import CmsLayout from '@/components/CmsLayout.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', name: 'products', component: ProductsView },
  { path: '/page/:slug', name: 'page', component: PageView },
  {
    path: '/cms',
    component: CmsLayout,
    children: [
      { path: 'login', name: 'cms-login', component: CmsLoginView },
      { path: 'dashboard', name: 'cms-dashboard', component: CmsDashboardView, meta: { auth: true } },
      { path: 'pages', name: 'cms-pages', component: () => import('@/views/CmsPagesView.vue'), meta: { auth: true } },
      { path: 'products', name: 'cms-products', component: () => import('@/views/CmsProductsView.vue'), meta: { auth: true } },
      { path: 'settings', name: 'cms-settings', component: () => import('@/views/CmsSettingsView.vue'), meta: { auth: true } },
      { path: 'navbar', name: 'cms-navbar', component: () => import('@/views/CmsNavbarView.vue'), meta: { auth: true } },
      { path: 'users', name: 'cms-users', component: () => import('@/views/CmsUsersView.vue'), meta: { auth: true } },
      { path: 'assets', name: 'cms-assets', component: () => import('@/views/CmsAssetsView.vue'), meta: { auth: true } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.auth)
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'cms-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'cms-login' && auth.isAuthenticated) {
    return { name: 'cms-dashboard' }
  }
  return true
})

export default router
