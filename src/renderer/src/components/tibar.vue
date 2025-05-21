<template>
  <div class="tibar">
    <div class="title">ChatGIS</div>
    <div class="window-controls">
      <i class="pi pi-minus" @click="minimize"></i>
      <i class="pi pi-times" @click="close"></i>
    </div>
  </div>
</template>

<script setup>
import 'primeicons/primeicons.css'

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
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  -webkit-app-region: drag;
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
