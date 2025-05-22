export class MapUtils {
  constructor(map) {
    this.map = map;
  }

  /**
   * 根据城市名称绘制边界
   * @param {string} cityName - 城市名称
   * @returns {Promise} - 返回边界信息
   */
  drawBoundaryByName(cityName) {
    return new Promise((resolve, reject) => {
      const bd = new BMap.Boundary();
      bd.get(cityName, (rs) => {
        if (!rs.boundaries.length) {
          reject(`未能获取 ${cityName} 的边界`);
          return;
        }

        // 清除旧图层
        this.map.clearOverlays();
        console.log(rs);
        const polygons = rs.boundaries.map(path => {
          const ply = new BMap.Polygon(path, {
            strokeWeight: 2,
            strokeColor: "#ff0000",
            fillColor: "#ffcccc",
            fillOpacity: 0.4
          });
          this.map.addOverlay(ply);
          return ply;
        });

        const bounds = polygons.reduce(
          (acc, poly) => acc.union(poly.getBounds()),
          polygons[0].getBounds()
        );

        // 限制区域（需要 BMapLib 引入）
        if (window.BMapLib?.AreaRestriction) {
          BMapLib.AreaRestriction.setBounds(this.map, bounds);
        } else {
          console.warn("AreaRestriction 插件未加载");
        }

        resolve({ bounds, polygons });
      });
    });
  }

  /**
   * 初始化地图
   * @param {HTMLElement} container - 地图容器元素
   * @param {Object} options - 初始化选项
   */
  static initMap(container, options = {}) {
    const map = new BMap.Map(container);
    map.enableScrollWheelZoom(true);
    
    const defaultCenter = new BMap.Point(114.305393, 30.593099);
    const defaultZoom = 13;
    
    map.centerAndZoom(
      options.center || defaultCenter, 
      options.zoom || defaultZoom
    );
    
    return map;
  }
} 