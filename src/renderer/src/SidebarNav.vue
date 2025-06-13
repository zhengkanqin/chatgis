<template>
  <div class="sidebar-nav">
    <!-- 主菜单按钮 -->
    <div
      v-for="item in items"
      :key="item.path"
      v-tooltip.right="item.label"
      class="nav-icon"
      :class="{ active: route.path === item.path }"
      @click="router.push(item.path)"
    >
      <i :class="item.icon" />
    </div>

    <!-- 信息按钮（无背景，底部固定） -->
    <div
      class="info-icon"
      v-tooltip.right="'关于'"
      @click="visible = true"
    >
      <i class="pi pi-info-circle" />
    </div>

    <!-- PrimeVue 弹窗组件 -->
    <Dialog v-model:visible="visible" modal header="ChatGIS" :style="{ width: '350px' }" :draggable="false">
      <p>Version：3.0</p>
      <p>开发团队：郑堪钦 普贝吉 余佩瀚</p>
      <p>指导老师：应申</p>
      <p>意见反馈QQ：2335987512</p>
      <a href="https://github.com/zhengkanqin/chatgis" target="_blank" style="color: #5aa878; text-decoration: underline;">
    GitHub开源地址：ChatGIS
  </a>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Tooltip from 'primevue/tooltip'
import Dialog from 'primevue/dialog'

const router = useRouter()
const route = useRoute()

const items = [
  { path: '/main', label: '主页', icon: 'pi pi-map' },
  { path: '/info', label: '文件', icon: 'pi pi-file' },
  { path: '/data', label: '数据', icon: 'pi pi-database' },
  { path: '/knowledge', label: '知识', icon: 'pi pi-book' },
  { path: '/config', label: '配置', icon: 'pi pi-sliders-v' }
]

const visible = ref(false)
</script>

<script>
export default {
  directives: {
    tooltip: Tooltip
  }
}
</script>

<style scoped>
.sidebar-nav {
  width: 64px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.3);
  background: #fff;
  position: relative;
  z-index: 10;
}

.nav-icon {
  width: 48px;
  height: 48px;
  margin: 5px 0;
  background-color: #f1f1f1;
  color: #858585;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s, color 0.3s;
}

.nav-icon:hover {
  background-color: #5aa878;
  color: #fff;
}

.nav-icon.active {
  background-color: #459463;
  color: #fff;
}

/* 信息按钮样式（透明背景、底部） */
.info-icon {
  margin-top: auto;
  margin-bottom: 20px;
  color: #858585;
  font-size: 2.8rem;
  cursor: pointer;
  transition: color 0.3s;
  background-color: transparent;
  scale: 1.4;
}

.info-icon:hover {
  color: #5aa878;
}
</style>
