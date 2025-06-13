<template>
  <div class="tibar">
    <div class="title">ChatGIS</div>
    <div class="window-controls">
      <i class="pi pi-minus" @click="minimize"></i>
      <i :class="['pi', isMaximized ? 'pi-arrow-down-left-and-arrow-up-right-to-center' : 'pi-arrow-up-right-and-arrow-down-left-from-center']" @click="toggleMaximize"></i>
      <i class="pi pi-times" @click="close"></i>
    </div>
  </div>
</template>

<script setup>
import 'primeicons/primeicons.css'
import { ref, onMounted } from 'vue'

const isMaximized = ref(false)

const minimize = () => {
  window.api.minimizeWindow();
};

const toggleMaximize = () => {
  window.api.toggleMaximize();
};

const close = () => {
  window.api.closeWindow();
};

onMounted(() => {
  window.api.onWindowStateChange((state) => {
    isMaximized.value = state.isMaximized;
  });
});
</script>

<style>
.tibar {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  -webkit-app-region: drag;
  user-select: none;  /* 防止文本选中 */
  -webkit-user-select: none;  /* Safari 支持 */
  -moz-user-select: none;  /* Firefox 支持 */
  -ms-user-select: none;  /* IE/Edge 支持 */
}

.title {
  flex-grow: 1;
  text-align: center;
  font-size: 18px;
  font-family: 'Times New Roman', Times, serif;
}

.window-controls {
  display: flex;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.window-controls i {
  cursor: pointer;
  color: #444;
  transition: color 0.3s ease;
}

.window-controls i:hover {
  color: #0078d7; /* 悬浮时变蓝色 */
}
</style>
