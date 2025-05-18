<template>
  <div class="container">
  <div class="tibar"><tibar /></div>
  <div class="App">
    <div class="config"></div>
    <div class="Map"><baidumap></baidumap> </div>
    <div class="chat-wrapper"><Chat /></div>
    <div class="data"><div v-for="(msg, index) in messages" :key="index">{{ msg }}</div></div>
  </div>
</div>
</template>

<script setup>
import Chat from './components/chat.vue'
import tibar from './components/tibar.vue';
import baidumap from './components/baidumap.vue';
import { ref, onMounted, onBeforeUnmount } from 'vue'
// import data from './components/data.vue';
// import config from './components/config.vue';
const ws = ref(null)
const messages = ref([])
const inputMessage = ref('')
onMounted(() => {
  ws.value = new WebSocket('ws://127.0.0.1:8000/ws')
  ws.value.onopen = () => {
    console.log('WebSocket 连接成功')
  }
  ws.value.onmessage = (event) => {
    messages.value.push(event.data)
    console.log(event.data)
  }
})
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
}
* {
  box-sizing: border-box;
}
.App {
  display: flex;
  flex: 1; /* ✅ 自动撑满剩余空间 */
  width: 100%;
  background-color: aliceblue;
  overflow: hidden; /* ✅ 防止内容溢出 */
}
.data {
  width: 50px;
  height: 100%;
  /* background-color: antiquewhite; */
}
.config{
  width: 50px;
  height: 100%;
  /* background-color: antiquewhite; */
}
.Map {
  flex: 1;
  height: 100%;
  background-color: azure;
}
.chat-wrapper {
  width: 600px;
  height: 100%;
  overflow: hidden;
}
.tibar {
  height: 40px;
  flex-shrink: 0;
}
.container {
  height: 100vh; /* ✅ 明确设置为视口高度 */
  display: flex;
  flex-direction: column;
}
</style>
