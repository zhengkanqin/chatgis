// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Main from '../Main.vue'
import Data from '../Data.vue'
import Config from '../Config.vue'
const routes = [
  { path: '/main', component: Main },
  { path: '/data', component: Data },
  { path: '/config', component: Config },
  { path: '/', redirect: '/main' } // 默认跳转
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
