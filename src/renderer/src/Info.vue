<template>
    <div id="app">
      <div id="map" style="width: 100%; height: 100%;"></div>
      <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 1000;">
        <input type="file" @change="handleFileUpload" accept="image/png" style="display: none;" ref="fileInput" />
        <button @click="triggerFileInput">上传图片</button>
        <div style="margin-top: 10px;">
          <div>
            <label for="swLng">西南角经度:</label>
            <input type="number" id="swLng" v-model="swLng" step="any" />
          </div>
          <div>
            <label for="swLat">西南角纬度:</label>
            <input type="number" id="swLat" v-model="swLat" step="any" />
          </div>
        </div>
        <div style="margin-top: 10px;">
          <div>
            <label for="neLng">东北角经度:</label>
            <input type="number" id="neLng" v-model="neLng" step="any" />
          </div>
          <div>
            <label for="neLat">东北角纬度:</label>
            <input type="number" id="neLat" v-model="neLat" step="any" />
          </div>
        </div>
        <button @click="updateImageOverlay">更新图片位置</button>
      </div>
    </div>
  </template>
  

  <script setup>
  import { ref, onMounted } from 'vue';
  
  /* global BMapGL */ // 告诉 ESLint BMapGL 是一个全局变量
  
  const mapInstance = ref(null);
  const imageUrl = ref(null);
  const imageOverlay = ref(null);
  const swLng = ref(108.25);
  const swLat = ref(29.05);
  const neLng = ref(116.20);
  const neLat = ref(33.00);
  const fileInput = ref(null);
  
  const initMap = () => {
    // 确保百度地图 API 已加载
    if (window.BMapGL) {
      mapInstance.value = new BMapGL.Map("map"); // 创建地图实例
      mapInstance.value.centerAndZoom(new BMapGL.Point(114.3054, 30.5929), 6); // 设置地图中心点和缩放级别
      mapInstance.value.enableScrollWheelZoom(true); // 启用滚轮缩放
    } else {
      console.error('百度地图 API 未加载，将在 1 秒后重试');
      setTimeout(() => {
        initMap();
      }, 1000);
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageUrl.value = e.target.result;
      };
      reader.onerror = (error) => {
        console.error('文件读取失败:', error);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const createImageOverlay = (imageUrl, swLng, swLat, neLng, neLat) => {
    if (!imageUrl) {
      console.error('没有上传图片');
      return;
    }
  
    if (imageOverlay.value) {
      mapInstance.value.removeOverlay(imageOverlay.value); // 如果已有覆盖物，先移除
    }
  
    try {
      const bounds = new BMapGL.Bounds(
        new BMapGL.Point(swLng, swLat),
        new BMapGL.Point(neLng, neLat)
      );
      imageOverlay.value = new BMapGL.GroundOverlay(bounds, {
        url: imageUrl,
        opacity: 0.5 // 设置透明度为 50%
      });
      mapInstance.value.addOverlay(imageOverlay.value); // 将图片覆盖物添加到地图上
    } catch (error) {
      console.error('创建图片覆盖物时发生错误:', error);
    }
  };
  
  const updateImageOverlay = () => {
    createImageOverlay(
      imageUrl.value,
      swLng.value,
      swLat.value,
      neLng.value,
      neLat.value
    );
  };
  
  const triggerFileInput = () => {
    fileInput.value.click(); // 触发文件输入框
  };
  
  onMounted(() => {
    initMap(); // 初始化地图
  });
  </script>
  
