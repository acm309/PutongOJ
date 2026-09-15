/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_BUILD_TIME: string
  readonly VITE_BUILD_SHA: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
