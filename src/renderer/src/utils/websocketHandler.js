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
          break;
        case 'draw-point':
          console.log('绘制点');
          break;
        case 'draw-polygon':
          console.log('绘制多边形');
          break;
        case 'draw-circle':
          console.log('绘制圆');
          break;
        case 'draw-rectangle':
          console.log('绘制矩形');
          break;
        case 'draw-text':
          console.log('绘制文本');
          break;
        case 'draw-image':
          console.log('绘制图片');
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