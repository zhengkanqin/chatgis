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
              <button class="action-btn" @click.stop="selectLayer(layer)" :title="'选中图层'" :class="{ 'selected': mapStore.selectedLayers.some(l => l.id === layer.id) }">
                <i class="pi pi-check"></i>
              </button>
              <button class="delete-btn" @click.stop="removeLayer(layer.id)">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="hoveredFeature" class="feature-tooltip">
      <h4>{{ hoveredFeature.properties.title || '属性信息' }}</h4>
      <div v-for="(val, key) in hoveredFeature.properties" :key="key" v-if="key !== 'title'">
        <strong>{{ key }}:</strong>
        <span v-if="Array.isArray(val)">{{ val.join(', ') }}</span>
        <span v-else-if="typeof val === 'object' && val !== null">{{ JSON.stringify(val, null, 2) }}</span>
        <span v-else>{{ val }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import 'primeicons/primeicons.css';
import { MapUtils } from '../utils/mapUtils';
import { useMapStore } from '../stores/mapStore';

const mapContainer = ref(null);
let map = null;
let mapUtils = null;
const isSidebarOpen = ref(false);
const mapStore = useMapStore();

// 图层数据
const layers = ref([]);

// 测试数据
const testPoints = {
  point: JSON.stringify([114.305393, 30.593099]),
  polyline: JSON.stringify([
    [114.305393, 30.593099],
    [114.315393, 30.603099]
  ]),
  polygon: JSON.stringify([
    [114.305393, 30.593099],
    [114.315393, 30.593099],
    [114.315393, 30.603099]
  ])
};

// 测试 GeoJSON 数据
const testGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { 
        title: "武汉大学",
        type: "教育机构",
        address: "湖北省武汉市武昌区珞珈山",
        established: "1893年",
        area: "5187亩",
        population: "约50000人",
        description: "中国著名高等学府，国家'双一流'建设高校"
      },
      geometry: {
        type: "Point",
        coordinates: [114.305393, 30.593099]
      }
    },
    {
      type: "Feature",
      properties: {
        title: "东湖绿道",
        type: "旅游景点",
        length: "101.98公里",
        openTime: "全天开放",
        description: "世界级绿道，串联东湖各大景区",
        facilities: ["自行车道", "步行道", "观景台", "休息区"],
        bestTime: "春秋季节"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [114.305393, 30.593099],
          [114.315393, 30.603099],
          [114.325393, 30.613099],
          [114.335393, 30.623099]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        title: "东湖生态旅游区",
        type: "景区",
        area: "88平方公里",
        level: "5A级景区",
        openTime: "08:00-17:30",
        ticket: "免费",
        description: "中国最大的城中湖，集观光、休闲、娱乐于一体",
        attractions: ["磨山", "听涛", "落雁", "吹笛"],
        facilities: ["游客中心", "停车场", "餐饮区", "厕所"],
        history: "东湖风景区始建于1950年，是武汉市最早建立的风景名胜区",
        environment: {
          waterQuality: "II类水质",
          forestCoverage: "85%",
          biodiversity: "丰富"
        },
        transportation: {
          publicTransport: ["402路", "413路", "515路"],
          parking: {
            total: "2000个",
            fee: "10元/小时"
          }
        },
        activities: ["观光游览", "生态科普", "休闲娱乐", "摄影采风"],
        bestTime: {
          season: "春秋两季",
          time: "上午9:00-11:00，下午14:00-16:00"
        },
        contact: {
          phone: "027-12345678",
          website: "www.donghu.com",
          email: "info@donghu.com"
        }
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [114.305393, 30.593099],
          [114.315393, 30.593099],
          [114.315393, 30.603099],
          [114.325393, 30.603099],
          [114.325393, 30.593099],
          [114.305393, 30.593099]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        title: "光谷广场",
        type: "商业中心",
        area: "约10万平方米",
        openTime: "10:00-22:00",
        description: "武汉最大的商业综合体之一",
        facilities: ["购物中心", "餐饮", "娱乐", "停车场"],
        traffic: ["地铁2号线", "多条公交线路"]
      },
      geometry: {
        type: "Point",
        coordinates: [114.315393, 30.603099]
      }
    },
    {
      type: "Feature",
      properties: {
        title: "长江大桥",
        type: "交通设施",
        length: "1670米",
        built: "1957年",
        description: "万里长江第一桥，武汉地标性建筑",
        traffic: ["机动车道", "人行道", "自行车道"],
        history: "中国第一座跨越长江的公路铁路两用桥"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [114.305393, 30.593099],
          [114.315393, 30.593099],
          [114.325393, 30.593099]
        ]
      }
    }
  ]
};

