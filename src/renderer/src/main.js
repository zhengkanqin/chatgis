import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import ToastService from 'primevue/toastservice';

// 样式导入（路径不能错）

import router from './router'

const app = createApp(App)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(ToastService);
app.use(ElementPlus)
app.use(router)
app.mount('#app')
