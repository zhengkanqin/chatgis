<template>
  <div class="chat-container">
    <ChatHistory ref="historyRef" :messages="messages" />

    <form @submit.prevent="sendMessage" class="input-area">
      <textarea
        ref="textarea"
        v-model="input"
        class="chat-input"
        placeholder="请输入消息..."
        :disabled="isSending"
        rows="1"
        @input="adjustHeight"
        @keydown.enter="handleEnter"
      ></textarea>

      <div class="button-bar">
        <div class="left-buttons">
          <i class="pi pi-file" title="文件" @click.stop="toggleFilePopover"></i>
          <i class="pi pi-book" title="知识库"></i>
          <i class="pi pi-paperclip" title="连接"></i>
        </div>
        <button type="submit" :disabled="!input.trim() || isSending">
          <template v-if="isSending">
            <span class="spinner"></span>思考中...
          </template>
          <template v-else>
            发送
          </template>
        </button>
      </div>
    </form>

    <Popover ref="filePopover" :showCloseIcon="true" appendTo="self" position="top">
      <div class="file-manager">
        <div class="file-header">
          <h3>文件管理</h3>
          <Button icon="pi pi-upload" label="上传文件" @click.stop="triggerFileInput" />
        </div>
        <div class="file-list">
          <template v-if="fileList.length === 0">
            <div class="no-files">暂无文件</div>
          </template>
          <template v-else>
            <div v-for="(file, index) in fileList" 
                 :key="file.path" 
                 class="file-item"
                 :title="file.path">
              <span class="file-name">{{ formatFileName(file.name) }}</span>
              <i class="pi pi-times remove-file" 
                 @click.stop="removeFile(index)" 
                 title="移除文件"></i>
            </div>
          </template>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, reactive } from 'vue'
import ChatHistory from './ChatHistory.vue'
import Popover from 'primevue/popover'
import Button from 'primevue/button'

const input = ref('')
const messages = ref([])
const isSending = ref(false)
const textarea = ref(null)
const historyRef = ref(null)
const filePopover = ref(null)
const fileList = reactive([])

const isImageFile = (fileName) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

const toggleFilePopover = (event) => {
  console.log('toggleFilePopover called')
  const buttonRect = event.target.getBoundingClientRect()
  const popover = filePopover.value
  popover.toggle(event)
  
  // 在下一个 tick 中设置位置
  nextTick(() => {
    const popoverEl = popover.$el
    if (popoverEl) {
      // 计算位置，使其显示在按钮上方
      const top = buttonRect.top - popoverEl.offsetHeight - 5 // 5px 的间距
      const left = buttonRect.left
      
      // 设置位置
      popoverEl.style.top = `${top}px`
      popoverEl.style.left = `${left}px`
    }
  })
}

const triggerFileInput = async () => {
  try {
    const result = await window.api.selectFile()
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = filePath.split(/[\\/]/).pop()
      const newFile = {
        path: filePath,
        name: fileName,
        type: isImageFile(fileName) ? 'pic' : 'file'
      }
      fileList.push(newFile)
      await nextTick()
    }
  } catch (error) {
    console.error('选择文件失败:', error)
  }
}

const removeFile = (index) => {
  console.log('removeFile called with index:', index)
  fileList.splice(index, 1)
}

