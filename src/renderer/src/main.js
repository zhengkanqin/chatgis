import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

// 样式导入（路径不能错）

import router from './router'

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(router)
app.mount('#app')
