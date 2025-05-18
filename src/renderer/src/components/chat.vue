<template>
  <div class="chat-container">
    <div class="chat-history">
      <div v-for="(msg, index) in messages" :key="index" :class="msg.role">
        <div class="message-header">
          <strong>{{ msg.role === 'user' ? '你' : 'GIS助手' }}:</strong>
        </div>
        <div class="message-content" v-html="renderMarkdown(msg.content)"></div>
      </div>
    </div>
    <form @submit.prevent="sendMessage">
      <input v-model="input" type="text" placeholder="请输入消息..." :disabled="isSending" />
      <button type="submit" :disabled="!input.trim() || isSending">
        <template v-if="isSending">
          <span class="spinner"></span>思考中...
        </template>
        <template v-else>
          发送
        </template>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return ''
  }
})

const renderMarkdown = (content) => md.render(content)

const input = ref('')
const messages = ref([])
const isSending = ref(false)

const sendMessage = async () => {
  if (!input.value.trim()) return

  const userMessage = { role: 'user', content: input.value }
  messages.value.push(userMessage)
  const currentInput = input.value
  input.value = ''
  isSending.value = true

  try {
    const response = await fetch(`http://localhost:8000/chat?q=${encodeURIComponent(currentInput)}`)
    const data = await response.json()
    const assistantMessage = { role: 'assistant', content: data.response }
    messages.value.push(assistantMessage)
  } catch (error) {
    console.error('Error fetching response:', error)
    messages.value.push({ role: 'assistant', content: '❌ 响应出错，请稍后重试。' })
  } finally {
    isSending.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const chatHistory = document.querySelector('.chat-history')
    if (chatHistory) {
      chatHistory.scrollTop = chatHistory.scrollHeight
    }
  })
}
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

.chat-history::-webkit-scrollbar {
  width: 12px;
}

.chat-history::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.5);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: background-color 0.3s ease;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background-color: rgba(120, 120, 120, 0.7);
}


.chat-history > div {
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-header {
  margin-bottom: 0.5rem;
}

.message-content {
  padding: 0rem 0.9rem;
  border-radius: 4px;
}

.message-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
}

.message-content :deep(code) {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.9em;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 1rem;
  margin-left: 0;
  color: #6a737d;
}

.user {
  text-align: right;
  margin-bottom: 1.5rem;
}

.user .message-content {
  background-color: #d1eaff; /* 新颜色 */
  color: #003366;
  display: inline-block;
  max-width: 80%;
}

.assistant {
  text-align: left;
  margin-bottom: 1.5rem;
}

.assistant .message-content {
  color: #333;
  display: inline-block;
  max-width: 100%;
}

form {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  flex-shrink: 0;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 0;
}

button {
  padding: 0 1.5rem;
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
