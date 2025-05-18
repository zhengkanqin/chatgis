<template>
  <div class="tibar">
    <div class="title">chatgis demo v0.1</div>
    <div class="window-controls">
      <button @click="minimize">-</button>
      <button @click="close">x</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startMouseX = ref(0);
const startMouseY = ref(0);
const minimize = () => {
  window.api.minimizeWindow();
};

const close = () => {
  window.api.closeWindow();
};
</script>

<style>
.tibar {
  width: 100%;
  height: 50px; /* 设置一个固定高度 */
  display: flex; /* 使用 Flexbox 布局 */
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 子元素水平分布：标题居中，按钮靠右 */
  padding: 0 10px; /* 添加一些内边距，使内容不紧贴边缘 */
  -webkit-app-region: drag;
}

.title {
  flex-grow: 1; /* 让标题占据剩余空间 */
  text-align: center; /* 标题文字居中 */
  font-size: 18px; /* 设置标题字体大小 */
  font-weight: bold; /* 设置标题字体为加粗 */
}

.window-controls {
  display: flex; /* 使用 Flexbox 布局 */
  gap: 10px; /* 设置按钮之间的间距 */
  -webkit-app-region: no-drag;
}

.window-controls button {
  border: none; /* 去掉按钮边框 */
  background-color: transparent; /* 设置按钮背景为透明 */
  font-size: 24px; /* 设置按钮字体大小 */
  cursor: pointer; /* 鼠标悬停时显示手型 */
}

.window-controls button:hover {
  background-color: rgba(255, 255, 255, 0.2); /* 鼠标悬停时的背景颜色 */
}
</style>