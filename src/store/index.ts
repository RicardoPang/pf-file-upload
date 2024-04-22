import { createPinia } from 'pinia'
import type { App } from 'vue'

const pinia = createPinia()

function registerStore(app: App<Element>) {
  app.use(pinia)
}

export default registerStore
