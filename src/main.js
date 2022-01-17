// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import VueClipboard from 'vue-clipboard2'
import '@/my-theme/index.less'
import { formate, timePretty, timeContest, timeagoPretty } from '@/util/formate'
import {
  Row,
  Col,
  Input,
  Icon,
  Tabs,
  TabPane,
  Button,
  Select,
  Option,
  Page,
  Tooltip,
  Card,
  Progress,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Transfer,
  Steps,
  Step,
  DatePicker,
  Layout,
  Header,
  Menu,
  MenuItem,
  Message,
  Submenu,
  Content,
  Footer,
  Modal,
  Form,
  FormItem,
  Switch,
  Tag,
  Spin
} from 'iview'
import { semiRestful } from './api'

Vue.component('Row', Row)
Vue.component('Col', Col)
Vue.component('Input', Input)
Vue.component('Icon', Icon)
Vue.component('Tabs', Tabs)
Vue.component('TabPane', TabPane)
Vue.component('Button', Button)
Vue.component('Select', Select)
Vue.component('Option', Option)
Vue.component('Page', Page)
Vue.component('Tooltip', Tooltip)
Vue.component('Card', Card)
Vue.component('Progress', Progress)
Vue.component('Dropdown', Dropdown)
Vue.component('DropdownMenu', DropdownMenu)
Vue.component('DropdownItem', DropdownItem)
Vue.component('Transfer', Transfer)
Vue.component('Steps', Steps)
Vue.component('Step', Step)
Vue.component('DatePicker', DatePicker)
Vue.component('Layout', Layout)
Vue.component('Header', Header)
Vue.component('Menu', Menu)
Vue.component('MenuItem', MenuItem)
Vue.component('Submenu', Submenu)
Vue.component('Content', Content)
Vue.component('Footer', Footer)
Vue.component('Modal', Modal)
Vue.component('Form', Form)
Vue.component('FormItem', FormItem)
Vue.component('i-switch', Switch)
Vue.component('Tag', Tag)
Vue.component('Spin', Spin)

Vue.prototype.$Message = Message
Vue.prototype.$Modal = Modal
Vue.prototype.$Spin = Spin
Vue.prototype.$Spin.showLoading = function () {
  Vue.prototype.$Spin.show({
    render: (h) => {
      return h('div', [
        h('Icon', {
          'class': 'loading',
          props: {
            type: 'load-c',
            size: 18
          }
        }),
        h('div', 'Loading')
      ])
    }
  })
}

Vue.use(VueClipboard)
Vue.filter('formate', formate)
Vue.filter('timePretty', timePretty)
Vue.filter('timeContest', timeContest)
Vue.filter('timeagoPretty', timeagoPretty)

Vue.prototype.$Message.config({
  duration: 3.5 // 默认的 1.5s 也太短了
})

Vue.config.productionTip = false

Promise.all([
  store.dispatch('fetchWebsiteConfig'),
  store.dispatch('session/fetch')
]).then(() => {
  if (store.getters.website.semi_restful) {
    semiRestful()
  }
  /* eslint-disable no-new */
  // https://www.mathew-paul.nz/posts/how-to-use-vue2-with-vite/
  new Vue({
    router,
    store,
    render: (h) => h(App)
  }).$mount('#app')
})
