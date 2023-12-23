/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<any, any, any>
  export default component
}
