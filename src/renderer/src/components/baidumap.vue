<template>
  <div class="map-wrapper" @click="handleWrapperClick">
    <div class="round">
      <div class="map-container" ref="mapContainer"></div>
      <!-- 添加绘制控制按钮 -->
      <div v-if="drawingState.isDrawing" class="drawing-controls">
        <button class="control-btn confirm" @click="finishDrawing" title="完成绘制">
          <i class="pi pi-check"></i>
        </button>
        <button class="control-btn cancel" @click="cancelDrawing" title="取消绘制">
          <i class="pi pi-times"></i>
        </button>
      </div>
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
          <button class="tool-btn" @click="startDrawPoint" :class="{ 'active': drawingState.isDrawing && drawingState.currentType === 'point' }">
            <i class="pi pi-map-marker"></i>
          </button>
          <button class="tool-btn" @click="startDrawLine" :class="{ 'active': drawingState.isDrawing && drawingState.currentType === 'line' }">
            <i class="pi pi-link"></i>
          </button>
          <button class="tool-btn" @click="startDrawPolygon" :class="{ 'active': drawingState.isDrawing && drawingState.currentType === 'polygon' }">
            <i class="pi pi-stop"></i>
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
            <span 
              class="layer-name" 
              v-if="editingLayerId !== layer.id"
              @dblclick.stop="startEditLayerName(layer)"
            >{{ layer.name }}</span>
            <input
              v-else
              class="layer-name-input"
              v-model="editingLayerName"
              @blur="finishEditLayerName"
              @keyup.enter="finishEditLayerName"
              @keyup.esc="cancelEditLayerName"
              ref="layerNameInput"
            >
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
    <!-- 添加命名对话框 -->
    <div v-if="showNameDialog" class="name-dialog-overlay" @click.stop>
      <div class="name-dialog">
        <h3>请输入名称</h3>
        <input 
          v-model="drawingName" 
          type="text" 
          placeholder="请输入图层名称"
          @keyup.enter="handleNameConfirm"
          @keyup.esc="cancelDrawing"
          ref="nameInput"
        >
        <div class="dialog-buttons">
          <button @click="handleNameConfirm" :disabled="!drawingName.trim()">确定</button>
          <button @click="cancelDrawing">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
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

// 添加绘制状态管理
const drawingState = ref({
  isDrawing: false,
  currentType: null,
  points: [],
  overlay: null
});

// 添加命名对话框状态
const showNameDialog = ref(false);
const drawingName = ref('');

