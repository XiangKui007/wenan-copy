import { createRouter, createWebHistory } from 'vue-router'
import { SITE_BRAND } from '@/config/tools.js'

const HomePage = () => import('@/pages/HomePage.vue')
const WenanPage = () => import('@/pages/WenanPage.vue')
const TeacherActivityPage = () => import('@/pages/TeacherActivityPage.vue')
const ImageCompressPage = () => import('@/pages/ImageCompressPage.vue')
const JsonFormatPage = () => import('@/pages/JsonFormatPage.vue')

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { title: '' },
    },
    {
      path: '/tools/wenan',
      name: 'wenan',
      component: WenanPage,
      meta: { title: '朋友圈文案生成器' },
    },
    {
      path: '/tools/teacher-activity',
      name: 'teacher-activity',
      component: TeacherActivityPage,
      meta: { title: '教师活动图文' },
    },
    {
      path: '/tools/image-compress',
      name: 'image-compress',
      component: ImageCompressPage,
      meta: { title: '在线图片压缩' },
    },
    {
      path: '/tools/json-format',
      name: 'json-format',
      component: JsonFormatPage,
      meta: { title: 'JSON 格式化' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const t = to.meta?.title
  document.title = t ? `${t} · ${SITE_BRAND}` : SITE_BRAND
})
