import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import ToastService from 'primevue/toastservice'
import { createPinia } from 'pinia'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import Tooltip from 'primevue/tooltip'
import DialogService from 'primevue/dialogservice'

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
  Badge,
  Button,
  Checkbox,
  Chip,
  Card,
  Column,
  DataTable,
  Dialog,
  FloatLabel,
  InputGroup,
  InputGroupAddon,
  InputNumber,
  InputText,
  Menubar,
  MultiSelect,
  Popover,
  Select,
  SelectButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Toast,
  ToggleButton,
  Toolbar,
  TreeTable,
  IconField,
  InputIcon,
  SplitButton,
  Panel,
  ToggleSwitch,
} from 'primevue'

const app = createApp(App)
app.use(createPinia())
app.use(PrimeVue, {
  // unstyled: true
  // theme: 'none'
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
})
app.use(ToastService)
app.use(DialogService)

app.directive('tooltip', Tooltip)

app.component('p-button', Button)
app.component('p-chip', Chip)
app.component('p-toolbar', Toolbar)
app.component('p-select', Select)
app.component('p-inputtext', InputText)
app.component('p-inputnumber', InputNumber)
app.component('p-dialog', Dialog)
app.component('p-inputgroup', InputGroup)
app.component('p-inputgroupaddon', InputGroupAddon)
app.component('p-togglebutton', ToggleButton)
app.component('p-toggleswitch', ToggleSwitch)
app.component('p-selectbutton', SelectButton)
app.component('p-tabs', Tabs)
app.component('p-tabpanels', TabPanels)
app.component('p-tabpanel', TabPanel)
app.component('p-tablist', TabList)
app.component('p-tab', Tab)
app.component('p-badge', Badge)
app.component('p-popover', Popover)
app.component('p-datatable', DataTable)
app.component('p-column', Column)
app.component('p-toast', Toast)
app.component('p-accordion', Accordion)
app.component('p-accordionpanel', AccordionPanel)
app.component('p-accordionheader', AccordionHeader)
app.component('p-accordioncontent', AccordionContent)
app.component('p-checkbox', Checkbox)
app.component('p-floatlabel', FloatLabel)
app.component('p-menubar', Menubar)
app.component('p-multiselect', MultiSelect)
app.component('p-treetable', TreeTable)
app.component('p-card', Card)
app.component('p-iconfield', IconField)
app.component('p-inputicon', InputIcon)
app.component('p-splitbutton', SplitButton)
app.component('p-panel', Panel)

app.mount('#app')
