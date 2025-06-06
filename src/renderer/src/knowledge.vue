<template>
  <div class="container">
    <TabView @tab-change="(e) => activeTabIndex = e.index">
      <TabPanel header="知识列表">
        <div class="memory-list">
          <div class="list-header">
            <div class="search-container">
              <InputText
                v-model="searchQuery"
                placeholder="请输入搜索内容"
                class="search-input"
              />
              <InputNumber
                v-model="searchResultsCount"
                :min="1"
                :max="20"
                showButtons
                buttonLayout="horizontal"
                :step="1"
                decrementButtonClass="p-button-secondary"
                incrementButtonClass="p-button-secondary"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                class="search-count"
              />
              <Button 
                severity="success" 
                icon="pi pi-search" 
                rounded
                @click="searchKnowledge"
                :loading="loading"
              />
            </div>
            <div class="list-actions">
              <span class="total-count">总数：{{ totalPages * pageSize }}</span>
              <Button 
                severity="success" 
                icon="pi pi-refresh" 
                rounded 
                @click="fetchKnowledge(currentPage)"
                :loading="loading"
              />
            </div>
          </div>

          <div v-if="knowledgeList.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-inbox"></i>
            </div>
            <div class="empty-text">
              <h3>暂无数据</h3>
              <p>当前没有知识数据</p>
            </div>
          </div>
          
          <Skeleton v-if="loading" :rows="3" />
          
          <div v-else class="memory-items">
            <Card v-for="(item, index) in knowledgeList" 
                  :key="index" 
                  class="memory-item">
              <template #content>
                <div class="memory-header">
                  <div class="memory-content markdown-body">
                    <div class="content-header" @click="toggleContent(item)">
                      <i :class="['pi', item.isExpanded ? 'pi-chevron-down' : 'pi-chevron-right', 'toggle-icon']"></i>
                      <span class="content-title">{{ getFirstLine(item.content) }}</span>
                    </div>
                    <div class="content-body" :class="{ 'expanded': item.isExpanded }">
                      <div v-html="renderMarkdown(item.content)"></div>
                    </div>
                  </div>
                  <div class="memory-actions">
                    <Button
                      severity="danger"
                      icon="pi pi-trash"
                      rounded
                      @click="deleteKnowledge(item)"
                      class="delete-btn"
                    />
                  </div>
                </div>
                <div class="memory-meta">
                  <div class="meta-title">元数据</div>
                  <div class="meta-content">
                    <div class="meta-item">
                      <span class="meta-key">timestamp：</span>
                      <span class="meta-value">{{ item.metadata.timestamp }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <Paginator
            v-model:first="first"
            :rows="pageSize"
            :totalRecords="totalPages * pageSize"
            :rowsPerPageOptions="[10, 20, 30, 50]"
            @page="onPage"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            class="pagination-footer"
          />
        </div>
      </TabPanel>

      <TabPanel header="添加知识">
        <div class="form-container">
          <form @submit.prevent="submitForm" class="flex flex-column h-full">
            <div class="field">
              <Textarea
                v-model="formData.content"
                placeholder="请输入知识内容"
                class="w-full"
                autoResize
                :rows="10"
              />
            </div>
            
            <div class="field">
              <div class="flex flex-row gap-3 w-full button-container">
                <Button 
                  type="submit" 
                  :loading="loading"
                  severity="success"
                  :disabled="!formData.content"
                >
                  {{ loading ? '提交中...' : '提交' }}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { useToast } from 'primevue/usetoast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import 'github-markdown-css'
import InputNumber from 'primevue/inputnumber'

const toast = useToast()
const formData = reactive({
  content: ''
})

const loading = ref(false)
const message = ref('')
const messageType = ref('')

// 分页相关数据
const first = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const knowledgeList = ref([])

const searchQuery = ref('')
const searchResultsCount = ref(5)

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

// 处理分页
const onPage = async (event) => {
  loading.value = true
  try {
    const response = await axios.get(`http://127.0.0.1:8000/get_knowledge`, {
      params: {
        page: Math.floor(event.first / event.rows) + 1,
        page_size: event.rows
      }
    })
    knowledgeList.value = response.data.data.map(item => ({
      ...item,
      isExpanded: false
    }))
    totalPages.value = response.data.total_pages
    currentPage.value = response.data.current_page
    pageSize.value = event.rows
    first.value = event.first
  } catch (error) {
    message.value = '获取数据失败：' + (error.response?.data?.message || error.message)
    messageType.value = 'error'
    toast.add({ severity: 'error', summary: '错误', detail: message.value, life: 3000 })
  } finally {
    loading.value = false
  }
}

// 获取知识列表
const fetchKnowledge = async (page = 1, size = pageSize.value) => {
  loading.value = true
  try {
    const response = await axios.get(`http://127.0.0.1:8000/get_knowledge`, {
      params: {
        page: page,
        page_size: size
      }
    })
    knowledgeList.value = response.data.data.map(item => ({
      ...item,
      isExpanded: false
    }))
    totalPages.value = response.data.total_pages
    currentPage.value = response.data.current_page
    pageSize.value = size
  } catch (error) {
    message.value = '获取数据失败：' + (error.response?.data?.message || error.message)
    messageType.value = 'error'
    toast.add({ severity: 'error', summary: '错误', detail: message.value, life: 3000 })
  } finally {
    loading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const response = await axios.post('http://127.0.0.1:8000/add_knowledge', {
      content: formData.content
    })
    message.value = '提交成功！'
    messageType.value = 'success'
    toast.add({ severity: 'success', summary: '成功', detail: message.value, life: 3000 })
    // 清空表单
    formData.content = ''
    // 重新获取第一页数据
    fetchKnowledge(1)
  } catch (error) {
    message.value = '提交失败：' + (error.response?.data?.message || error.message)
    messageType.value = 'error'
    toast.add({ severity: 'error', summary: '错误', detail: message.value, life: 3000 })
  } finally {
    loading.value = false
  }
}

// 搜索知识
const searchKnowledge = async () => {
  if (!searchQuery.value.trim()) {
    toast.add({ severity: 'warning', summary: '警告', detail: '请输入搜索内容', life: 3000 })
    return
  }

  loading.value = true
  try {
    const response = await axios.post('http://127.0.0.1:8000/query_knowledge', {
      query: searchQuery.value,
      n_results: searchResultsCount.value
    })
    
    if (response.data.status === 'success') {
      knowledgeList.value = response.data.results.map(item => ({
        ...item,
        isExpanded: false
      }))
      totalPages.value = 1
      currentPage.value = 1
      
      if (knowledgeList.value.length === 0) {
        toast.add({ severity: 'info', summary: '提示', detail: '未找到相关结果', life: 3000 })
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '搜索失败：' + (error.response?.data?.message || error.message), life: 3000 })
  } finally {
    loading.value = false
  }
}

// 删除知识
const deleteKnowledge = async (item) => {
  try {
    await axios.post('http://127.0.0.1:8000/delete_knowledge', {
      timestamp: item.metadata.timestamp
    })
    toast.add({ severity: 'success', summary: '成功', detail: '删除成功', life: 3000 })
    await fetchKnowledge(currentPage.value)
  } catch (error) {
    console.error('删除失败:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '删除失败：' + (error.response?.data?.message || error.message), life: 3000 })
  }
}

// 获取内容的第一行作为标题
const getFirstLine = (content) => {
  if (!content) return ''
  const firstLine = content.split('\n')[0]
  return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine
}

// 切换内容展开/折叠
const toggleContent = (item) => {
  item.isExpanded = !item.isExpanded
}

// 当前激活的标签页
const activeTabIndex = ref(0)

// 组件挂载时获取数据
onMounted(() => {
  fetchKnowledge()
})
</script>

<style scoped>
.container {
  width: 100%;
  height: calc(100vh - 40px);
  margin: 0;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.p-tabview) {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 0;
  overflow: hidden;
}

:deep(.p-tabview-panels) {
  flex: 1;
  padding: 0;
  border: none;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.p-tabview-panel) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  height: 100%;
  overflow: hidden;
}

.field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.field:first-child {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 250px);
}

