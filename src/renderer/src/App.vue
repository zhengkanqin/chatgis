<template>
  <div class="container">
    <div class="App">
      <SidebarNav class="SidebarNav" />
      <div class="MainContent">
        <div class="tibar"><tibar /></div>
        <div class="router-view-wrapper">
          <!-- Using keep-alive to preserve component state when switching routes -->
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import tibar from './components/tibar.vue';
import SidebarNav from './SidebarNav.vue';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js';

// 配置 highlight.js
hljs.configure({
  languages: ['javascript', 'vue', 'html', 'css', 'json', 'bash', 'markdown']
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  border-radius: 50px;
}

* {
  box-sizing: border-box;
}

/* 隐藏所有滚动条 */
::-webkit-scrollbar {
  display: none;
}

* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.App {
  display: flex;
  flex: 1 1 auto;  /* 允许撑满剩余空间 */
  width: 100%;
  height: 100%;
  overflow: hidden;
}
/* 侧边栏 */
.SidebarNav {
  width: 70px;
  flex-shrink: 0;  /* 禁止缩小 */
}

.MainContent {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;  /* 占据剩余宽度 */
  height: 100%;
  overflow: hidden;
}

.tibar {
  height: 40px;
  flex-shrink: 0;  /* 固定高度，不缩小 */
}

.router-view-wrapper {
  flex: 1 1 auto;
  overflow: auto;  /* 内容溢出时显示滚动条 */
}
</style>