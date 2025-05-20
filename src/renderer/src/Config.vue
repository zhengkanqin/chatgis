<template>
    <div class="p-4" >
      <div v-if="configLoaded">
        <div v-for="(value, key) in config" :key="key" class="p-field p-my-3">
          <label :for="key" class="p-d-block">{{ key }}</label>
          <InputText
            :id="key"
            v-model="config[key]"
            class="p-inputtext-sm p-d-block"
          />
        </div>
        <div class="button-container"><Button label="保存配置" icon="pi pi-check" @click="submitConfig"/></div>
        
      </div>
      <div v-else>加载中...</div>
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
    } else {
      alert('配置保存失败：' + res.error);
    }
  } catch (error) {
    alert('保存时出错：' + error.message);
  }
}
  </script>
  
  <style scoped>
  .p-field {
    display: flex;
    flex-direction: column;
    margin: 3rem;
    gap: 0.5rem;
  }

  .p-inputtext-sm {
    width: 100%;
  }

  .button-container {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
    padding: 5rem;
  }
  .button-container button {
    width: 100%;
  }
  </style>
  