.field:last-child {
  margin-bottom: 0;
  flex-shrink: 0;
}

.memory-list {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-shrink: 0;
  gap: 20px;
  flex-wrap: wrap;
}

.search-container {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  max-width: 800px;
  flex-wrap: wrap;
}

.search-container .p-button[icon="pi pi-search"],
.list-actions .p-button[icon="pi pi-refresh"] {
  width: 2.5rem !important;
  height: 2.5rem !important;
  min-width: 2.5rem !important;
  min-height: 2.5rem !important;
  max-width: 2.5rem !important;
  max-height: 2.5rem !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 50% !important;
  aspect-ratio: 1 !important;
}

.search-container .p-button[icon="pi pi-search"] .p-button-icon,
.list-actions .p-button[icon="pi pi-refresh"] .p-button-icon {
  font-size: 1rem !important;
  margin: 0 !important;
  width: 1rem !important;
  height: 1rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.search-container .p-button[icon="pi pi-search"]:hover,
.list-actions .p-button[icon="pi pi-refresh"]:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.search-count {
  width: 150px;
  flex-shrink: 0;
}

:deep(.p-inputnumber) {
  width: 150px;
}

:deep(.p-inputnumber-input) {
  text-align: center;
  width: 60px;
}

:deep(.p-inputnumber-button) {
  width: 2rem;
  min-width: 2rem;
}

:deep(.p-inputnumber-button-group) {
  display: flex;
  align-items: center;
}

.list-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.memory-items {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin-right: -10px;
  margin-bottom: 20px;
  scrollbar-width: thin;
  scrollbar-color: #909399 #f4f4f5;
}

.memory-item {
  margin-bottom: 15px;
  border: 1px solid #e1f3d8;
  transition: all 0.3s;
}

.memory-item:hover {
  border-color: #67c23a;
  box-shadow: 0 2px 12px 0 rgba(103, 194, 58, 0.1);
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.memory-content {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
  white-space: pre-wrap;
  min-width: 0;
}

.memory-meta {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}

.meta-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #67c23a;
  font-size: 15px;
  display: flex;
  align-items: center;
}

.meta-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #67c23a;
  margin-right: 8px;
  border-radius: 2px;
}

