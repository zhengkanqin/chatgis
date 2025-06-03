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
      visible: true, // 默认显示
      createTime: new Date()
    });
    
    if (Array.isArray(overlay)) {
      overlay.forEach(item => this.map.addOverlay(item));
    } else {
      this.map.addOverlay(overlay);
    }
    
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
      const bd = new BMapGL.Boundary();
      bd.get(cityName, (rs) => {
        if (!rs.boundaries.length) {
          reject(`未能获取 ${cityName} 的边界`);
          return;
        }

        try {
          const layerIds = [];
          const polygons = rs.boundaries.map((boundary, index) => {
            // 将边界字符串转换为点数组
            const points = boundary.split(';').map(pointStr => {
              const [lng, lat] = pointStr.split(',').map(Number);
              return new BMapGL.Point(lng, lat);
            });

            const polygon = new BMapGL.Polygon(points, {
              strokeColor: "#ff0000",
              strokeWeight: 2,
              fillColor: "#ffcccc",
              fillOpacity: 0.4,
              enableEditing: false,
              enableClicking: true
            });
            const layerId = this.addLayer(polygon, '边界', `${cityName}边界${index + 1}`);
            layerIds.push(layerId);
            return polygon;
          });

          const bounds = new BMapGL.Bounds();
          polygons.forEach(poly => {
            const path = poly.getPath();
            path.forEach(point => bounds.extend(point));
          });

          this.map.setViewport(bounds);
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
    const marker_point = JSON.parse(point);
    const [lng, lat] = marker_point;
    const marker = new BMapGL.Marker(new BMapGL.Point(lng, lat));
    return this.addLayer(marker, '点', name);
  }

  /**
   * 添加折线
   * @param {Array<BMap.Point>} points - 坐标点数组
   * @param {string} name - 折线名称
   * @returns {string} 图层 ID
   */
  addPolyline(points, name) {
    const pointsArray = JSON.parse(points);
    const line_points = pointsArray.map(point => new BMapGL.Point(point[0], point[1]));
    console.log("折线",line_points,name)
    const polyline = new BMapGL.Polyline(line_points, {
      strokeColor: "#0000ff",
      strokeWeight: 2,
      strokeOpacity: 0.8,
      enableEditing: false,
      enableClicking: true
    });
    return this.addLayer(polyline, '线', name);
  }

/**
   * 添加圆
   * @param {BMap.Point} point - 坐标点
   * @param {string} name - 圆名称
   * @returns {string} 图层 ID
   */
addCircle(point, radius, name) {
  const circle_point = JSON.parse(point);
  console.log(circle_point);
  const circle_radius = JSON.parse(parseFloat(radius));
  const [lng, lat] = circle_point;
  const circle = new BMapGL.Circle(new BMapGL.Point(lng, lat), circle_radius, {
    strokeColor: "#0000ff",    
    fillColor: "#ff8605",     
    strokeWeight: 3,          
    strokeOpacity: 0.8,        
    fillOpacity: 0.4,          
    strokeStyle: 'solid'       
  });
  return this.addLayer(circle, '圆', name);
}

  /**
   * 添加多边形
   * @param {Array<BMap.Point>} points - 坐标点数组
   * @param {string} name - 多边形名称
   * @returns {string} 图层 ID
   */
  addPolygon(points, name) {
    const pointsArray = JSON.parse(points);
    const polygon_points = pointsArray.map(point => new BMapGL.Point(point[0], point[1]));
    const polygon = new BMapGL.Polygon(polygon_points, {
      strokeColor: "#ff0000",
      strokeWeight: 2,
      fillColor: "#ffcccc",
      fillOpacity: 0.4,
      enableEditing: false,
      enableClicking: true
    });
    return this.addLayer(polygon, '面', name);
  }

    /**
   * 添加矩形
   * @param {Array<BMap.Point>} points - 坐标点数组
   * @param {string} name - 矩形名称
   * @returns {string} 图层 ID
   */
    addRectangle(points, name) {
      const pointsArray = JSON.parse(points);
      const rectangle_points = pointsArray.map(point => new BMapGL.Point(point[0], point[1]));
      console.log(rectangle_points);
      const rectangle = new BMapGL.Polygon(rectangle_points, {
        strokeColor: "#0000ff",    
        fillColor: "#ff8605",      
        strokeWeight: 3,           
        strokeOpacity: 0.8,        
        fillOpacity: 0.4,          
        strokeStyle: 'solid'      
      });
      return this.addLayer(rectangle, '矩形', name);
    }
  
      /**
     * 添加文本
     * @param {BMap.Point} point - 坐标点
     * @param {string} name - 矩形名称
     * @returns {string} 图层 ID
     */
      addLabel(point, name) {
        const label_point = JSON.parse(point);
        const [lng, lat] = label_point;
        console.log(label_point,name);
        const label = new BMapGL.Label(name, {
          position: new BMapGL.Point(lng, lat), 
          offset: new BMapGL.Size(20, -10), 
          style: {
            color: "red", 
            fontSize: "16px",
            height: "20px",
            lineHeight: "20px", 
            fontFamily: "微软雅黑", 
            backgroundColor: "rgba(255, 255, 255, 0.8)", 
            padding: "5px", 
            borderRadius: "5px", 
            border: "0px solid #ccc"
          }
        });
        return this.addLayer(label, '文本', name);
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
    const map = new BMapGL.Map(container, options);
    map.centerAndZoom(new BMapGL.Point(114.305393, 30.593099), 12);
    map.enableScrollWheelZoom();
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
      fillOpacity: 0.4,
      enableEditing: false,
      enableClicking: true
    };
    const finalStyle = { ...defaultStyle, ...style };

    const overlays = [];
    
    geojson.features.forEach(feature => {
      const geometry = feature.geometry;
      const properties = feature.properties;
      
      switch (geometry.type) {
        case 'Point':
          const point = new BMapGL.Point(geometry.coordinates[0], geometry.coordinates[1]);
          const marker = new BMapGL.Marker(point);
          if (properties.title) {
            marker.setTitle(properties.title);
          }
          marker.addEventListener('mouseover', () => {
            const event = new CustomEvent('feature-hover', { detail: { properties, geometry } });
            this.map.getContainer().dispatchEvent(event);
          });
          marker.addEventListener('mouseout', () => {
            const event = new CustomEvent('feature-hover', { detail: null });
            this.map.getContainer().dispatchEvent(event);
          });
          overlays.push(marker);
          break;

        case 'LineString':
          const points = geometry.coordinates.map(coord => 
            new BMapGL.Point(coord[0], coord[1])
          );
          const polyline = new BMapGL.Polyline(points, {
            strokeColor: finalStyle.strokeColor,
            strokeWeight: finalStyle.strokeWeight,
            strokeOpacity: finalStyle.strokeOpacity,
            enableEditing: false,
            enableClicking: true
          });
          polyline.addEventListener('mouseover', () => {
            const event = new CustomEvent('feature-hover', { detail: { properties, geometry } });
            this.map.getContainer().dispatchEvent(event);
          });
          polyline.addEventListener('mouseout', () => {
            const event = new CustomEvent('feature-hover', { detail: null });
            this.map.getContainer().dispatchEvent(event);
          });
          overlays.push(polyline);
          break;

        case 'Polygon':
          const paths = geometry.coordinates.map(ring =>
            ring.map(coord => new BMapGL.Point(coord[0], coord[1]))
          );
          const polygon = new BMapGL.Polygon(paths, {
            strokeColor: finalStyle.strokeColor,
            strokeWeight: finalStyle.strokeWeight,
            strokeOpacity: finalStyle.strokeOpacity,
            fillColor: finalStyle.fillColor,
            fillOpacity: finalStyle.fillOpacity,
            enableEditing: false,
            enableClicking: true
          });
          polygon.addEventListener('mouseover', () => {
            const event = new CustomEvent('feature-hover', { detail: { properties, geometry } });
            this.map.getContainer().dispatchEvent(event);
          });
          polygon.addEventListener('mouseout', () => {
            const event = new CustomEvent('feature-hover', { detail: null });
            this.map.getContainer().dispatchEvent(event);
          });
          overlays.push(polygon);
          break;
      }
    });

    const layerId = this.generateLayerId();
    this.layers.set(layerId, {
      id: layerId,
      overlay: overlays,
      type: 'GeoJSON',
      name,
      originalData: geojson,  // 保存原始 GeoJSON 数据
      createTime: new Date()
    });

    overlays.forEach(overlay => {
      this.map.addOverlay(overlay);
    });

    const event = new CustomEvent('layer-updated', {
      detail: { type: 'add', layerId }
    });
    this.map.getContainer().dispatchEvent(event);

    return layerId;
  }

  /**
   * 创建信息窗口内容
   * @param {Object} properties - 属性对象
   * @returns {string} HTML内容
   */
  createInfoContent(properties) {
    let content = '<div style="padding: 5px;">';
    
    const formatValue = (value) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
          .map(([k, v]) => `${k}: ${formatValue(v)}`)
          .join('<br>');
      }
      return value;
    };

    for (const [key, value] of Object.entries(properties)) {
      if (key === 'title') continue; // 跳过标题，因为已经在窗口标题中显示
      content += `<p><strong>${key}:</strong> ${formatValue(value)}</p>`;
    }
    
    content += '</div>';
    return content;
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
    const boundsArray = JSON.parse(bounds);
    const optionsObj = JSON.parse(options);
    const swLng = boundsArray[0][0]; 
    const swLat =  boundsArray[0][1];
    const neLng = boundsArray[1][0];
    const neLat =boundsArray[1][1];
    const image_bounds = new BMapGL.Bounds(
      new BMapGL.Point(swLng, swLat), 
      new BMapGL.Point(neLng, neLat) 
    ); 
    console.log(image_bounds);
    const defaultOptions = {
      opacity: 0.5,
      displayOnMinLevel: 0,
      displayOnMaxLevel: 18
    };
    const finalOptions = { ...defaultOptions, ...optionsObj };
    const imageLayer = new BMapGL.GroundOverlay(image_bounds, {
      url: url,
      opacity: finalOptions.opacity,
      displayOnMinLevel:finalOptions.displayOnMinLevel,
      displayOnMaxLevel:finalOptions.displayOnMaxLevel
    });

    // 使用 addLayer 方法添加图层
    const layerId = this.addLayer(imageLayer, '图片', name);
    
    // 保存原始数据
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.originalData = {
        url: url,
        bounds: bounds,
        options: options
      };
    }
    
    // 调整地图视野以显示图片
    this.map.setViewport(image_bounds);
    
    return layerId;
  }


  
  /**
   * 平移地图
   * @param {number} x - X轴平移距离
   * @param {number} y - Y轴平移距离
   */
  panBy(x, y) {
    if (!this.map) return;
    this.map.panBy(x, y);
  }

  /**
   * 放大一级
   */
  zoomIn() {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    this.map.setZoom(zoom + 1);
  }

  /**
   * 缩小一级
   */
  zoomOut() {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    this.map.setZoom(zoom - 1);
  }

  /**
   * 设置缩放级别
   * @param {number} zoom - 缩放级别
   */
  setZoom(zoom) {
    if (!this.map) return;
    this.map.setZoom(zoom);
  }

  /**
   * 获取当前缩放级别
   * @returns {number|null} 当前缩放级别
   */
  getZoom() {
    if (!this.map) return null;
    return this.map.getZoom();
  }

  /**
   * 获取地图中心点
   * @returns {BMapGL.Point|null} 地图中心点
   */
  getCenter() {
    if (!this.map) return null;
    return this.map.getCenter();
  }

  /**
   * 设置地图中心点
   * @param {BMapGL.Point} point - 中心点坐标
   */
  setCenter(point) {
    if (!this.map || !point) return;
    this.map.setCenter(point);
  }

  /**
   * 设置地图类型
   * @param {string} type - 地图类型：'normal'|'satellite'|'hybrid'
   */
  setMapType(type) {
    if (!this.map) return;
    switch (type) {
      case 'normal':
        this.map.setMapType(BMAP_NORMAL_MAP);
        break;
      case 'satellite':
        this.map.setMapType(BMAP_SATELLITE_MAP);
        break;
      case 'hybrid':
        this.map.setMapType(BMAP_HYBRID_MAP);
        break;
      default:
        console.warn('未知的地图类型:', type);
    }
  }

  /**
   * 获取当前地图类型
   * @returns {string|null} 地图类型：'normal'|'satellite'|'hybrid'
   */
  getMapType() {
    if (!this.map) return null;
    const type = this.map.getMapType();
    if (type === BMAP_NORMAL_MAP) return 'normal';
    if (type === BMAP_SATELLITE_MAP) return 'satellite';
    if (type === BMAP_HYBRID_MAP) return 'hybrid';
    return null;
  }

  /**
   * 启用/禁用滚轮缩放
   * @param {boolean} enable - 是否启用
   */
  enableScrollWheelZoom(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableScrollWheelZoom();
    } else {
      this.map.disableScrollWheelZoom();
    }
  }

  /**
   * 启用/禁用拖拽
   * @param {boolean} enable - 是否启用
   */
  enableDragging(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableDragging();
    } else {
      this.map.disableDragging();
    }
  }

  /**
   * 启用/禁用双击缩放
   * @param {boolean} enable - 是否启用
   */
  enableDoubleClickZoom(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableDoubleClickZoom();
    } else {
      this.map.disableDoubleClickZoom();
    }
  }

  /**
   * 启用/禁用键盘控制
   * @param {boolean} enable - 是否启用
   */
  enableKeyboard(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableKeyboard();
    } else {
      this.map.disableKeyboard();
    }
  }

  /**
   * 启用/禁用惯性拖拽
   * @param {boolean} enable - 是否启用
   */
  enableInertialDragging(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableInertialDragging();
    } else {
      this.map.disableInertialDragging();
    }
  }

  /**
   * 启用/禁用连续缩放
   * @param {boolean} enable - 是否启用
   */
  enableContinuousZoom(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableContinuousZoom();
    } else {
      this.map.disableContinuousZoom();
    }
  }

  /**
   * 启用/禁用双指缩放
   * @param {boolean} enable - 是否启用
   */
  enablePinchToZoom(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enablePinchToZoom();
    } else {
      this.map.disablePinchToZoom();
    }
  }

  /**
   * 启用/禁用自动调整大小
   * @param {boolean} enable - 是否启用
   */
  enableAutoResize(enable = true) {
    if (!this.map) return;
    if (enable) {
      this.map.enableAutoResize();
    } else {
      this.map.disableAutoResize();
    }
  }

  /**
   * 重置地图到默认状态
   */
  reset() {
    if (!this.map) return;
    const defaultCenter = new BMapGL.Point(114.305393, 30.593099);
    const defaultZoom = 13;
    this.map.centerAndZoom(defaultCenter, defaultZoom);
  }

  /**
   * 设置图层显示状态
   * @param {string} layerId - 图层 ID
   * @param {boolean} visible - 是否显示
   * @returns {boolean} 是否设置成功
   */
  setLayerVisible(layerId, visible) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    if (Array.isArray(layer.overlay)) {
      // 处理 GeoJSON 图层
      layer.overlay.forEach(overlay => {
        if (visible) {
          this.map.addOverlay(overlay);
        } else {
          this.map.removeOverlay(overlay);
        }
      });
    } else {
      // 处理单个覆盖物
      if (visible) {
        this.map.addOverlay(layer.overlay);
      } else {
        this.map.removeOverlay(layer.overlay);
      }
    }

    // 更新图层状态
    layer.visible = visible;
    this.layers.set(layerId, layer);

    // 触发自定义事件通知图层更新
    const event = new CustomEvent('layer-updated', {
      detail: { type: 'visibility', layerId, visible }
    });
    this.map.getContainer().dispatchEvent(event);

    return true;
  }

  /**
   * 获取图层显示状态
   * @param {string} layerId - 图层 ID
   * @returns {boolean|null} 图层显示状态
   */
  getLayerVisible(layerId) {
    const layer = this.layers.get(layerId);
    return layer ? layer.visible : null;
  }

  /**
   * 切换图层显示状态
   * @param {string} layerId - 图层 ID
   * @returns {boolean} 切换后的显示状态
   */
  toggleLayerVisible(layerId) {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    const newVisible = !layer.visible;
    this.setLayerVisible(layerId, newVisible);
    return newVisible;
  }
} 