<template>
  <div class="map-wrapper" @click="handleWrapperClick">
    <div class="round">
      <div class="map-container" ref="mapContainer"></div>
    </div>
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }" @click.stop>
      <div class="hemisphere" @click="toggleSidebar">
        <div class="hemisphere-inner">
          <i :class="isSidebarOpen ? 'pi pi-angle-left' : 'pi pi-angle-right'"></i>
        </div>
      </div>
      <div class="sidebar-content">
        <h3>图层</h3>
        <div class="toolbar">
          <button class="tool-btn"><i class="pi pi-map-marker"></i></button>
          <button class="tool-btn"><i class="pi pi-link"></i></button>
          <button class="tool-btn"><i class="pi pi-stop"></i></button>
        </div>
        <div class="divider"></div>
        <div class="layer-list">
          <div 
            class="layer-item" 
            v-for="(item, index) in tableData" 
            :key="index"
          >
            <i :class="getTypeIcon(item.type)" class="type-icon"></i>
            <span class="layer-name">{{ item.name }}</span>
            <button class="delete-btn"><i class="pi pi-pen-to-square"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import 'primeicons/primeicons.css';
import { MapUtils } from '../utils/mapUtils';

const mapContainer = ref(null);
let map = null;
let mapUtils = null;
const isSidebarOpen = ref(false);

// 模拟数据
const tableData = ref([
  { name: '测试点1', type: '点' },
  { name: '测试线1', type: '线' },
  { name: '测试面1', type: '面' },
]);

const getTypeIcon = (type) => {
  switch(type) {
    case '点': return 'pi pi-map-marker';
    case '线': return 'pi pi-link';
    case '面': return 'pi pi-stop';
    default: return 'pi pi-question';
  }
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const handleWrapperClick = () => {
  if (isSidebarOpen.value) {
    isSidebarOpen.value = false;
  }
};

onMounted(() => {
  if (!mapContainer.value) return;
  map = MapUtils.initMap(mapContainer.value);
  mapUtils = new MapUtils(map);
});

const drawBoundaryByName = (cityName) => {
  return mapUtils.drawBoundaryByName(cityName);
};

defineExpose({
  drawBoundaryByName,
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 1%;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 1rem;
  padding-right: 0;
  padding-top: 0;
  overflow: hidden;
}

.round {
  width: 100%;
  height: 100%;
  border-radius: 1%;
  border-color: rgb(216, 216, 216);
  border-style: solid;
  border-width: 2px;
  position: relative;
}

.hemisphere {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: #ffffff;
  border: 2px solid rgb(216, 216, 216);
  border-left: none;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.hemisphere-inner {
  width: 14px;
  height: 28px;
  background-color: #f5f5f5;
  border-radius: 0 14px 14px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hemisphere-inner i {
  color: #666;
  font-size: 12px;
}

.sidebar {
  position: absolute;
  left: -400px;
  top: 0;
  width: 400px;
  height: 100%;
  background-color: #ffffff;
  border-right: 2px solid rgb(216, 216, 216);
  transition: left 0.3s ease;
  z-index: 999;
  border-radius: 1% 0 0 1%;
}

.sidebar-open {
  left: 0;
}

.sidebar-content {
  padding: 15px;
  height: 100%;
  overflow-y: auto;
  border-radius: 0 1% 1% 0;
}

.sidebar-content h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.tool-btn i {
  font-size: 16px;
  color: #666;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 1rem 0;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.layer-item:hover {
  background: #f1f8e9;
  border-color: #4CAF50;
}

.type-icon {
  font-size: 16px;
  color: #666;
  margin-right: 12px;
}

.layer-name {
  flex: 1;
  color: #333;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #ff4d4f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0;
}

.layer-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fff1f0;
}

.delete-btn i {
  font-size: 14px;
}
</style>
