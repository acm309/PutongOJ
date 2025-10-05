import uiEN from 'view-ui-plus/dist/locale/en-US'
import uiZH from 'view-ui-plus/dist/locale/zh-CN'
import ojLegacyEN from './en.legacy.json'
import ojLegacyZH from './zh.legacy.json'

export default {
  'zh-CN': { ...uiZH, oj: ojLegacyZH },
  'en-US': { ...uiEN, oj: ojLegacyEN },
}
