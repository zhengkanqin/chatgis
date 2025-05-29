<template>
    <div class="container">
      <TabView @tab-change="(e) => activeTabIndex = e.index">
        <TabPanel header="添加地理数据">
          <div class="form-container">
            <form @submit.prevent="submitForm" class="flex flex-column h-full">
              <div class="field">
                <Textarea
                  v-model="formData.content"
                  placeholder="请输入内容"
                  class="w-full"
                  autoResize
                  :disabled="!formData.filepath"
                  :rows="10"
                />
              </div>
              
              <div class="field">
                <div class="flex flex-row gap-3 w-full button-container">
                  <InputText
                    v-model="formData.filepath"
                    placeholder="请选择文件"
                    readonly
                    class="w-5"
                  />
                  <Button @click="selectFile" label="选择文件" class="w-2 light-button" />
                  <Button 
                    @click="getFileContentForForm"
                    icon="pi pi-book"
                    class="w-2 light-button"
                    :disabled="!formData.filepath"
                    :loading="loading"
                  />
                  <Button 
                    type="submit" 
                    :loading="loading"
                    severity="success"
                    :disabled="!formData.content || !formData.filepath"
                  >
                    {{ loading ? '提交中...' : '提交' }}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </TabPanel>
  
        <TabPanel header="地理数据列表">
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
                  @click="searchMemories"
                  :loading="loading"
                />
              </div>
              <div class="list-actions">
                <span class="total-count">总数：{{ totalPages * pageSize }}</span>
                <Button 
                  severity="danger" 
                  @click="showClearDialog"
                  :loading="clearLoading"
                  label="清空数据"
                />
                <Button 
                  severity="success" 
                  icon="pi pi-refresh" 
                  rounded 
                  @click="fetchMemories(currentPage)"
                  :loading="loading"
                />
              </div>
            </div>
  
            <div v-if="memories.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-inbox"></i>
              </div>
              <div class="empty-text">
                <h3>暂无数据</h3>
                <p>当前没有地理数据</p>
              </div>
            </div>
            
            <Skeleton v-if="loading" :rows="3" />
            
            <div v-else class="memory-items">
              <Card v-for="(item, index) in memories" 
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
                        icon="pi pi-pencil"
                        rounded
                        class="edit-btn"
                        @click="openMemoryDialog(item)"
                      />
                      <Button
                        severity="danger"
                        icon="pi pi-trash"
                        rounded
                        @click="deleteMemory(item)"
                        class="delete-btn"
                      />
                    </div>
                  </div>
                  <div class="memory-filepath">文件路径：{{ item.filepath }}</div>
                  <div class="memory-meta">
                    <div class="meta-title">元数据</div>
                    <div class="meta-content">
                      <div class="meta-item">
                        <span class="meta-key">filepath：</span>
                        <span class="meta-value">{{ item.metadata.filepath }}</span>
                      </div>
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
  
        <TabPanel header="批处理数据">
          <div class="batch-container">
            <div class="folder-select">
              <div class="p-inputgroup">
                <InputText
                  v-model="selectedFolder"
                  placeholder="请选择文件夹"
                  readonly
                  class="w-full"
                />
                <Button @click="selectFolder" label="选择文件夹" />
              </div>
            </div>
  
            <div v-if="batchFiles.length > 0" class="batch-content">
              <div class="batch-header">
                <h3>文件列表 ({{ batchFiles.length }})</h3>
                <div class="batch-actions">
                  <Button 
                    severity="success" 
                    icon="pi pi-download" 
                    @click="batchGetContent" 
                    :loading="batchLoading"
                    label="批量获取内容"
                  />
                  <Button 
                    severity="success" 
                    @click="submitBatch" 
                    :loading="batchLoading"
                    label="批量提交"
                  />
                </div>
              </div>
  
              <DataTable 
                :value="batchFiles" 
                class="p-datatable-sm" 
                stripedRows
                scrollable
                scrollHeight="flex"
                :scrollable="true"
                :resizableColumns="true"
                columnResizeMode="expand"
              >
                <Column field="filename" header="文件名" style="width: 150px" />
                <Column header="内容" style="width: 100%">
                  <template #body="slotProps">
                    <div class="content-cell">
                      <Textarea
                        v-model="slotProps.data.content"
                        :rows="5"
                        :autoResize="true"
                        placeholder="请输入内容"
                        class="w-full content-textarea"
                      />
                      <div class="content-actions">
                        <Button
                          severity="success"
                          icon="pi pi-book"
                          rounded
                          :loading="slotProps.data.loading"
                          @click="getFileContent(slotProps.data)"
                          class="get-content-btn"
                        />
                        <Button
                          severity="success"
                          icon="pi pi-check"
                          rounded
                          :loading="slotProps.data.loading"
                          @click="submitSingleFile(slotProps.data, slotProps.index)"
                          class="submit-btn"
                        />
                      </div>
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
  
            <div v-else-if="selectedFolder" class="text-center p-4">
              <i class="pi pi-folder text-4xl text-500"></i>
              <p class="text-500 mt-2">未找到符合条件的文件</p>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="异常数据处理">
          <div class="memory-list">
            <div class="list-header">
              <div class="list-actions" style="margin-left: auto;">
                <Button 
                  severity="success" 
                  icon="pi pi-refresh" 
                  rounded 
                  @click="fetchModifiedData"
                  :loading="loading"
                />
              </div>
            </div>

            <div v-if="modifiedData.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-inbox"></i>
              </div>
              <div class="empty-text">
                <h3>暂无数据</h3>
                <p>当前没有异常数据需要处理</p>
              </div>
            </div>
            
            <Skeleton v-if="loading" :rows="3" />
            
            <div v-else class="memory-items">
              <Card v-for="(item, index) in modifiedData" 
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
                        icon="pi pi-pencil"
                        rounded
                        class="edit-btn"
                        @click="openMemoryDialog(item)"
                      />
                      <Button
                        severity="danger"
                        icon="pi pi-trash"
                        rounded
                        @click="deleteMemory(item)"
                        class="delete-btn"
                      />
                    </div>
                  </div>
                  <div class="memory-filepath">文件路径：{{ item.filepath }}</div>
                  <div class="memory-meta">
                    <div class="meta-title">元数据</div>
                    <div class="meta-content">
                      <div class="meta-item">
                        <span class="meta-key">filepath：</span>
                        <span class="meta-value">{{ item.metadata.filepath }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-key">timestamp：</span>
                        <span class="meta-value">{{ item.metadata.timestamp }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>
      </TabView>
  
      <!-- 清空确认对话框 -->
      <Dialog
        v-model:visible="clearDialogVisible"
        modal
        :style="{ width: '30%' }"
        :closable="false"
        class="clear-dialog"
        @show="startCountdown"
        :dismissableMask="true"
        @hide="clearDialogVisible = false"
      >
        <template #header>
          <div class="dialog-header">
            <i class="pi pi-exclamation-triangle" style="color: #f56c6c; font-size: 1.2rem;"></i>
            <span>确认清空</span>
          </div>
        </template>
        <p>确定要清空所有地理数据吗？此操作不可恢复！</p>
        <template #footer>
          <div class="dialog-footer">
            <Button @click="clearDialogVisible = false" label="取消" />
            <Button 
              severity="danger" 
              @click="clearAllData" 
              :loading="clearLoading" 
              :disabled="countdown > 0"
              :label="countdown > 0 ? `确认清空 (${countdown}s)` : '确认清空'"
            />
          </div>
        </template>
      </Dialog>

      <!-- 地理数据详情弹窗 -->
      <Dialog
        v-model:visible="memoryDialogVisible"
        :style="{ width: '80vw' }"
        :modal="true"
        :closable="true"
        :draggable="false"
        :resizable="false"
        :maximizable="false"
        class="memory-dialog"
      >
        <template #header>
          <div class="dialog-header">
            <h3>地理数据详情</h3>
            <div class="dialog-actions">
              <Button
                icon="pi pi-save"
                rounded
                class="p-button-icon-only p-button-text"
                @click="saveMemory"
                :loading="saveLoading"
              />
            </div>
          </div>
        </template>
        <div class="dialog-content">
          <div class="content-section">
            <label class="section-label">内容</label>
            <Textarea
              v-model="editingMemory.content"
              :rows="15"
              class="w-full"
              autoResize
            />
          </div>
          <div class="content-section">
            <label class="section-label">文件路径</label>
            <div class="filepath-text">{{ editingMemory.metadata.filepath }}</div>
          </div>
        </div>
      </Dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, onUnmounted, h } from 'vue'
  import axios from 'axios'
  import { useToast } from 'primevue/usetoast'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import Button from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'
  import Message from 'primevue/message'
  import Card from 'primevue/card'
  import DataTable from 'primevue/datatable'
  import Column from 'primevue/column'
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
    content: '',
    filepath: '',
    metadata: {}
  })
  const fileList = ref(["shp","tif","png","jpg","gdb","doc","docx","pdf"])
  const loading = ref(false)
  const message = ref('')
  const messageType = ref('')
  
  // 分页相关数据
  const first = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(1)
  const memories = ref([])
  
  const selectedFolder = ref('')
  const batchFiles = ref([])
  const batchLoading = ref(false)
  
  const clearDialogVisible = ref(false)
  const clearLoading = ref(false)
  
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
      const response = await axios.get(`http://127.0.0.1:8000/get_memory`, {
        params: {
          page: Math.floor(event.first / event.rows) + 1,
          page_size: event.rows
        }
      })
      memories.value = response.data.data.map(item => ({
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
  
  // 获取数据
  const fetchMemories = async (page = 1, size = pageSize.value) => {
    loading.value = true
    try {
      const response = await axios.get(`http://127.0.0.1:8000/get_memory`, {
        params: {
          page: page,
          page_size: size
        }
      })
      memories.value = response.data.data.map(item => ({
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
  
  const submitForm = async () => {
    loading.value = true
    message.value = ''
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/add_memory', formData)
      message.value = '提交成功！'
      messageType.value = 'success'
      toast.add({ severity: 'success', summary: '成功', detail: message.value, life: 3000 })
      // 清空表单
      formData.content = ''
      formData.filepath = ''
      // 重新获取第一页数据
      fetchMemories(1)
    } catch (error) {
      message.value = '提交失败：' + (error.response?.data?.message || error.message)
      messageType.value = 'error'
      toast.add({ severity: 'error', summary: '错误', detail: message.value, life: 3000 })
    } finally {
      loading.value = false
    }
  }
  
  // 获取单个文件内容
  const getFileContent = async (file) => {
    try {
      file.loading = true
      const response = await axios.get('http://127.0.0.1:8000/readGeoFile', {
        params: {
          q: file.filepath
        }
      })
      if (response.data) {
        file.content = response.data
        toast.add({ severity: 'success', summary: '成功', detail: '获取文件内容成功', life: 3000 })
      }
    } catch (error) {
      console.error('获取文件内容失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '获取文件内容失败', life: 3000 })
    } finally {
      file.loading = false
    }
  }
  
  // 选择文件夹
  const selectFolder = async () => {
    try {
      const result = await window.api.selectFolder()
      
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0]
        selectedFolder.value = folderPath
        
        // 扫描文件夹中的文件
        const files = []
        const scanDirectory = async (dir) => {
          try {
            const { success, data: items } = await window.api.readDirectory(dir)
            if (!success) return
  
            for (const item of items) {
              const fullPath = `${dir}/${item}`
              const { success: statsSuccess, data: stat } = await window.api.getFileStats(fullPath)
              if (!statsSuccess) continue
              
              if (stat.isDirectory) {
                // 递归扫描子文件夹
                await scanDirectory(fullPath)
              } else if (stat.isFile) {
                const ext = item.split('.').pop().toLowerCase()
                if (fileList.value.includes(ext)) {
                  // 使用相对路径
                  const relativePath = fullPath.replace(folderPath + '/', '')
                  files.push({
                    filename: item,
                    extension: ext,
                    content: '',
                    metadata: {},
                    filepath: fullPath,
                    relativePath: relativePath,
                    loading: false
                  })
                }
              }
            }
          } catch (error) {
            console.error(`扫描目录 ${dir} 失败:`, error)
          }
        }
  
        await scanDirectory(folderPath)
        batchFiles.value = files
  
        if (files.length === 0) {
          toast.add({ severity: 'warning', summary: '警告', detail: '未找到符合条件的文件', life: 3000 })
        } else {
          toast.add({ severity: 'success', summary: '成功', detail: `找到 ${files.length} 个符合条件的文件`, life: 3000 })
        }
      }
    } catch (error) {
      console.error('选择文件夹失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '选择文件夹失败', life: 3000 })
    }
  }
  
  // 批量提交
  const submitBatch = async () => {
    if (batchFiles.value.length === 0) {
      toast.add({ severity: 'warning', summary: '警告', detail: '没有可提交的文件', life: 3000 })
      return
    }
  
    batchLoading.value = true
    let successCount = 0
    let failCount = 0
    const failedFiles = []
  
    // 从后向前遍历，这样删除元素时不会影响索引
    for (let i = batchFiles.value.length - 1; i >= 0; i--) {
      const file = batchFiles.value[i]
      try {
        file.loading = true
        await axios.post('http://127.0.0.1:8000/add_memory', {
          content: file.content,
          filepath: file.filepath,
          metadata: file.metadata
        })
        // 提交成功后删除该文件
        batchFiles.value.splice(i, 1)
        successCount++
      } catch (error) {
        console.error(`提交文件 ${file.filename} 失败:`, error)
        failedFiles.push(file.filename)
        failCount++
      } finally {
        file.loading = false
      }
    }
  
    batchLoading.value = false
    
    // 显示处理结果
    if (successCount > 0) {
      toast.add({ severity: 'success', summary: '成功', detail: `成功提交 ${successCount} 个文件`, life: 3000 })
    }
    if (failCount > 0) {
      toast.add({ severity: 'warning', summary: '警告', detail: `${failCount} 个文件提交失败：${failedFiles.join(', ')}`, life: 3000 })
    }
  
    // 如果所有文件都已处理完，清空文件夹选择
    if (batchFiles.value.length === 0) {
      selectedFolder.value = ''
    }
  }
  
  // 选择文件
  const selectFile = async () => {
    try {
      const result = await window.api.selectFile()
      if (!result.canceled && result.filePaths.length > 0) {
        formData.filepath = result.filePaths[0]
        formData.content = '' // 清空内容
      }
    } catch (error) {
      console.error('选择文件失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '选择文件失败', life: 3000 })
    }
  }
  
  // 获取文件内容（用于表单）
  const getFileContentForForm = async () => {
    if (!formData.filepath) {
      toast.add({ severity: 'warning', summary: '警告', detail: '请先选择文件', life: 3000 })
      return
    }

    loading.value = true
    try {
      const response = await axios.get('http://127.0.0.1:8000/readGeoFile', {
        params: {
          q: formData.filepath
        }
      })
      if (response.data) {
        formData.content = response.data
        toast.add({ severity: 'success', summary: '成功', detail: '获取文件内容成功', life: 3000 })
      }
    } catch (error) {
      console.error('获取文件内容失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '获取文件内容失败', life: 3000 })
    } finally {
      loading.value = false
    }
  }
  
  // 批量获取内容
  const batchGetContent = async () => {
    if (batchFiles.value.length === 0) {
      toast.add({ severity: 'warning', summary: '警告', detail: '没有可处理的文件', life: 3000 })
      return
    }
  
    batchLoading.value = true
    let successCount = 0
    let failCount = 0
  
    for (const file of batchFiles.value) {
      try {
        file.loading = true
        const response = await axios.get('http://127.0.0.1:8000/readGeoFile', {
          params: {
            q: file.filepath
          }
        })
        if (response.data) {
          file.content = response.data
          successCount++
        }
      } catch (error) {
        console.error(`获取文件 ${file.filename} 内容失败:`, error)
        failCount++
      } finally {
        file.loading = false
      }
    }
  
    batchLoading.value = false
    if (successCount > 0) {
      toast.add({ severity: 'success', summary: '成功', detail: `成功获取 ${successCount} 个文件的内容`, life: 3000 })
    }
    if (failCount > 0) {
      toast.add({ severity: 'warning', summary: '警告', detail: `${failCount} 个文件获取内容失败`, life: 3000 })
    }
  }
  
  // 单独提交文件
  const submitSingleFile = async (file, index) => {
    try {
      file.loading = true
      await axios.post('http://127.0.0.1:8000/add_memory', {
        content: file.content,
        filepath: file.filepath,
        metadata: file.metadata
      })
      
      toast.add({ severity: 'success', summary: '成功', detail: '提交成功', life: 3000 })
      // 从列表中删除已提交的文件
      batchFiles.value.splice(index, 1)
      
      // 如果列表为空，清空文件夹选择
      if (batchFiles.value.length === 0) {
        selectedFolder.value = ''
      }
    } catch (error) {
      console.error('提交失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '提交失败：' + (error.response?.data?.message || error.message), life: 3000 })
    } finally {
      file.loading = false
    }
  }
  
  // 显示清空确认对话框
  const showClearDialog = () => {
    clearDialogVisible.value = true
  }
  
  // 清空所有数据
  const clearAllData = async () => {
    clearLoading.value = true
    try {
      await axios.get('http://127.0.0.1:8000/clear_memory')
      toast.add({ severity: 'success', summary: '成功', detail: '数据清空成功', life: 3000 })
      clearDialogVisible.value = false
      // 重新获取第一页数据
      await fetchMemories(1)
    } catch (error) {
      console.error('清空数据失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '清空数据失败：' + (error.response?.data?.message || error.message), life: 3000 })
    } finally {
      clearLoading.value = false
    }
  }
  
  // 当前激活的标签页
  const activeTabIndex = ref(0)

  // 删除单个地理数据
  const deleteMemory = async (item) => {
    try {
      await axios.post('http://127.0.0.1:8000/delete_memory', {
        metadata_filter: {
          filepath: item.filepath,
          timestamp: item.metadata.timestamp
        }
      })
      toast.add({ severity: 'success', summary: '成功', detail: '删除成功', life: 3000 })
      // 根据当前标签页调用不同的刷新方法
      if (activeTabIndex.value === 2) { // 异常数据处理标签页
        await fetchModifiedData()
      } else {
        await fetchMemories(currentPage.value)
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '删除失败：' + (error.response?.data?.message || error.message), life: 3000 })
    }
  }
  
  const searchMemories = async () => {
    if (!searchQuery.value.trim()) {
      toast.add({ severity: 'warning', summary: '警告', detail: '请输入搜索内容', life: 3000 })
      return
    }
  
    loading.value = true
    try {
      const response = await axios.post('http://127.0.0.1:8000/query_memory', {
        query: searchQuery.value,
        n_results: searchResultsCount.value
      })
      
      if (response.data.status === 'success') {
        memories.value = response.data.results.map(item => ({
          ...item,
          isExpanded: false
        }))
        totalPages.value = 1
        currentPage.value = 1
        
        if (memories.value.length === 0) {
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
  
  // 弹窗相关数据
  const memoryDialogVisible = ref(false)
  const editingMemory = ref({
    content: '',
    filepath: '',
    metadata: {}
  })
  const saveLoading = ref(false)

  // 打开地理数据详情弹窗
  const openMemoryDialog = (item) => {
    editingMemory.value = JSON.parse(JSON.stringify(item)) // 深拷贝
    memoryDialogVisible.value = true
  }

  // 保存地理数据
  const saveMemory = async () => {
    saveLoading.value = true
    try {
      // 先删除旧的地理数据
      await axios.post('http://127.0.0.1:8000/delete_memory', {
        metadata_filter: {
          filepath: editingMemory.value.filepath,
          timestamp: editingMemory.value.metadata.timestamp
        }
      })

      // 添加新的地理数据，传递空的元数据，但使用元数据中的 filepath
      await axios.post('http://127.0.0.1:8000/add_memory', {
        content: editingMemory.value.content,
        filepath: editingMemory.value.metadata.filepath,
        metadata: {}
      })

      toast.add({ severity: 'success', summary: '成功', detail: '保存成功', life: 3000 })
      memoryDialogVisible.value = false
      // 重新获取当前页数据
      await fetchMemories(currentPage.value)
    } catch (error) {
      console.error('保存失败:', error)
      toast.add({ severity: 'error', summary: '错误', detail: '保存失败：' + (error.response?.data?.message || error.message), life: 3000 })
    } finally {
      saveLoading.value = false
    }
  }
  
  // 异常数据相关
  const modifiedData = ref([])

  // 获取异常数据
  const fetchModifiedData = async () => {
    loading.value = true
    try {
      const response = await axios.get('http://127.0.0.1:8000/list_modified_data')
      if (response.data.status === 'success') {
        modifiedData.value = response.data.modified_data.map(item => ({
          ...item,
          isExpanded: false
        }))
      }
    } catch (error) {
      message.value = '获取数据失败：' + (error.response?.data?.message || error.message)
      messageType.value = 'error'
      toast.add({ severity: 'error', summary: '错误', detail: message.value, life: 3000 })
    } finally {
      loading.value = false
    }
  }
  
  const countdown = ref(0)
  let countdownTimer = null

  // 开始倒计时
  const startCountdown = () => {
    countdown.value = 10
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
      }
    }, 1000)
  }

  // 组件卸载时清除定时器
  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
  })
  
  // 组件挂载时获取数据
  onMounted(() => {
    fetchMemories()
  })
  </script>
  
  <style scoped>
  .container {
    width: 100%;
    height: calc(100vh - 40px); /* 减去 tibar 的高度 */
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
  
  .field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #606266;
  }
  
  :deep(.p-inputtextarea) {
    width: 100%;
    min-height: 80px;
    max-height: 500px;
    resize: vertical;
  }
  
  .flex.justify-content-end {
    margin-top: auto; /* 将按钮推到底部 */
    padding-top: 1rem;
    flex-shrink: 0; /* 防止按钮被压缩 */
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
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;
    gap: 20px;
  }
  
  .search-container {
    display: flex;
    gap: 10px;
    align-items: center;
    flex: 1;
    max-width: 800px;
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
  }
  
  .search-count {
    width: 120px;
    flex-shrink: 0;
  }
  
  :deep(.p-inputnumber) {
    width: 120px;
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
  
  .memory-items::-webkit-scrollbar {
    width: 9px;
    display: block;
  }
  
  .memory-items::-webkit-scrollbar-track {
    background: #f4f4f5;
    border-radius: 6px;
  }
  
  .memory-items::-webkit-scrollbar-thumb {
    background-color: #909399;
    border-radius: 6px;
    border: 2px solid #f4f4f5;
  }
  
  .memory-items::-webkit-scrollbar-thumb:hover {
    background-color: #a6a9ad;
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
    font-size: 16px;
    line-height: 1.5;
    word-break: break-all;
    white-space: pre-wrap;
    min-width: 0;
  }
  
  .memory-filepath {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
    word-break: break-all;
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
  
  .batch-container {
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .folder-select {
    margin-bottom: 20px;
    flex-shrink: 0;
    width: 100%;
    padding: 0 20px;
  }
  
  :deep(.p-inputgroup) {
    width: 100%;
    display: flex;
    gap: 10px;
  }
  
  :deep(.p-inputgroup .p-inputtext) {
    flex: 1;
    min-width: 0;
  }
  
  :deep(.p-inputgroup .p-button) {
    flex-shrink: 0;
    min-width: 120px;
  }
  
  .batch-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
  
  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;
    padding: 0 20px;
  }
  
  .batch-header h3 {
    margin: 0;
    color: #606266;
  }
  
  .batch-actions {
    display: flex;
    gap: 10px;
  }
  
  :deep(.p-datatable-wrapper) {
    flex: 1;
    overflow: auto !important;
    border: 1px solid #e1f3d8;
    border-radius: 4px;
    min-height: 0;
    width: 100%;
    margin: 0 20px;
  }
  
  :deep(.p-datatable) {
    height: 100%;
  }
  
  :deep(.p-datatable-scrollable-body) {
    overflow-y: auto !important;
    max-height: calc(100vh - 300px) !important;
  }
  
  :deep(.p-datatable-scrollable-header) {
    background: #f8f9fa;
    border-bottom: 1px solid #e1f3d8;
  }
  
  :deep(.p-datatable-scrollable-header-box) {
    padding-right: 17px;
  }
  
  :deep(.p-datatable-wrapper::-webkit-scrollbar) {
    width: 9px;
    height: 9px;
    display: block !important;
  }
  
  :deep(.p-datatable-wrapper::-webkit-scrollbar-track) {
    background: #f4f4f5;
    border-radius: 6px;
  }
  
  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb) {
    background-color: #909399;
    border-radius: 6px;
    border: 2px solid #f4f4f5;
  }
  
  :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover) {
    background-color: #a6a9ad;
  }
  
  .content-cell {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-width: 0;
  }
  
  .content-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 8px;
  }
  
  :deep(.content-textarea) {
    flex: 1;
    min-width: 0;
    width: 100% !important;
  }
  
  :deep(.p-inputtextarea) {
    width: 100%;
    min-height: 80px;
    max-height: 500px;
    resize: vertical;
  }
  
  :deep(.p-inputtextarea textarea) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 12px;
    border: 1px solid #e1f3d8;
    vertical-align: top;
    height: 100%;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr > td:last-child) {
    width: 100%;
    min-width: 0;
  }
  
  .get-content-btn,
  .submit-btn {
    flex-shrink: 0;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  :deep(.p-datatable .p-datatable-thead > tr > th) {
    background: #f8f9fa;
    color: #606266;
    font-weight: 600;
    padding: 12px;
    border: 1px solid #e1f3d8;
    white-space: nowrap;
  }
  
  :deep(.p-datatable .p-datatable-tbody > tr:hover) {
    background: #f0f9eb;
  }
  
  .pagination-footer {
    flex-shrink: 0;
    padding: 10px 0;
    background: #fff;
    border-top: 1px solid #e1f3d8;
    margin: 0 -20px;
    padding: 10px 20px;
  }
  
  :deep(.p-paginator) {
    background: transparent;
    border: none;
  }
  
  .memory-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    align-items: center;
  }
  
  .edit-btn,
  .delete-btn {
    flex-shrink: 0;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  :deep(.p-button.edit-btn),
  :deep(.p-button.delete-btn) {
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  .edit-btn {
    background-color: #e1f3d8 !important;
    border-color: #e1f3d8 !important;
    color: #67c23a !important;
  }
  
  :deep(.p-button.edit-btn) {
    background-color: #e1f3d8 !important;
    border-color: #e1f3d8 !important;
    color: #67c23a !important;
  }
  
  :deep(.p-button.edit-btn:hover) {
    background-color: #c2e7b0 !important;
    border-color: #c2e7b0 !important;
  }
  
  :deep(.p-button.edit-btn .p-button-icon),
  :deep(.p-button.delete-btn .p-button-icon) {
    font-size: 1rem;
    margin: 0 !important;
    width: 1rem !important;
    height: 1rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  :deep(.p-button.edit-btn .p-button-icon) {
    color: #67c23a !important;
  }
  
  :deep(.p-button.delete-btn .p-button-icon) {
    color: #d32f2f !important;
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
  
  .content-body:not(.expanded)::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, #fff);
    pointer-events: none;
  }
  
  .memory-content {
    flex: 1;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-all;
    white-space: pre-wrap;
    min-width: 0;
  }
  
  .button-container {
    display: flex;
    gap: 10px;
    width: 100%;
  }
  
  :deep(.p-inputtext) {
    flex: 1;
    min-width: 0;
  }
  
  :deep(.p-button) {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  :deep(.p-button.p-button-icon-only) {
    width: 2.5rem !important;
    height: 2.5rem !important;
    min-width: 2.5rem !important;
    min-height: 2.5rem !important;
    max-width: 2.5rem !important;
    max-height: 2.5rem !important;
    padding: 0 !important;
    border-radius: 50% !important;
  }
  
  :deep(.p-button.p-button-icon-only .p-button-icon) {
    font-size: 1rem !important;
    margin: 0 !important;
    width: 1rem !important;
    height: 1rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  :deep(.p-button.p-button-icon-only:hover) {
    transform: scale(1.05);
    transition: transform 0.2s;
  }

  .memory-dialog {
    :deep(.p-dialog-header) {
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e1f3d8;
    }

    :deep(.p-dialog-content) {
      padding: 1rem;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
  }

  .dialog-header h3 {
    margin: 0;
    color: #606266;
  }

  .dialog-actions {
    display: flex;
    gap: 0.5rem;
  }

  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .content-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-label {
    font-weight: 500;
    color: #606266;
  }

  :deep(.p-dialog .p-dialog-content) {
    padding: 1rem;
    background: #fff;
  }

  :deep(.p-dialog .p-dialog-header) {
    padding: 1rem;
    background: #f8f9fa;
    border-bottom: 1px solid #e1f3d8;
  }

  :deep(.p-dialog .p-dialog-header-icons) {
    margin-right: 0.5rem;
  }

  :deep(.p-dialog .p-dialog-header-icon) {
    width: 2rem;
    height: 2rem;
    color: #606266;
    border: 0 none;
    background: transparent;
    border-radius: 50%;
    transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  }

  :deep(.p-dialog .p-dialog-header-icon:hover) {
    color: #67c23a;
    border-color: transparent;
    background: #f0f9eb;
  }

  :deep(.p-dialog .p-dialog-header-icon:focus) {
    outline: 0 none;
    outline-offset: 0;
    box-shadow: 0 0 0 0.2rem rgba(103, 194, 58, 0.2);
  }

  .filepath-text {
    padding: 0.5rem;
    background-color: #f8f9fa;
    border: 1px solid #e1f3d8;
    border-radius: 4px;
    color: #606266;
    word-break: break-all;
    font-size: 0.9rem;
    line-height: 1.4;
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

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem 0;
  }

  :deep(.clear-dialog .p-dialog-footer) {
    padding: 1rem;
    border-top: 1px solid #e1f3d8;
  }

  .dialog-header-with-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .warning-icon {
    color: #f56c6c;
    font-size: 1.2rem;
  }
  </style>
  