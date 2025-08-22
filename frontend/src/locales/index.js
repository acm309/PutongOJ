import uiEN from 'view-ui-plus/dist/locale/en-US'
import uiZH from 'view-ui-plus/dist/locale/zh-CN'
import ojEN from './en.json'
import ojZH from './zh.json'

export default {
  'zh-CN': { ...uiZH, oj: ojZH },
  'en-US': { ...uiEN, oj: ojEN },
}
