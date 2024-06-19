import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import PrimeVue from 'primevue/config';

import 'primevue/resources/themes/aura-light-green/theme.css'
const pinia = createPinia();

const app = createApp(App);
app.use(pinia);

app.use(PrimeVue);
app.mount('#app')