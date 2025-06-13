<template>
    <div class="config-container">
      <div v-if="configLoaded" class="config-content">
        <h2 class="config-title">系统配置</h2>
        <div class="config-form">
          <div v-for="(value, key) in config" :key="key" class="config-field">
            <label :for="key" class="field-label">{{ key }}</label>
            <InputText
              :id="key"
              v-model="config[key]"
              class="field-input"
            />
          </div>
          <div class="button-container">
            <Button 
              label="保存配置" 
              class="save-button"
              @click="submitConfig"
            />
          </div>
        </div>
      </div>
      <div v-else class="loading-container">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <span class="loading-text">加载中...</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { reactive, ref, onMounted } from 'vue'
  import InputText from 'primevue/inputtext'
  import Button from 'primevue/button'
  import { toRaw } from 'vue';
  const dev = window.env?.isDev?.();
    const configPath = dev
        ? 'out\\back\\config.json'
        : 'resources\\config.json';
    const config = reactive({});
    const configLoaded = ref(false);
    console.log('configPath:', configPath);
  onMounted(
    async () => {
    try {
        const result = await window.api.readConfig(configPath);
        console.log('读取结果:', result);
        if (result.success) {
        Object.assign(config, result.data);
        configLoaded.value = true;
        } else {
        alert('配置读取失败: ' + result.error);
        }
    } catch (err) {
        alert('读取配置异常: ' + err.message);
    }
});

  
  async function submitConfig() {
  try {
    // 转成纯 JS 对象，去掉响应式代理
    const rawConfig = JSON.parse(JSON.stringify(toRaw(config)));
    const res = await window.api.saveConfig(configPath, rawConfig);
    if (res.success) {
      alert('配置保存成功！');
      // 调用重启接口
      fetch('http://127.0.0.1:8000/restart');
    } else {
      alert('配置保存失败：' + res.error );
    }
  } catch (error) {
    alert('保存时出错：' + error.message);
  }
}
  </script>
  
  <style scoped>
  .config-container {
    padding: 2rem;
    min-height: 100vh;
    background-color: #f8f9fa;
    overflow: hidden;
    
  }

  .config-content {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    animation: fadeIn 0.3s ease-in-out;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .config-content::-webkit-scrollbar {
    display: none;
  }

  .config-title {
    color: #2c3e50;
    margin-bottom: 2rem;
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .config-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .config-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    font-size: 0.9rem;
    color: #4a5568;
    font-weight: 500;
  }

  .field-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .field-input:hover {
    border-color: #4299e1;
  }

  .field-input:focus {
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .button-container {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }

  .save-button {
    background-color:rgb(93, 180, 93);
    border: none;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    border-radius: 6px;
    transition: all 0.2s ease;
    min-width: 200px;
  }

  .save-button:hover {
    background-color: #3182ce;
    transform: translateY(-1px);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    gap: 1rem;
  }

  .loading-text {
    color: #4a5568;
    font-size: 1.1rem;
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
  </style>
  