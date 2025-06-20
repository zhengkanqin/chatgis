import { useToast } from 'primevue/usetoast';

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
            mapRef.value.addGeoJSON(msg.data);
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
    case 'plan':
      console.log('收到执行计划:', msg.data);
      // 触发自定义事件，让chat组件可以监听
      window.dispatchEvent(new CustomEvent('plan-message', { 
        detail: { type: 'plan', data: msg.data } 
      }));
      break;
    // 在这里可以添加更多的消息类型处理
    case 'file':
      console.log('处理文件上传');
      break;
    default:
      console.log('未知的消息类型:', msg.type);
  }
};

const RECONNECT_INTERVAL = 5000; // 重连间隔时间（毫秒）
const MAX_RECONNECT_ATTEMPTS = 50; // 最大重连次数

export const createWebSocket = (mapRef) => {
  let ws = null;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  const toast = useToast();
  let isFirstConnect = true;

  const connect = () => {
    if (isFirstConnect) {
      toast.add({
        severity: 'info',
        summary: '正在连接',
        detail: '正在建立ChatGIS服务连接...',
        life: 3000
      });
    }
    try {
      ws = new WebSocket('ws://127.0.0.1:8000/ws');
      
      ws.onopen = () => {
        console.log('WebSocket 连接成功');
        reconnectAttempts = 0; // 重置重连计数
        isFirstConnect = false;
        toast.add({ 
          severity: 'success', 
          summary: '连接成功', 
          detail: 'ChatGIS服务连接已建立', 
          life: 3000 
        });
      };

      ws.onmessage = (event) => handleWebSocketMessage(event, mapRef);

      ws.onclose = () => {
        console.log('WebSocket 连接关闭，准备重连...');
        if (!isFirstConnect && reconnectAttempts >= 3) {
          toast.add({ 
            severity: 'warn', 
            summary: '连接断开', 
            detail: 'ChatGIS服务连接已断开，正在尝试重连...', 
            life: 3000 
          });
        }
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimer = setTimeout(() => {
            reconnectAttempts++;
            console.log(`尝试第 ${reconnectAttempts} 次重连...`);
            if (reconnectAttempts >= 3) {
              toast.add({ 
                severity: 'info', 
                summary: '重连中', 
                detail: `正在进行第 ${reconnectAttempts} 次ChatGIS服务重连尝试...`, 
                life: 3000 
              });
            }
            connect();
          }, RECONNECT_INTERVAL);
        } else {
          console.log('达到最大重连次数，停止重连');
          toast.add({ 
            severity: 'error', 
            summary: '重连失败', 
            detail: '已达到最大重连次数，请刷新页面重试', 
            life: 5000 
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        if (reconnectAttempts >= 3) {
          toast.add({ 
            severity: 'error', 
            summary: '连接错误', 
            detail: 'ChatGIS服务连接发生错误，正在尝试重连', 
            life: 3000 
          });
        }
        ws.close(); // 触发 onclose 事件，开始重连
      };

    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      if (reconnectAttempts >= 3) {
        toast.add({ 
          severity: 'error', 
          summary: '连接失败', 
          detail: 'ChatGIS服务连接创建失败，正在尝试重连', 
          life: 3000 
        });
      }
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimer = setTimeout(() => {
          reconnectAttempts++;
          console.log(`尝试第 ${reconnectAttempts} 次重连...`);
          if (reconnectAttempts >= 3) {
            toast.add({ 
              severity: 'info', 
              summary: '重连中', 
              detail: `正在进行第 ${reconnectAttempts} 次ChatGIS服务重连尝试...`, 
              life: 3000 
            });
          }
          connect();
        }, RECONNECT_INTERVAL);
      }
    }
  };

  // 初始连接
  connect();

  // 返回一个对象，包含 WebSocket 实例和清理方法
  return {
    ws,
    cleanup: () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    }
  };
}; 