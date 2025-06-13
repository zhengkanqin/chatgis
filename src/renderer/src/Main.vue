<template style="border-radius: 50px;">  
    <div class="page-wrapper">
    <div class="Map"><baidumap ref="mapRef"/> </div>
    <div class="resizer" @mousedown="startResize"></div>
    <div class="chat-wrapper" :style="{ width: chatWidth + 'px' }"><Chat /></div>
  </div>
</template>

<script setup> 
import Chat from './components/chat.vue'
import baidumap from './components/baidumap.vue';
import { ref, onMounted, onUnmounted } from 'vue'
import { createWebSocket } from './utils/websocketHandler'

const wsConnection = ref(null)
const mapRef = ref(null);
const chatWidth = ref(600);
const isResizing = ref(false);

const startResize = (e) => {
  isResizing.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
};

const handleMouseMove = (e) => {
  if (!isResizing.value) return;
  
  const newWidth = window.innerWidth - e.clientX;
  const maxChatWidth = window.innerWidth - 500;
  if (newWidth >= 600 && newWidth <= Math.min(1000, maxChatWidth)) {
    chatWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
};

onMounted(() => {
  wsConnection.value = createWebSocket(mapRef);
})

onUnmounted(() => {
  if (wsConnection.value) {
    wsConnection.value.cleanup();
  }
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
})

</script>

<style scoped>
.page-wrapper {
  flex: 1;
  display: flex;
  height: 100%;
  overflow: hidden;
}

.Side {
  width: 50px;
  height: 100%;
}

.Map {
  flex: 1;
  height: 100%;
  margin-left: 5px;
  min-width: 500px;
}
.chat-wrapper {
  min-width: 600px;
  max-width: 1000px;
  height: 100%;
  overflow: hidden;
  padding-left: 8px;
  transition: width 0.3s ease;
}

.resizer {
  width: 6px;
  height: 100%;
  background-color: transparent;
  cursor: col-resize;
  transition: all 0.2s;
  position: relative;
  margin-left: -3px;
}

.resizer:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.resizer::after {
  display: none;
}
</style>