const sendMessage = async () => {
  const content = input.value.trim()
  if (!content && fileList.length === 0) return

  // 先清空输入和文件列表
  const currentFiles = [...fileList]
  fileList.length = 0  // 清空文件列表
  input.value = ''
  isSending.value = true
  adjustHeight()

  // 如果有文件，先添加文件消息
  for (const file of currentFiles) {
    messages.value.push({
      type: file.type,
      source: 'user',
      content: file.type === 'pic' ? file.path : file.name
    })
  }

  // 如果有文本内容，添加文本消息
  if (content) {
    messages.value.push({ type: 'TextMessage', source: 'user', content })
  }

  try {
    const requestBody = {
      query: content
    }
    
    // 只有当有文件时才添加 filelist
    if (currentFiles.length > 0) {
      requestBody.filelist = currentFiles.map(file => file.path)
    }

    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          
          switch(data.type) {
            case 'tool_start':
              const toolInfo = data.content.split('...')[0]
              const toolName = toolInfo.replace('正在执行', '').trim()
              messages.value.push({ 
                type: 'ToolCallRequestEvent', 
                source: 'assistant',
                content: [{ 
                  name: toolName,
                  result: '执行中...'
                }]
              })
              break
            case 'tool_result':
              const lastToolMessage = [...messages.value].reverse().find(msg => 
                msg.type === 'ToolCallRequestEvent' && 
                msg.content[0].result === '执行中...'
              )
              if (lastToolMessage) {
                lastToolMessage.content[0].result = data.content
              }
              break
            case 'message':
              messages.value.push({ 
                type: 'TextMessage', 
                source: 'assistant', 
                content: data.content 
              })
              break
            case 'interrupt':
              messages.value.push({
                type: 'InterruptMessage',
                source: 'assistant',
                content: data.content
              })
              break
            case 'end':
              break
          }
          scrollToBottom()
        }
      }
    }
    isSending.value = false
  } catch (error) {
    console.error('Error:', error)
    messages.value.push({ 
      type: 'TextMessage', 
      source: 'assistant', 
      content: '❌ 响应出错，请稍后重试。' 
    })
    isSending.value = false
  }
}

const handleEnter = (e) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const adjustHeight = () => {
  nextTick(() => {
    if (textarea.value) {
      const el = textarea.value
      el.style.height = 'auto' // 重置高度，让 scrollHeight 生效
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight)
      const maxLines = 5
      const maxHeight = lineHeight * maxLines

      // 限制高度最多5行，超过出现滚动条
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
      el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
    }
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    const el = historyRef.value?.$el || historyRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const formatFileName = (fileName) => {
  const maxLength = 20; // 最大显示长度
  if (fileName.length <= maxLength) return fileName;
  
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName;
  
  const extension = fileName.slice(lastDotIndex); // 获取文件后缀
  const name = fileName.slice(0, lastDotIndex); // 获取文件名（不含后缀）
  const maxNameLength = maxLength - extension.length - 3; // 减去后缀长度和省略号长度
  
  if (name.length <= maxNameLength) return fileName;
  
  const firstPart = name.slice(0, Math.floor(maxNameLength / 2));
  const lastPart = name.slice(-Math.floor(maxNameLength / 2));
  return `${firstPart}...${lastPart}${extension}`;
}

onMounted(() => {
  adjustHeight()
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
  overflow: hidden;
  padding-top: 0;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background-color: #f6f8fa;
  min-height: 0;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 1rem;
  resize: none;
  max-height: 7.5rem; /* 1.5rem 行高 * 5 行 */
  overflow-y: hidden; /* 默认隐藏滚动条 */
  line-height: 1.5;
  font-family: inherit;
  /* 去掉 min-height，交给 rows=1 保证默认一行高度 */
}

.chat-input:focus {
  outline: none; /* 取消默认的黄色轮廓 */
  border-color: #2ea44f; /* 改成绿色边框 */
  box-shadow: 0 0 5px 2px #2ea44f80; /* 绿色阴影，颜色透明度自己调 */
}


.button-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-buttons {
  display: flex;
  gap: 0.75rem;
  color: #666;
}

.left-buttons i {
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.left-buttons i:hover {
  color: #111;
}

button {
  padding: 0.4rem 1.2rem;
  background-color: #2ea44f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

button:disabled {
  background-color: #94d3a2;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #2c974b;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.file-manager {
  padding: 1rem;
  width: 300px; /* 固定宽度 */
  background: white;
  border-radius: 6px;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.file-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.no-files {
  text-align: center;
  color: #666;
  padding: 1rem;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  gap: 0.5rem; /* 添加间距 */
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  color: #333;
}

.remove-file {
  flex-shrink: 0; /* 防止删除按钮被压缩 */
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
  transition: color 0.2s;
}

.remove-file:hover {
  color: #ff4d4f;
}

/* 修改 Popover 组件的样式 */
:deep(.p-popover) {
  position: absolute;
  margin-top: -0.5rem;
}

:deep(.p-popover-content) {
  padding: 0;
}

:deep(.p-popover-arrow) {
  display: none;
}

/* 确保文件列表在固定高度内滚动 */
.file-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>