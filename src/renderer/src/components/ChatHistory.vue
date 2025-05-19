<script setup>
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

defineProps({
  messages: Array
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang }).value
        return `<pre><code class="hljs ${lang}">${highlighted}</code></pre>`
      } catch (__) {}
    }
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`
  }  // ✅ 正确应该在这里结束函数，并没有多余括号
})  // ✅ 外层对象结束


const renderMarkdown = (content) => md.render(content)
</script>

<template>
  <div class="chat-history">
    <div
      v-for="(msg, index) in messages"
      :key="index"
      class="chat-item"
      :class="msg.source"
    >
    <div
    class="sender-label"
    v-if="index === 0 || messages[index - 1].source !== msg.source"
  >
    {{ msg.source === 'user' ? '你' : 'GIS 助手' }}
  </div>


  <div v-if="msg.type === 'TextMessage'" class="text-message">
    <div v-if="msg.source === 'user' && typeof msg.content === 'string'"class="message-bubble user-bubble">{{ msg.content }}</div>

    <div
      v-else-if="msg.source === 'assistant' && typeof msg.content === 'string'"
      v-html="renderMarkdown(msg.content)"
      class="assistant-markdown"
    ></div>

    <pre v-else>{{ JSON.stringify(msg.content, null, 2) }}</pre>
  </div>

  <div
    v-else-if="msg.type === 'ToolCallRequestEvent'"
    class="tool-message tool-call"
  >
    调用工具：  <strong>{{ msg.content[0].name }}</strong>
      参数：<code>{{ msg.content[0].arguments }}</code>
  </div>

  <div
    v-else-if="msg.type === 'ToolCallExecutionEvent'"
    class="tool-message tool-response"
  >
    工具 <strong>{{ msg.content[0].name }}</strong> 执行成功：  
    {{ msg.content[0].content }}
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
}

.chat-item {
  display: flex;
  flex-direction: column;
  max-width: 100%;
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

</style>
