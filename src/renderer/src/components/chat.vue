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
      <i class="pi pi-file" title="文件"></i>
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

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import ChatHistory from './ChatHistory.vue'

const input = ref('')
const messages = ref([])
const isSending = ref(false)
const textarea = ref(null)
const historyRef = ref(null)

const sendMessage = async () => {
  const content = input.value.trim()
  if (!content) return

  messages.value.push({ type: 'TextMessage', source: 'user', content })
  input.value = ''
  isSending.value = true
  adjustHeight()

  try {
    const response = await fetch(`http://localhost:8000/chat?q=${encodeURIComponent(content)}`)
    const data = await response.json()
    messages.value.push(...data.response.slice(1))
  } catch (error) {
    messages.value.push({ type: 'TextMessage', source: 'assistant', content: '❌ 响应出错，请稍后重试。' })
  } finally {
    isSending.value = false
    scrollToBottom()
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
</style>
