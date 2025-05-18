<template>
  <div class="container">
  <div class="App">
    <SidebarNav class="SidebarNav" />
    <div class="MainContent">
      <div class="tibar"><tibar /></div>
      <keep-alive>
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </keep-alive>
      </div>
  </div>
</div>
</template>

<script setup>
import tibar from './components/tibar.vue';
import SidebarNav from './SidebarNav.vue';
</script>

<style>
.App {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden; 
}
html, body, #app {
  height: 100%;
  margin: 0;
  border-radius: 50px;
}
* {
  box-sizing: border-box;
}
.tibar {
  height: 40px;
  flex-shrink: 0;
}
.container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.MainContent {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
}
.SidebarNav {
  width: 70px;
}
router-view {
  flex: 1;
  overflow: auto; /* 避免溢出时滚动 */
}
</style>
