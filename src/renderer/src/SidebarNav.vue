<!-- SidebarNav.vue -->
<template>
    <div class="sidebar">
      <PanelMenu :model="items" class="w-full" />
    </div>
  </template>
  
  <script setup>
  import PanelMenu from 'primevue/panelmenu' // ✅ 默认导出
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const items = [
    {
      icon: 'pi pi-map',
      command: () => router.push('/main')
    },
    {
      icon: 'pi pi-comments',
      command: () => router.push('/data')
    },
    {
      icon: 'pi pi-database',
      command: () => router.push('/config')
    }
  ];
  </script>
  
  <style scoped>
  .sidebar {
    height: 100%;
    border-right: 1px solid #ddd;
    padding: 10px;
    box-sizing: border-box;
    box-shadow: 5px 0 8px -4px rgba(0, 0, 0, 0.3);
  }
  
  </style>
  