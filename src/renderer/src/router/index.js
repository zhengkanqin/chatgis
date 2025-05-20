// router/index.js
import { createRouter, createWebHashHistory  } from 'vue-router'
import Main from '../Main.vue'
import Data from '../Data.vue'
import Config from '../Config.vue'
import Info from '../Info.vue'
const routes = [
  { path: '/main', component: Main },
  { path: '/data', component: Data },
  { path: '/config', component: Config },
  { path: '/info', component: Info},
  { path: '/', redirect: '/main' } // 默认跳转
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
