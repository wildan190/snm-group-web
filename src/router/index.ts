import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import PageView from '@/views/PageView.vue'
import EcommerceView from '@/views/EcommerceView.vue'
import EcommerceTrackView from '@/views/EcommerceTrackView.vue'
import EcommerceCartView from '@/views/EcommerceCartView.vue'
import EcommerceProductDetailView from '@/views/EcommerceProductDetailView.vue'
import CmsLoginView from '@/views/CmsLoginView.vue'
import CmsDashboardView from '@/views/CmsDashboardView.vue'
import CmsLayout from '@/components/CmsLayout.vue'
import CmsAuthLayout from '@/components/CmsAuthLayout.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/products', redirect: '/shop' },
  { path: '/products/:id', redirect: (to: any) => `/shop/product/${to.params.id}` },
  { path: '/shop', name: 'shop', component: EcommerceView },
  { path: '/shop/cart', name: 'shop-cart', component: EcommerceCartView },
  { path: '/shop/product/:id', name: 'shop-product-detail', component: EcommerceProductDetailView },
  { path: '/shop/track', name: 'shop-track', component: EcommerceTrackView },
  { path: '/shop/track/:orderId', name: 'shop-track-detail', component: EcommerceTrackView },
  { path: '/page/:slug', name: 'page', component: PageView },
  {
    path: '/cms/login',
    component: CmsAuthLayout,
    children: [{ path: '', name: 'cms-login', component: CmsLoginView }],
  },
  {
    path: '/cms',
    component: CmsLayout,
    children: [
      { path: 'dashboard', name: 'cms-dashboard', component: CmsDashboardView, meta: { auth: true } },
      { path: 'pages', name: 'cms-pages', component: () => import('@/views/CmsPagesView.vue'), meta: { auth: true } },
      { path: 'pages/new', name: 'cms-pages-new', component: () => import('@/views/CmsPageEditorView.vue'), meta: { auth: true } },
      { path: 'pages/:id/edit', name: 'cms-pages-edit', component: () => import('@/views/CmsPageEditorView.vue'), meta: { auth: true } },
      { path: 'products', name: 'cms-products', component: () => import('@/views/CmsProductsView.vue'), meta: { auth: true } },
      { path: 'products/new', name: 'cms-products-new', component: () => import('@/views/CmsProductEditorView.vue'), meta: { auth: true } },
      { path: 'products/:id/edit', name: 'cms-products-edit', component: () => import('@/views/CmsProductEditorView.vue'), meta: { auth: true } },
      { path: 'settings', name: 'cms-settings', component: () => import('@/views/CmsSettingsView.vue'), meta: { auth: true } },
      { path: 'navbar', name: 'cms-navbar', component: () => import('@/views/CmsNavbarView.vue'), meta: { auth: true } },
      { path: 'users', name: 'cms-users', component: () => import('@/views/CmsUsersView.vue'), meta: { auth: true } },
      { path: 'assets', name: 'cms-assets', component: () => import('@/views/CmsAssetsView.vue'), meta: { auth: true } },
      { path: 'blog', name: 'cms-blog', component: () => import('@/views/CmsBlogView.vue'), meta: { auth: true } },
      { path: 'blog/new', name: 'cms-blog-new', component: () => import('@/views/CmsBlogEditorView.vue'), meta: { auth: true } },
      { path: 'blog/:id/edit', name: 'cms-blog-edit', component: () => import('@/views/CmsBlogEditorView.vue'), meta: { auth: true } },
      { path: 'ecommerce', name: 'cms-ecommerce', component: () => import('@/views/CmsEcommerceView.vue'), meta: { auth: true } },
      { path: 'ecommerce/audit-logs', name: 'cms-ecommerce-audit-logs', component: () => import('@/views/CmsEcommerceAuditLogsView.vue'), meta: { auth: true } },
    ],
  },
  // Public Blog Routes
  {
    path: '/blog',
    name: 'blog-list',
    component: () => import('@/views/BlogListView.vue'),
  },
  {
    path: '/blog/:slug',
    name: 'blog-detail',
    component: () => import('@/views/BlogDetailView.vue'),
  },
  { path: '/:slug', component: PageView },
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
