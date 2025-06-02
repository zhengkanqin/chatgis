<template>
  <div class="file-upload-container">
    <h2>文件上传</h2>
    
    <div class="upload-area" @dragover.prevent="dragover" @drop.prevent="drop">
      <input 
        type="file" 
        id="fileInput" 
        ref="fileInput" 
        @change="handleFileSelect" 
        style="display: none"
      >
      <label for="fileInput" class="upload-label">
        <div v-if="!selectedFile">
          <p>点击选择文件或拖拽文件到此处</p>
          <p class="hint">支持单个文件上传</p>
        </div>
        <div v-else class="file-info">
          <p>已选择文件: {{ selectedFile.name }}</p>
          <p>大小: {{ formatFileSize(selectedFile.size) }}</p>
          <button @click.stop="removeFile" class="remove-btn">移除</button>
        </div>
      </label>
    </div>

    <button 
      @click="uploadFile" 
      :disabled="!selectedFile || isUploading" 
      class="upload-btn"
    >
      {{ isUploading ? '上传中...' : '上传文件' }}
    </button>

    <div v-if="uploadResult" class="result-container">
      <h3>上传结果</h3>
      <div v-if="uploadResult.success" class="success">
        <p>文件上传成功!</p>
        <p>文件名: {{ uploadResult.file.fileName }}</p>
        <p>文件大小: {{ formatFileSize(uploadResult.file.size) }}</p>
        <p>文件类型: {{ uploadResult.file.mimeType }}</p>
        <a :href="uploadResult.file.url" target="_blank" class="file-link">查看文件</a>
      </div>
      <div v-else class="error">
        <p>上传失败: {{ uploadResult.error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'FileUpload',
  setup() {
    const selectedFile = ref(null);
    const isUploading = ref(false);
    const uploadResult = ref(null);
    const fileInput = ref(null);

    const handleFileSelect = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        selectedFile.value = files[0];
      }
    };

    const dragover = (event) => {
      event.currentTarget.classList.add('dragover');
    };

    const drop = (event) => {
      event.currentTarget.classList.remove('dragover');
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        selectedFile.value = files[0];
      }
    };

    const removeFile = () => {
      selectedFile.value = null;
      uploadResult.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const uploadFile = async () => {
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append('file', selectedFile.value); // 字段名必须为 'file
  try {
    const response = await fetch('http://106.52.185.171:8080/chatgis/files/upload', {
      method: 'POST',
      body: formData, 
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const result = await response.json();
    console.log('上传成功:', result);
  } catch (error) {
    console.error('上传失败:', error);
  }
};

    return {
      selectedFile,
      isUploading,
      uploadResult,
      fileInput,
      handleFileSelect,
      dragover,
      drop,
      removeFile,
      formatFileSize,
      uploadFile
    };
  }
};
</script>

<style scoped>
.file-upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h2 {
  text-align: center;
  color: #333;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #888;
}

.upload-area.dragover {
  border-color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
}

.upload-label {
  display: block;
  cursor: pointer;
}

.hint {
  font-size: 0.8em;
  color: #666;
}

.file-info {
  text-align: center;
}

.remove-btn {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #cc0000;
}

.upload-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.upload-btn:hover:not(:disabled) {
  background-color: #369f6e;
}

.upload-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.result-container {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
}

.success {
  background-color: rgba(66, 185, 131, 0.2);
  border: 1px solid #42b983;
}

.error {
  background-color: rgba(255, 68, 68, 0.2);
  border: 1px solid #ff4444;
}

.file-link {
  display: inline-block;
  margin-top: 10px;
  color: #42b983;
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
}
</style>