const hoveredFeature = ref(null); // 新增：用于存储悬浮要素信息

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
const addMarker = (data) => {
  console.log('绘制点',data)
  const layerId = mapUtils.addMarker(data.point,data.name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加折线
const addPolyline = (data) => {
  const layerId = mapUtils.addPolyline(data.points, data.name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加多边形
const addPolygon = (data) => {
  const layerId = mapUtils.addPolygon(data.points, data.name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};


// 添加圆
const addCircle = (data) => {
  const layerId = mapUtils.addCircle(data.point, data.radius, data.name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加矩形
const addRectangle = (data) => {
  const layerId = mapUtils.addRectangle(data.points, data.name);
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加文本
const addLabel = (data) => {
  const layerId = mapUtils.addLabel(data.point, data.name);
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
const addGeoJSON = (data) => {
  if (!mapUtils) return;
  const layerId = mapUtils.addGeoJSONLayer(data.geojson, data.name, data.style={});
  // 保存原始数据
  const layer = layers.value.find(l => l.id === layerId);
  if (layer) {
    layer.originalData = data.geojson;  // 保存原始 GeoJSON 数据
  }
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// 添加图片图层
const addImageLayer = (data) => {
  if (!mapUtils) return;
  const layerId = mapUtils.addImageLayer(data.url, data.bounds, data.name, data.options);
  // 保存原始数据
  const layer = layers.value.find(l => l.id === layerId);
  if (layer) {
    layer.originalData = {
      url: data.url,
      bounds: data.bounds,
      options: data.options
    };
  }
  getAllLayers();
  isSidebarOpen.value = true;
  return layerId;
};

// ============= 测试函数 =============

// 添加测试点
const addTestPoint = () => {
  if (!mapUtils) return;
  const data = {
    point: testPoints.point,
    name: '测试点'
  };
  addMarker(data);
};

// 添加测试线
const addTestLine = () => {
  if (!mapUtils) return;
  const data = {
    points: testPoints.polyline,
    name: '测试线'
  };
  addPolyline(data);
};

// 添加测试面
const addTestPolygon = () => {
  if (!mapUtils) return;
  const data = {
    points: testPoints.polygon,
    name: '测试面'
  };
  addPolygon(data);
};

// 添加测试 GeoJSON
const addTestGeoJSON = () => {
  if (!mapUtils) return;
  const data = {
    geojson: testGeoJSON,
    name: '测试 GeoJSON'
  };
  addGeoJSON(data);
};

// 添加测试图片图层
const addTestImageLayer = () => {
  if (!mapUtils) return;
  
  // 设置更大的显示范围
  const bounds = JSON.stringify([
    [114.295393, 30.583099], // 西南角
    [114.325393, 30.613099]  // 东北角
  ]);

  const data = {
    url: 'https://cdn.pixabay.com/photo/2016/09/19/22/46/lake-1681485_640.jpg',
    bounds: bounds,
    name: '测试图片图层',
    options: JSON.stringify({
      opacity: 1.0,  // 完全不透明
      displayOnMinLevel: 0,
      displayOnMaxLevel: 19
    })
  };

  // 使用 addImageLayer 添加图层
  addImageLayer(data);
  
  // 确保地图视野正确显示图片
  const boundsObj = new BMapGL.Bounds(
    new BMapGL.Point(114.295393, 30.583099),
    new BMapGL.Point(114.325393, 30.613099)
  );
  map.setViewport(boundsObj);
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
    case '圆': return 'pi pi-stop';
    case '矩形': return 'pi pi-square';
    case '文本': return 'pi pi-tag';
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

// 选中图层
const selectLayer = (layer) => {
  const layerData = {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    data: layer.overlay,
    originalData: layer.originalData,  // 添加原始数据
    createTime: layer.createTime
  };
  mapStore.toggleSelectedLayer(layerData);
};

onMounted(() => {
  if (!mapContainer.value) return;
  
  // 初始化地图时添加preserveDrawingBuffer配置
  const mapOptions = {
    preserveDrawingBuffer: true  // 添加此配置以支持截图
  };
  
  map = MapUtils.initMap(mapContainer.value, mapOptions);
  mapUtils = new MapUtils(map);
  mapStore.setMap(map);
  getAllLayers();

  // 添加图层更新事件监听
  mapContainer.value.addEventListener('layer-updated', () => {
    getAllLayers();
  });

  // 新增：监听 feature-hover 事件
  mapContainer.value.addEventListener('feature-hover', (e) => {
    hoveredFeature.value = e.detail;
  });
});

defineExpose({
  drawBoundaryByName,
  addMarker,
  addPolyline,
  addPolygon,
  addCircle,
  addRectangle,
  addLabel,
  getAllLayers,
  addGeoJSON,
  addImageLayer,
  // 新增获取选中图层的方法
  getSelectedLayer: () => mapStore.selectedLayer,
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

.action-btn.selected {
  background-color: #1890ff;
  color: white;
}

.action-btn.selected:hover {
  background-color: #40a9ff;
}

.action-btn i {
  font-size: 14px;
}

.selected {
  background-color: #e6f7ff;
}

.feature-tooltip {
  position: absolute;
  top: 20px;
  right: 30px;
  z-index: 2000;
  background: #fff;
  border: 1px solid #aaa;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 12px 18px;
  min-width: 220px;
  pointer-events: none;
  max-width: 350px;
  word-break: break-all;
}
</style>