// 添加图层名称编辑相关的状态
const editingLayerId = ref(null);
const editingLayerName = ref('');
const layerNameInput = ref(null);
const nameInput = ref(null);

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
const addGeoJSON = async (data) => {
  if (!mapUtils) return;
  
  let geojsonData = data.geojson;
  
  // 如果输入是字符串
  if (typeof geojsonData === 'string') {
    // 检查是否为 URL 或文件路径
    if (geojsonData.startsWith('http://') || geojsonData.startsWith('https://')) {
      try {
        // 如果是 URL，使用 fetch 获取数据
        const response = await fetch(geojsonData);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        geojsonData = await response.json();
      } catch (error) {
        console.error('获取 GeoJSON 数据失败:', error);
        throw error;
      }
    } 
    // 检查是否为文件路径（Windows 或 Unix 风格）
    else if (geojsonData.match(/^[a-zA-Z]:\\|^\/|^\.\/|^\.\.\//)) {
      try {
        // 使用 window.api.readTextFile 读取文件
        const result = await window.api.readTextFile(geojsonData);
        if (!result.success) {
          throw new Error(result.error);
        }
        geojsonData = JSON.parse(result.data);
      } catch (error) {
        console.error('读取 GeoJSON 文件失败:', error);
        throw error;
      }
    } else {
      // 如果不是 URL 或文件路径，尝试直接解析 JSON
      try {
        geojsonData = JSON.parse(geojsonData);
      } catch (error) {
        console.error('解析 GeoJSON 字符串失败:', error);
        throw error;
      }
    }
  }

  // 处理样式
  if(typeof data.style === 'string' && data.style !== ''){
    data.style = JSON.parse(data.style);
  }

  const layerId = mapUtils.addGeoJSONLayer(geojsonData, data.name, data.style, data.properties);
  
  // 保存原始数据
  const layer = layers.value.find(l => l.id === layerId);
  if (layer) {
    layer.originalData = geojsonData;  // 保存原始 GeoJSON 数据
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

// 修改开始绘制函数
const startDrawing = (type) => {
  if (drawingState.value.isDrawing) {
    stopDrawing();
  }
  
  drawingState.value.isDrawing = true;
  drawingState.value.currentType = type;
  drawingState.value.points = [];
  drawingState.value.overlay = null;
  
  // 添加地图点击事件监听
  map.addEventListener('click', handleMapClick);
  
  // 更改鼠标样式为十字架
  map.setDefaultCursor('crosshair');
  
  // 确保侧边栏关闭
  isSidebarOpen.value = false;
};

const stopDrawing = () => {
  if (!drawingState.value.isDrawing) return;
  
  drawingState.value.isDrawing = false;
  drawingState.value.currentType = null;
  drawingState.value.points = [];
  drawingState.value.overlay = null;
  
  // 移除地图点击事件监听
  map.removeEventListener('click', handleMapClick);
  
  // 恢复默认鼠标样式
  map.setDefaultCursor('default');
};

const handleMapClick = (e) => {
  if (!drawingState.value.isDrawing) return;

  const point = e.latlng || map.pixelToPoint(e.pixel); // 保底处理
  console.log('真实地图坐标:', point.lng, point.lat);

  drawingState.value.points.push(point);
  
  // 根据绘制类型处理
  switch (drawingState.value.currentType) {
    case 'point':
      // 绘制点
      if (drawingState.value.points.length === 1) {
        const marker = new BMapGL.Marker(point);
        map.addOverlay(marker);
        drawingState.value.overlay = marker;
        showNameDialog.value = true;
        drawingName.value = '';
        nextTick(() => {
          if (nameInput.value) {
            nameInput.value.focus();
            nameInput.value.select();
          }
        });
      }
      break;
      
    case 'line':
      // 绘制线
      if (drawingState.value.points.length >= 2) {
        if (drawingState.value.overlay) {
          map.removeOverlay(drawingState.value.overlay);
        }
        const polyline = new BMapGL.Polyline(drawingState.value.points, {
          strokeColor: '#1890ff',
          strokeWeight: 2,
          strokeOpacity: 0.8
        });
        map.addOverlay(polyline);
        drawingState.value.overlay = polyline;
      }
      break;
      
    case 'polygon':
      // 绘制面
      if (drawingState.value.points.length >= 3) {
        if (drawingState.value.overlay) {
          map.removeOverlay(drawingState.value.overlay);
        }
        const polygon = new BMapGL.Polygon(drawingState.value.points, {
          strokeColor: '#1890ff',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: '#1890ff',
          fillOpacity: 0.3
        });
        map.addOverlay(polygon);
        drawingState.value.overlay = polygon;
      }
      break;
  }
};

// 修改完成绘制函数
const finishDrawing = () => {
  if (!drawingState.value.isDrawing || !drawingState.value.overlay) return;
  
  // 显示命名对话框
  showNameDialog.value = true;
  drawingName.value = '';
  
  // 在下一个 tick 后聚焦输入框
  nextTick(() => {
    if (nameInput.value) {
      nameInput.value.focus();
      nameInput.value.select();
    }
  });
};

// 添加命名确认处理函数
const handleNameConfirm = () => {
  if (!drawingName.value.trim()) return; // 如果名称为空，不执行确认
  confirmDrawing();
};

// 修改取消绘制函数
const cancelDrawing = () => {
  // 删除预览的覆盖物
  if (drawingState.value.overlay) {
    map.removeOverlay(drawingState.value.overlay);
  }
  
  showNameDialog.value = false;
  drawingName.value = '';
  stopDrawing();
  
  // 确保侧边栏关闭
  isSidebarOpen.value = false;
};

// 修改确认绘制函数
const confirmDrawing = () => {
  if (!drawingName.value.trim()) return; // 再次验证名称不为空
  
  // 删除预览的覆盖物
  if (drawingState.value.overlay) {
    map.removeOverlay(drawingState.value.overlay);
  }
  
  switch (drawingState.value.currentType) {
    case 'point':
      if (drawingState.value.points.length === 1) {
        const point = drawingState.value.points[0];
        const pointData = {
          point: JSON.stringify([point.lng, point.lat]),
          name: drawingName.value
        };
        const layerId = mapUtils.addMarker(pointData.point, pointData.name);
        getAllLayers();
      }
      break;
      
    case 'line':
      if (drawingState.value.points.length >= 2) {
        const points = drawingState.value.points.map(p => [p.lng, p.lat]);
        const layerId = mapUtils.addPolyline(JSON.stringify(points), drawingName.value);
        getAllLayers();
      }
      break;
      
    case 'polygon':
      if (drawingState.value.points.length >= 3) {
        const points = drawingState.value.points.map(p => [p.lng, p.lat]);
        const layerId = mapUtils.addPolygon(JSON.stringify(points), drawingName.value);
        getAllLayers();
      }
      break;
  }
  
  // 关闭对话框并清理状态
  showNameDialog.value = false;
  drawingName.value = '';
  stopDrawing();
  
  // 确保侧边栏关闭
  isSidebarOpen.value = false;
};

// 替换测试函数为绘制函数
const startDrawPoint = () => {
  startDrawing('point');
};

const startDrawLine = () => {
  startDrawing('line');
};

const startDrawPolygon = () => {
  startDrawing('polygon');
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
  // 只有在非绘制状态下才关闭侧边栏
  if (!drawingState.value.isDrawing && isSidebarOpen.value) {
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
      } else if (layer.overlay instanceof BMapGL.Circle) {
        const center = layer.overlay.getCenter();
        const radius = layer.overlay.getRadius();
        // 计算圆的外接矩形
        const sw = new BMapGL.Point(
          center.lng - radius / 111000 * Math.cos(Math.PI / 4),
          center.lat - radius / 111000 * Math.sin(Math.PI / 4)
        );
        const ne = new BMapGL.Point(
          center.lng + radius / 111000 * Math.cos(Math.PI / 4),
          center.lat + radius / 111000 * Math.sin(Math.PI / 4)
        );
        bounds.extend(sw);
        bounds.extend(ne);
      } else if (layer.overlay instanceof BMapGL.Label) {
        const position = layer.overlay.getPosition();
        bounds.extend(position);
      } else if (layer.overlay instanceof BMapGL.Rectangle) {
        const bounds = layer.overlay.getBounds();
        if (bounds) {
          bounds.extend(bounds.sw);
          bounds.extend(bounds.ne);
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

// 开始编辑图层名称
const startEditLayerName = (layer) => {
  editingLayerId.value = layer.id;
  editingLayerName.value = layer.name;
  // 在下一个 tick 后聚焦输入框
  nextTick(() => {
    if (layerNameInput.value) {
      layerNameInput.value.focus();
      // 选中所有文本
      layerNameInput.value.select();
    }
  });
};

// 完成编辑图层名称
const finishEditLayerName = () => {
  if (!editingLayerId.value) return;
  
  const newName = editingLayerName.value.trim();
  if (newName && newName !== layers.value.find(l => l.id === editingLayerId.value)?.name) {
    // 更新图层名称
    const layer = layers.value.find(l => l.id === editingLayerId.value);
    if (layer) {
      layer.name = newName;
      // 如果图层在选中状态，也更新选中状态中的名称
      const selectedLayer = mapStore.selectedLayers.find(l => l.id === editingLayerId.value);
      if (selectedLayer) {
        selectedLayer.name = newName;
      }
    }
  }
  
  // 重置编辑状态
  editingLayerId.value = null;
  editingLayerName.value = '';
};

// 取消编辑图层名称
const cancelEditLayerName = () => {
  editingLayerId.value = null;
  editingLayerName.value = '';
};

onMounted(() => {
  if (!mapContainer.value) return;
  
  // 初始化地图时添加preserveDrawingBuffer配置
  const mapOptions = {
    preserveDrawingBuffer: true,  // 添加此配置以支持截图
    enableDragging: true,         // 启用拖拽
    enableScrollWheelZoom: true,  // 启用滚轮缩放
    enableDoubleClickZoom: true,  // 启用双击缩放
    enableInertialDragging: true, // 启用惯性拖拽
    enableContinuousZoom: true,   // 启用连续缩放
    enablePinchToZoom: true,      // 启用双指缩放
    enableAutoResize: true,       // 启用自动调整大小
    cursor: 'default'             // 设置默认鼠标样式
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
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.tool-btn {
  width: 36px;
  height: 36px;
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
  padding: 2px 4px;
  border-radius: 2px;
  cursor: text;
}

.layer-name:hover {
  background-color: #f5f5f5;
}

.layer-name-input {
  flex: 1;
  padding: 2px 4px;
  border: 1px solid #1890ff;
  border-radius: 2px;
  outline: none;
  font-size: inherit;
  color: #333;
  background: white;
  margin: 0 4px;
}

.layer-name-input:focus {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
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

.tool-btn.active {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.tool-btn.active:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 修改命名对话框样式 */
.name-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.name-dialog {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.name-dialog h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.name-dialog input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.name-dialog input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-buttons button {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.dialog-buttons button:first-child {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
}

.dialog-buttons button:first-child:disabled {
  background: #d9d9d9;
  border-color: #d9d9d9;
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
}

.dialog-buttons button:first-child:not(:disabled):hover {
  background: #73d13d;
  border-color: #73d13d;
}

.dialog-buttons button:last-child:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

/* 添加绘制控制按钮样式 */
.drawing-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 1000;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.control-btn i {
  font-size: 18px;
  color: white;
}

.control-btn.confirm {
  background: #52c41a;
}

.control-btn.confirm:hover {
  background: #73d13d;
}

.control-btn.cancel {
  background: #ff4d4f;
}

.control-btn.cancel:hover {
  background: #ff7875;
}
</style>
