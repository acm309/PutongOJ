/* eslint-disable vue/no-reserved-component-names */
import { createApp } from 'vue'
import {
  Button,
  Card,
  Col,
  Content,
  DatePicker,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  Footer,
  Form,
  FormItem,
  Header,
  Icon,
  Input,
  Layout,
  Menu,
  MenuItem,
  Message,
  Modal,
  Option,
  Page,
  Progress,
  Row,
  Select,
  Spin,
  Step,
  Steps,
  Submenu,
  Switch,
  TabPane,
  Tabs,
  Tag,
  Tooltip,
  Transfer,
} from 'view-ui-plus'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App'
import router from './router'
import '@/my-theme/index.less'
import { semiRestful } from './api'
import zh from '@/locales/zh'
import en from '@/locales/en'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

const i18n = createI18n({
  allowComposition: true,
  globalInjection: true,
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zh,
    'en-US': en,
  },
})

app.use(i18n)

app.component('Row', Row)
app.component('Col', Col)
app.component('Input', Input)
app.component('Icon', Icon)
app.component('Tabs', Tabs)
app.component('TabPane', TabPane)
app.component('Button', Button)
app.component('Select', Select)
app.component('Option', Option)
app.component('Page', Page)
app.component('Tooltip', Tooltip)
app.component('Card', Card)
app.component('Progress', Progress)
app.component('Dropdown', Dropdown)
app.component('DropdownMenu', DropdownMenu)
app.component('DropdownItem', DropdownItem)
app.component('Transfer', Transfer)
app.component('Steps', Steps)
app.component('Step', Step)
app.component('DatePicker', DatePicker)
app.component('Layout', Layout)
app.component('Header', Header)
app.component('Menu', Menu)
app.component('MenuItem', MenuItem)
app.component('Submenu', Submenu)
app.component('Content', Content)
app.component('Footer', Footer)
app.component('Modal', Modal)
app.component('Form', Form)
app.component('FormItem', FormItem)
app.component('ISwitch', Switch)
app.component('Tag', Tag)
app.component('Spin', Spin)

// https://forum.vuejs.org/t/how-to-use-globalproperties-in-vue-3-setup-method/108387/4
// https://vuejs.org/api/application.html#app-provide
app.config.globalProperties.$Message = Message
app.config.globalProperties.$Modal = Modal
app.config.globalProperties.$Spin = Spin
app.provide('$Message', app.config.globalProperties.$Message)
app.provide('$Modal', app.config.globalProperties.$Modal)
app.provide('$Spin', app.config.globalProperties.$Spin)

Promise.all([
  useSessionStore().fetch(),
  useRootStore().fetchWebsiteConfig(),
]).then(() => {
  if (useRootStore().semi_restful) {
    semiRestful()
  }
  // Router must be loaded after session/website config is loaded
  app.use(router)
  // https://www.mathew-paul.nz/posts/how-to-use-vue2-with-vite/
  app.mount('#app')
})

// Setup Volar for Vue3
// https://github.com/johnsoncodehk/volar/discussions/583
