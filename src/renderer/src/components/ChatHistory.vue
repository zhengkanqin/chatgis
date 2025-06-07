<script setup>
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { ref } from 'vue'

defineProps({
  messages: Array
})

const expandedTools = ref(new Set())

const toggleTool = (toolId) => {
  if (expandedTools.value.has(toolId)) {
    expandedTools.value.delete(toolId)
  } else {
    expandedTools.value.add(toolId)
  }
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang }).value
        return `<pre><code class="hljs ${lang}">${highlighted}</code></pre>`
      } catch (__) {}
    }
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderMarkdown = (content) => md.render(content)

const filterSystemWords = (content) => {
  if (typeof content !== 'string') return content;
  
  // 过滤所有系统词汇
  return content
    .replace(/\[\$help\].*?\[\$help\]/g, '')
    .replace(/\[\$fail\].*?\[\$fail\]/g, '')
    .replace(/\[\$end\].*?\[\$end\]/g, '')
    .replace(/\[\$sender\].*?\[\$sender\]/g, '')
    .trim();
}
</script>

<template>

  <div class="chat-history">
    <div v-for="(msg, index) in messages":key="index" class="chat-item" :class="[msg.source, msg.sender === 'reflection_operation_node' ? 'reflection-message' : '']">

        <div class="sender-label" v-if="index === 0 || messages[index - 1].source !== msg.source">{{ msg.source === 'user' ? '你' : 'GIS 助手' }}</div>

        <div v-if="msg.type === 'TextMessage'" class="text-message">
          <div v-if="msg.source === 'user' && typeof msg.content === 'string'"class="message-bubble user-bubble">{{ filterSystemWords(msg.content) }}</div>
          <div v-else-if="msg.source === 'assistant' && typeof msg.content === 'string'" v-html="renderMarkdown(filterSystemWords(msg.content))" class="assistant-markdown"></div>
          <pre v-else>{{ JSON.stringify(msg.content, null, 2) }}</pre>
        </div>

        <div v-else-if="msg.type === 'ImageMessage'" class="pic-message">
          <div class="message-bubble user-bubble">
            <img :src="msg.content" class="chat-image" alt="图片" />
          </div>
        </div>

        <div v-else-if="msg.type === 'FileMessage'" class="file-message">
          <div class="message-bubble user-bubble file-bubble">
            <i class="pi pi-file"></i>
            <span class="file-name">{{ msg.content }}</span>
          </div>
        </div>

        <div v-else-if="msg.type === 'ToolCallRequestEvent'" class="tool-message tool-call">
          <div v-for="(tool, toolIndex) in msg.content" :key="toolIndex" class="tool-item">
            <div class="tool-header" @click="toggleTool(`${index}-${toolIndex}`)">
              <span class="tool-name">调用工具：<strong>{{ tool.name }}</strong></span>
              <span class="tool-toggle" :class="{ 'expanded': expandedTools.has(`${index}-${toolIndex}`) }">
                <i class="pi pi-chevron-down"></i>
              </span>
            </div>
            <div class="tool-content-wrapper" :class="{ 'expanded': expandedTools.has(`${index}-${toolIndex}`) }">
              <div class="tool-content">
                <div class="tool-result">
                  执行结果：{{ tool.result || '执行中...' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="msg.type === 'ToolCallExecutionEvent'" class="tool-message tool-response">
            <div v-for="(tool, toolIndex) in msg.content" :key="toolIndex">
                工具 <strong>{{ tool.name }}</strong> 执行成功：{{ tool.content }}
            </div>
        </div>

        <div v-else-if="msg.type === 'InterruptMessage'" class="interrupt-message">
            <div class="interrupt-content">{{ msg.content }}</div>
        </div>

        <div v-else class="tool-message unknown">
          ⚠️ 不支持的消息类型：{{ msg.type }}
        </div>

    </div>


  </div>
</template>

<style scoped>
.chat-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  flex-grow: 1;
  /* 美化滚动条 - WebKit 浏览器（Chrome, Edge, Safari） */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #d0d0d0 transparent; /* Firefox */
}
.chat-history::-webkit-scrollbar {
  width: 6px;  /* 更细 */
  border-radius: 9999px;   
}
.chat-history::-webkit-scrollbar-thumb {
  background-color: #d0d0d0;  /* 浅灰色 */
  border-radius: 9999px;         /* 圆角 */
}

.chat-history::-webkit-scrollbar-track {
  background: transparent;    /* 轨道透明 */
}

.chat-item {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  animation: fadeIn 0.3s ease-out;
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

.chat-item.user {
  align-items: flex-end; /* ✅ 从右边开始对齐 */
}

.chat-item.assistant {
  align-items: flex-start;
  text-align: left;
}

.sender-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #888;
}

.text-message {
  width: auto; 
  max-width: 100%;
  padding: 0.5rem 0;
  word-break: break-word;
  font-size: 1rem;
}


.tool-message {
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
  margin-top: 1rem;
  border-color: #dadada;
  border-style: solid;
  border-width: 1px;
}

.tool-call {
  background-color: #ffffff;
  border-left: 4px solid #77b19d;
}

.tool-response {
  background-color: #ffffff;
  border-left: 4px solid #52c41a;
}

.unknown {
  background-color: #fff1f0;
  border-left: 4px solid #ff4d4f;
}
.message-bubble {
  max-width: 100%;
  padding: 0.6rem 0.9rem;
  border-radius: 16px;
  font-size: 1rem;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.user-bubble {
  background-color: #cdf0db;
  color: #000;
}

/* 添加表格样式 */
:deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
  width: 100%;
  font-size: 0.95rem;
}

:deep(th),
:deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

:deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}

:deep(tr:nth-child(even)) {
  background-color: #f9f9f9;
}

:deep(tr:hover) {
  background-color: #f0f0f0;
}

.tool-item {
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  background-color: #f6f8fa;
  border-radius: 6px 6px 0 0;
  transition: background-color 0.2s ease;
}

.tool-name {
  margin-right: 20px; /* 增加与箭头的间距 */
}

.tool-toggle {
  color: #666;
  font-size: 0.9em;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  padding: 4px;
}

.tool-toggle.expanded {
  transform: rotate(180deg);
}

.tool-content-wrapper {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.tool-content-wrapper.expanded {
  max-height: 500px; /* 设置一个足够大的最大高度 */
  transition: max-height 0.5s ease-in;
}

.tool-content {
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e1e4e8;
  border-radius: 0 0 6px 6px;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tool-content-wrapper.expanded .tool-content {
  opacity: 1;
  transform: translateY(0);
}

.tool-result {
  color: #24292e;
  line-height: 1.5;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.interrupt-message {
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.4;
  word-break: break-word;
  margin-top: 1rem;
  background-color: #fff2e8;
  border-left: 4px solid #fa8c16;
}

.interrupt-content {
  color: #d4380d;
  font-weight: 500;
}

.pic-message {
  max-width: 300px;
  margin: 0.5rem 0;
}

.chat-image {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

.file-message {
  margin: 0.5rem 0;
}

.file-bubble {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
}

.file-bubble i {
  font-size: 1.2rem;
  color: #666;
}

.file-name {
  font-size: 0.9rem;
  color: #333;
  word-break: break-all;
}

.reflection-message {
  background-color: #e6f7e6;
  border-radius: 8px;
  padding: 0.5rem;
  margin: 0.5rem 0;
}
</style>