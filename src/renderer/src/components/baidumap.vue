<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  if (!mapContainer.value) return;

  map = new BMap.Map(mapContainer.value);
  map.enableScrollWheelZoom(true);
  map.centerAndZoom(new BMap.Point(116.404, 39.915), 12); // 设置初始中心点为北京
});


const drawBoundaryByName = (cityName) => {
  return new Promise((resolve, reject) => {
    const bd = new BMap.Boundary();
    bd.get(cityName, (rs) => {
      if (!rs.boundaries.length) {
        reject(`未能获取 ${cityName} 的边界`);
        return;
      }

      // 清除旧图层
      map.clearOverlays();

      const polygons = rs.boundaries.map(path => {
        const ply = new BMap.Polygon(path, {
          strokeWeight: 2,
          strokeColor: "#ff0000",
          fillColor: "#ffcccc",
          fillOpacity: 0.4
        });
        map.addOverlay(ply);
        return ply;
      });

      const bounds = polygons.reduce(
        (acc, poly) => acc.union(poly.getBounds()),
        polygons[0].getBounds()
      );

      // 移动视图到区域
      map.setViewport(bounds);

      // 限制区域（需要 BMapLib 引入）
      if (window.BMapLib?.AreaRestriction) {
        BMapLib.AreaRestriction.setBounds(map, bounds);
      } else {
        console.warn("AreaRestriction 插件未加载");
      }

      resolve({ bounds, polygons });
    });
  });
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
}
</style>
