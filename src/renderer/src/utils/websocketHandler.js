export const handleWebSocketMessage = (event, mapRef) => {
  const msg = JSON.parse(event.data);
  console.log('收到消息:', msg);

  switch (msg.type) {
    case 'draw-city':
      console.log('处理城市边界绘制');
      mapRef.value.drawBoundaryByName(msg.data);
      break;
    // 在这里可以添加更多的消息类型处理
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