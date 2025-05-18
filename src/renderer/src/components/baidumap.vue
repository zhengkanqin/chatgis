<template>
  <div class="map-container" ref="mapContainer"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const mapContainer = ref(null);

onMounted(() => {
  initMap();
});

const initMap = () => {
  if (!mapContainer.value) return;

  const map = new BMap.Map(mapContainer.value);
  const centerPoint = new BMap.Point(111.77489, 30.39788);
  map.centerAndZoom(centerPoint, 13);
  map.enableScrollWheelZoom(true);

  // 注意这里使用的是 BMap.Boundary（不是 BMapLib）
  const bd = new BMap.Boundary();
  bd.get("枝江市", (rs) => {
    if (!rs.boundaries.length) {
      console.warn("未能获取边界");
      return;
    }

    const polygons = rs.boundaries.map(path => {
      const ply = new BMap.Polygon(path, {
        strokeWeight: 2,
        strokeColor: "#ff0000"
      });
      map.addOverlay(ply);
      return ply;
    });

    const bounds = polygons.reduce(
      (acc, poly) => acc.union(poly.getBounds()),
      polygons[0].getBounds()
    );

    // 限制地图范围
    BMapLib.AreaRestriction.setBounds(map, bounds);
  });
};

</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 500px; /* 根据需要调整高度 */
}
</style>