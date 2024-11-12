import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import {
  Button,
  Dialog,
  InputGroup,
  InputGroupAddon,
  InputNumber,
  InputText,
  Select,
  SelectButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  ToggleButton,
  Toolbar,
} from 'primevue'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
})
app.component('p-button', Button)
app.component('p-toolbar', Toolbar)
app.component('p-select', Select)
app.component('p-inputtext', InputText)
app.component('p-inputnumber', InputNumber)
app.component('p-dialog', Dialog)
app.component('p-inputgroup', InputGroup)
app.component('p-inputgroupaddon', InputGroupAddon)
app.component('p-togglebutton', ToggleButton)
app.component('p-selectbutton', SelectButton)
app.component('p-tabs', Tabs)
app.component('p-tabpanels', TabPanels)
app.component('p-tabpanel', TabPanel)
app.component('p-tablist', TabList)
app.component('p-tab', Tab)

app.mount('#app')
