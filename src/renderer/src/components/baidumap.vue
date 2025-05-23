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
        <h3>图层管理</h3>
        <div class="toolbar">
          <button class="tool-btn" @click="addTestPoint">
            <i class="pi pi-map-marker"></i>
          </button>
          <button class="tool-btn" @click="addTestLine">
            <i class="pi pi-link"></i>
          </button>
          <button class="tool-btn" @click="addTestPolygon">
            <i class="pi pi-stop"></i>
          </button>
          <button class="tool-btn" @click="addTestGeoJSON">
            <i class="pi pi-file"></i>
          </button>
          <button class="tool-btn" @click="addTestImageLayer">
            <i class="pi pi-image"></i>
          </button>
        </div>
        <div class="divider"></div>
        <div class="layer-list">
          <div 
            class="layer-item" 
            v-for="layer in layers" 
            :key="layer.id"
            @click="locateToLayer(layer)"
          >
            <i :class="getTypeIcon(layer.type)" class="type-icon"></i>
            <span class="layer-name">{{ layer.name }}</span>
            <div class="layer-actions">
              <button class="action-btn" @click.stop="toggleLayerVisibility(layer.id)" :title="layer.visible ? '隐藏' : '显示'">
                <i :class="layer.visible ? 'pi pi-eye' : 'pi pi-eye-slash'"></i>
              </button>
              <button class="delete-btn" @click.stop="removeLayer(layer.id)">
                <i class="pi pi-trash"></i>
              </button>
            </div>
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

// 图层数据
const layers = ref([]);

// 测试数据
const testPoints = {
  point: new BMapGL.Point(114.305393, 30.593099),
  polyline: [
    new BMapGL.Point(114.305393, 30.593099),
    new BMapGL.Point(114.315393, 30.603099)
  ],
  polygon: [
    new BMapGL.Point(114.305393, 30.593099),
    new BMapGL.Point(114.315393, 30.593099),
    new BMapGL.Point(114.315393, 30.603099)
  ]
};

// 测试 GeoJSON 数据
const testGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { title: "测试点" },
      geometry: {
        type: "Point",
        coordinates: [114.305393, 30.593099]
      }
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [114.305393, 30.593099],
          [114.315393, 30.603099]
        ]
      }
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[
          [114.305393, 30.593099],
          [114.315393, 30.593099],
          [114.315393, 30.603099],
          [114.305393, 30.593099]
        ]]
      }
    }
  ]
};

// 获取所有图层
const getAllLayers = () => {
  layers.value = mapUtils.getAllLayers();
};

// 删除图层
const removeLayer = (layerId) => {
  if (mapUtils.removeLayer(layerId)) {
    getAllLayers(); // 更新图层列表
  }
};

