import uiEN from 'view-ui-plus/dist/locale/en-US'
import uiZH from 'view-ui-plus/dist/locale/zh-CN'
import ptojEN from './en.json'
import ojLegacyEN from './en.legacy.json'
import ptojZH from './zh.json'
import ojLegacyZH from './zh.legacy.json'

export default {
  'zh-CN': { ...uiZH, oj: ojLegacyZH, ptoj: ptojZH },
  'en-US': { ...uiEN, oj: ojLegacyEN, ptoj: ptojEN },
}