.meta-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: baseline;
  line-height: 1.5;
}

.meta-key {
  color: #606266;
  font-weight: 500;
  min-width: 80px;
  padding-right: 8px;
  flex-shrink: 0;
}

.meta-value {
  color: #333;
  flex: 1;
  word-break: break-all;
}

.content-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.content-header:hover {
  background-color: #e9ecef;
}

.toggle-icon {
  margin-right: 8px;
  color: #67c23a;
  transition: transform 0.2s;
}

.content-title {
  font-weight: 500;
  color: #606266;
}

.content-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  position: relative;
}

.content-body.expanded {
  max-height: 2000px;
  transition: max-height 0.5s ease-in;
}

.delete-btn {
  background-color: #ffcdd2 !important;
  border-color: #ffcdd2 !important;
  color: #d32f2f !important;
}

:deep(.p-button.delete-btn) {
  background-color: #ffcdd2 !important;
  border-color: #ffcdd2 !important;
  color: #d32f2f !important;
}

:deep(.p-button.delete-btn:hover) {
  background-color: #ef9a9a !important;
  border-color: #ef9a9a !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 1rem;
  border: 2px dashed #e1f3d8;
  animation: fadeIn 0.3s ease-in-out;
}

.empty-icon {
  font-size: 4rem;
  color: #67c23a;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.empty-text {
  text-align: center;
}

.empty-text h3 {
  color: #606266;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.empty-text p {
  color: #909399;
  font-size: 1rem;
  margin: 0;
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.total-count {
  color: #606266;
  font-size: 14px;
  margin-right: 10px;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}

.pagination-footer {
  flex-shrink: 0;
  padding: 10px 0;
  background: #fff;
  border-top: 1px solid #e1f3d8;
  margin: 0 -20px;
  padding: 10px 20px;
}
</style>