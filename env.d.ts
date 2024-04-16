/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
  interface IModalConfig {}
  export { IModalConfig }
}

declare module 'spark-md5' {
  const SparkMD5: any
  export default SparkMD5
}

declare module '*.mjs'