// 添加点标记
const addMarker = (point, name) => {
  const layerId = mapUtils.addMarker(point, name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加折线
const addPolyline = (points, name) => {
  const layerId = mapUtils.addPolyline(points, name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加多边形
const addPolygon = (points, name) => {
  const layerId = mapUtils.addPolygon(points, name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 绘制边界
const drawBoundaryByName = async (cityName) => {
  try {
    console.log('开始绘制边界:', cityName);
    const result = await mapUtils.drawBoundaryByName(cityName);
    console.log('边界绘制结果:', result);
    getAllLayers();
    isSidebarOpen.value = true;
    return result;
  } catch (error) {
    console.error('绘制边界失败:', error);
    throw error;
  }
};

// 添加 GeoJSON 图层
const addGeoJSON = (geojson, name, style = {}) => {
  if (!mapUtils) return;
  const layerId = mapUtils.addGeoJSONLayer(geojson, name, style);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加图片图层
const addImageLayer = (url, bounds, name, options = {}) => {
  if (!mapUtils) return;
  const layerId = mapUtils.addImageLayer(url, bounds, name, options);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// ============= 测试函数 =============

// 添加测试点
const addTestPoint = () => {
  if (!mapUtils) return;
  addMarker(testPoints.point, '测试点');
};

// 添加测试线
const addTestLine = () => {
  if (!mapUtils) return;
  addPolyline(testPoints.polyline, '测试线');
};

// 添加测试面
const addTestPolygon = () => {
  if (!mapUtils) return;
  addPolygon(testPoints.polygon, '测试面');
};

// 添加测试 GeoJSON
const addTestGeoJSON = () => {
  if (!mapUtils) return;
  addGeoJSON(testGeoJSON, '测试 GeoJSON');
};

// 添加测试图片图层
const addTestImageLayer = () => {
  if (!mapUtils) return;
  
  // 设置更大的显示范围
  const bounds = new BMapGL.Bounds(
    new BMapGL.Point(114.295393, 30.583099), // 西南角
    new BMapGL.Point(114.325393, 30.613099)  // 东北角
  );

  const options = {
    opacity: 1.0,  // 完全不透明
    displayOnMinLevel: 0,
    displayOnMaxLevel: 19
  };

  // 使用 addImageLayer 添加图层
  const layerId = addImageLayer(
    'https://cdn.pixabay.com/photo/2016/09/19/22/46/lake-1681485_640.jpg',
    bounds,
    '测试图片图层',
    options
  );
  
  // 确保地图视野正确显示图片
  map.setViewport(bounds);
  map.setZoom(13);  // 调整缩放级别
  
  getAllLayers();
};

const getTypeIcon = (type) => {
  switch(type) {
    case '点': return 'pi pi-map-marker';
    case '线': return 'pi pi-link';
    case '面': return 'pi pi-stop';
    case '边界': return 'pi pi-globe';
    case 'GeoJSON': return 'pi pi-file';
    case '图片': return 'pi pi-image';
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

// 定位到图层
const locateToLayer = (layer) => {
  if (!mapUtils || !layer.overlay) return;
  
  try {
    const bounds = new BMapGL.Bounds();
    
    if (Array.isArray(layer.overlay)) {
      // 处理 GeoJSON 图层
      layer.overlay.forEach(overlay => {
        if (overlay instanceof BMapGL.Marker) {
          bounds.extend(overlay.getPosition());
        } else if (overlay instanceof BMapGL.Polyline) {
          const path = overlay.getPath();
          path.forEach(point => bounds.extend(point));
        } else if (overlay instanceof BMapGL.Polygon) {
          const path = overlay.getPath();
          path.forEach(point => bounds.extend(point));
        }
      });
    } else {
      // 处理单个覆盖物
      if (layer.overlay instanceof BMapGL.Marker) {
        const position = layer.overlay.getPosition();
        bounds.extend(position);
      } else if (layer.overlay instanceof BMapGL.Polyline) {
        const path = layer.overlay.getPath();
        path.forEach(point => bounds.extend(point));
      } else if (layer.overlay instanceof BMapGL.Polygon) {
        const path = layer.overlay.getPath();
        path.forEach(point => bounds.extend(point));
      } else if (layer.overlay instanceof BMapGL.GroundOverlay) {
        const overlayBounds = layer.overlay.getBounds();
        if (overlayBounds) {
          bounds.extend(overlayBounds.sw);
          bounds.extend(overlayBounds.ne);
        }
      }
    }
    
    // 设置视图范围，并添加适当的边距
    if (!bounds.isEmpty()) {
      const viewport = map.getViewport(bounds, {
        enableAnimation: true,
        margins: [50, 50, 50, 50] // 上右下左边距
      });
      map.setViewport(viewport);
    }
  } catch (error) {
    console.error('定位图层时发生错误:', error);
  }
};

// 切换图层显示状态
const toggleLayerVisibility = (layerId) => {
  if (!mapUtils) return;
  mapUtils.toggleLayerVisible(layerId);
};

onMounted(() => {
  if (!mapContainer.value) return;
  map = MapUtils.initMap(mapContainer.value);
  mapUtils = new MapUtils(map);
  getAllLayers();

  // 添加图层更新事件监听
  mapContainer.value.addEventListener('layer-updated', () => {
    getAllLayers();
  });
});

defineExpose({
  drawBoundaryByName,
  addMarker,
  addPolyline,
  addPolygon,
  getAllLayers,
  addGeoJSON,
  addImageLayer,
  // 地图操作接口
  panBy: (x, y) => mapUtils?.panBy(x, y),
  zoomIn: () => mapUtils?.zoomIn(),
  zoomOut: () => mapUtils?.zoomOut(),
  setZoom: (zoom) => mapUtils?.setZoom(zoom),
  getZoom: () => mapUtils?.getZoom(),
  getCenter: () => mapUtils?.getCenter(),
  setCenter: (point) => mapUtils?.setCenter(point),
  setMapType: (type) => mapUtils?.setMapType(type),
  getMapType: () => mapUtils?.getMapType(),
  enableScrollWheelZoom: (enable) => mapUtils?.enableScrollWheelZoom(enable),
  enableDragging: (enable) => mapUtils?.enableDragging(enable),
  enableDoubleClickZoom: (enable) => mapUtils?.enableDoubleClickZoom(enable),
  enableKeyboard: (enable) => mapUtils?.enableKeyboard(enable),
  enableInertialDragging: (enable) => mapUtils?.enableInertialDragging(enable),
  enableContinuousZoom: (enable) => mapUtils?.enableContinuousZoom(enable),
  enablePinchToZoom: (enable) => mapUtils?.enablePinchToZoom(enable),
  enableAutoResize: (enable) => mapUtils?.enableAutoResize(enable),
  reset: () => mapUtils?.reset(),
  // 图层显示控制接口
  setLayerVisible: (layerId, visible) => mapUtils?.setLayerVisible(layerId, visible),
  getLayerVisible: (layerId) => mapUtils?.getLayerVisible(layerId),
  toggleLayerVisible: (layerId) => mapUtils?.toggleLayerVisible(layerId)
});
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
  overflow: hidden;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 1% 1% 0;
}

.sidebar-content h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  margin-right: 4px;
  min-height: 0;
}

/* 自定义滚动条样式 */
.layer-list::-webkit-scrollbar {
  width: 7px;
}

.layer-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.layer-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.layer-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
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

.layer-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.layer-item:hover .layer-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #1890ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e6f7ff;
}

.action-btn i {
  font-size: 14px;
}
</style>
