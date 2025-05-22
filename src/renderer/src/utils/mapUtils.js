export class MapUtils {
  constructor(map) {
    this.map = map;
    this.layers = new Map(); // 使用 Map 存储所有图层，key 为图层 ID，value 为图层对象
    this.boundaryOverlays = []; // 存储边界图层
  }

  /**
   * 生成唯一图层 ID
   * @returns {string} 图层 ID
   */
  generateLayerId() {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加图层
   * @param {Object} overlay - 覆盖物对象
   * @param {string} type - 图层类型（点、线、面等）
   * @param {string} name - 图层名称
   * @returns {string} 图层 ID
   */
  addLayer(overlay, type, name) {
    const layerId = this.generateLayerId();
    this.layers.set(layerId, {
      id: layerId,
      overlay,
      type,
      name,
      createTime: new Date()
    });
    this.map.addOverlay(overlay);
    
    // 触发自定义事件通知图层更新
    const event = new CustomEvent('layer-updated', {
      detail: { type: 'add', layerId }
    });
    this.map.getContainer().dispatchEvent(event);
    
    return layerId;
  }

  /**
   * 删除指定图层
   * @param {string} layerId - 图层 ID
   * @returns {boolean} 是否删除成功
   */
  removeLayer(layerId) {
    const layer = this.layers.get(layerId);
    if (layer) {
      if (Array.isArray(layer.overlay)) {
        // 处理 GeoJSON 图层
        layer.overlay.forEach(overlay => {
          this.map.removeOverlay(overlay);
        });
      } else {
        // 处理其他类型图层
        this.map.removeOverlay(layer.overlay);
      }
      this.layers.delete(layerId);
      return true;
    }
    return false;
  }

  /**
   * 获取所有图层信息
   * @returns {Array} 图层信息数组
   */
  getAllLayers() {
    return Array.from(this.layers.values());
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

        try {
          const layerIds = [];
          const polygons = rs.boundaries.map((path, index) => {
            const ply = new BMap.Polygon(path, {
              strokeWeight: 2,
              strokeColor: "#ff0000",
              fillColor: "#ffcccc",
              fillOpacity: 0.4
            });
            // 使用图层管理系统添加边界
            const layerId = this.addLayer(ply, '边界', `${cityName}边界${index + 1}`);
            layerIds.push(layerId);
            return ply;
          });

          // 使用第一个多边形的边界作为初始值
          const bounds = new BMap.Bounds();
          // 遍历所有多边形，扩展边界
          polygons.forEach(poly => {
            const polyBounds = poly.getBounds();
            bounds.extend(polyBounds.getSouthWest());
            bounds.extend(polyBounds.getNorthEast());
          });

          if (window.BMapLib?.AreaRestriction) {
            BMapLib.AreaRestriction.setBounds(this.map, bounds);
          } else {
            console.warn("AreaRestriction 插件未加载");
          }

          resolve({ bounds, polygons, layerIds });
        } catch (error) {
          console.error('绘制边界时发生错误:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * 添加点标记
   * @param {BMap.Point} point - 坐标点
   * @param {string} name - 标记名称
   * @returns {string} 图层 ID
   */
  addMarker(point, name) {
    const marker = new BMap.Marker(point);
    return this.addLayer(marker, '点', name);
  }

  /**
   * 添加折线
   * @param {Array<BMap.Point>} points - 坐标点数组
   * @param {string} name - 折线名称
   * @returns {string} 图层 ID
   */
  addPolyline(points, name) {
    const polyline = new BMap.Polyline(points, {
      strokeColor: "#0000ff",
      strokeWeight: 2,
      strokeOpacity: 0.8
    });
    return this.addLayer(polyline, '线', name);
  }

  /**
   * 添加多边形
   * @param {Array<BMap.Point>} points - 坐标点数组
   * @param {string} name - 多边形名称
   * @returns {string} 图层 ID
   */
  addPolygon(points, name) {
    const polygon = new BMap.Polygon(points, {
      strokeColor: "#ff0000",
      strokeWeight: 2,
      fillColor: "#ffcccc",
      fillOpacity: 0.4
    });
    return this.addLayer(polygon, '面', name);
  }

  /**
   * 清除所有边界图层
   */
  clearBoundaryOverlays() {
    this.boundaryOverlays.forEach(overlay => {
      this.map.removeOverlay(overlay);
    });
    this.boundaryOverlays = [];
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

  /**
   * 添加 GeoJSON 图层
   * @param {Object} geojson - GeoJSON 数据
   * @param {string} name - 图层名称
   * @param {Object} style - 样式配置
   * @returns {string} 图层 ID
   */
  addGeoJSONLayer(geojson, name, style = {}) {
    const defaultStyle = {
      strokeColor: "#0000ff",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: "#ffcccc",
      fillOpacity: 0.4
    };
    const finalStyle = { ...defaultStyle, ...style };

    const overlays = [];
    
    // 处理不同类型的 GeoJSON 要素
    geojson.features.forEach(feature => {
      const geometry = feature.geometry;
      const properties = feature.properties;
      
      switch (geometry.type) {
        case 'Point':
          const point = new BMap.Point(geometry.coordinates[0], geometry.coordinates[1]);
          const marker = new BMap.Marker(point);
          if (properties.title) {
            marker.setTitle(properties.title);
          }
          overlays.push(marker);
          break;

        case 'LineString':
          const points = geometry.coordinates.map(coord => 
            new BMap.Point(coord[0], coord[1])
          );
          const polyline = new BMap.Polyline(points, {
            strokeColor: finalStyle.strokeColor,
            strokeWeight: finalStyle.strokeWeight,
            strokeOpacity: finalStyle.strokeOpacity
          });
          overlays.push(polyline);
          break;

        case 'Polygon':
          const paths = geometry.coordinates.map(ring =>
            ring.map(coord => new BMap.Point(coord[0], coord[1]))
          );
          const polygon = new BMap.Polygon(paths, {
            strokeColor: finalStyle.strokeColor,
            strokeWeight: finalStyle.strokeWeight,
            strokeOpacity: finalStyle.strokeOpacity,
            fillColor: finalStyle.fillColor,
            fillOpacity: finalStyle.fillOpacity
          });
          overlays.push(polygon);
          break;
      }
    });

    // 将所有覆盖物作为一个图层组添加
    const layerId = this.generateLayerId();
    this.layers.set(layerId, {
      id: layerId,
      overlay: overlays,
      type: 'GeoJSON',
      name,
      createTime: new Date()
    });

    // 添加所有覆盖物到地图
    overlays.forEach(overlay => {
      this.map.addOverlay(overlay);
    });

    // 触发自定义事件通知图层更新
    const event = new CustomEvent('layer-updated', {
      detail: { type: 'add', layerId }
    });
    this.map.getContainer().dispatchEvent(event);

    return layerId;
  }

  /**
   * 添加图片图层
   * @param {string} url - 图片URL
   * @param {BMap.Bounds} bounds - 图片显示范围
   * @param {string} name - 图层名称
   * @param {Object} options - 配置选项
   * @returns {string} 图层 ID
   */
  addImageLayer(url, bounds, name, options = {}) {
    const defaultOptions = {
      opacity: 0.5,
      displayOnMinLevel: 0,
      displayOnMaxLevel: 18
    };
    const finalOptions = { ...defaultOptions, ...options };

    const imageLayer = new BMap.GroundOverlay(bounds, {
      type: 'image',
      url: url,
      opacity: finalOptions.opacity,
      displayOnMinLevel: finalOptions.displayOnMinLevel,
      displayOnMaxLevel: finalOptions.displayOnMaxLevel
    });

    // 使用 addLayer 方法添加图层
    const layerId = this.addLayer(imageLayer, '图片', name);
    
    // 调整地图视野以显示图片
    this.map.setViewport(bounds);
    
    return layerId;
  }
} 