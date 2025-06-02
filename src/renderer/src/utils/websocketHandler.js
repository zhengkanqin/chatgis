export const handleWebSocketMessage = (event, mapRef) => {
  const msg = JSON.parse(event.data);
  console.log('收到消息:', msg);




  switch (msg.type) {
    case 'map':
      switch(msg.operation) {
        case 'draw-boundary':
          console.log('绘制边界');
          mapRef.value.drawBoundaryByName(msg.data);
          break;
          case 'draw-line':
            console.log('绘制线路');
            mapRef.value.addPolyline(msg.data);
            break;
          case 'draw-point':
            console.log('绘制点');
            mapRef.value.addMarker(msg.data);
            break;
          case 'draw-polygon':
            console.log('绘制多边形');
            mapRef.value.addPolygon(msg.data);
            break;
          //止 更改操作
  
          //起 添加函数
          case 'draw-circle':
            console.log('绘制圆');
            mapRef.value.addCircle(msg.data);
            break;
          case 'draw-rectangle':
            console.log('绘制矩形');
            mapRef.value.addRectangle(msg.data);
            break;
          case 'draw-label':
            console.log('绘制文本');
            mapRef.value.addLabel(msg.data);
            break;
          //止 添加函数
  
          //起 更改操作
          case 'draw-image':
            mapRef.value.addImageLayer(msg.data);
            console.log('绘制图片');
            break;
          //止 更改操作
  
          case 'draw-geojson':
            mapRef.value.addGeoJSONLayer(msg.data);
            console.log('绘制geojson');
            break;
          case 'draw-video':
            console.log('绘制视频');
            break;
          case 'draw-audio':
            console.log('绘制音频');
            break;
          case 'move-map':
            console.log('移动地图');
            break;
          case 'zoom-map':
            console.log('缩放地图');
            break;
          case 'locate-map':
            console.log('定位地图');
            
            break; 
        }
        break;
    // 在这里可以添加更多的消息类型处理
    case 'file':
      console.log('处理文件上传');
      break;
    default:
      console.log('未知的消息类型:', msg.type);
  }
};







export const createWebSocket = (mapRef) => {
  const ws = new WebSocket('ws://127.0.0.1:8000/ws');
  
  ws.onopen = () => {
    console.log('WebSocket 连接成功');
  };

  ws.onmessage = (event) => handleWebSocketMessage(event, mapRef);

  return ws;
}; 