<template>  
    <div class="page-wrapper">
    <div class="Map"><baidumap ref="mapRef"/> </div>
    <div class="chat-wrapper"><Chat /></div>
  </div>
</template>

<script setup> 
import Chat from './components/chat.vue'
import baidumap from './components/baidumap.vue';
import { ref, onMounted } from 'vue'
const ws = ref(null)
const messages = ref([])
const mapRef = ref(null);
onMounted(() => {
  ws.value = new WebSocket('ws://127.0.0.1:8000/ws')
  ws.value.onopen = () => {
    console.log('WebSocket 连接成功')
  }
  ws.value.onmessage = (event) => {
    const msg = JSON.parse(event.data); 
    console.log(msg)
    if(msg.type=="draw-city"){
      console.log("draw-city run")
      mapRef.value.drawBoundaryByName(msg.data)
    }
  }
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
}
.chat-wrapper {
  width: 600px;
  height: 100%;
  overflow: hidden;
  padding-left: 5px;
}


</style>
