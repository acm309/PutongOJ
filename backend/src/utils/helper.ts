import pickBy from 'lodash/pickBy'
import { generatePwd, isComplexPwd } from './index'

export function purify (obj: Record<string, any>) {
  return pickBy(obj, x => x != null && x !== '')
}

export default {
  purify,
  /** @deprecated Import from utils */
  generatePwd,
  /** @deprecated Import from utils */
  isComplexPwd,
}
