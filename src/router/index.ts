import { createRouter, createWebHistory } from 'vue-router'
import UploadFileView from '../views/UploadFile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UploadFileView
    }
  ]
})

export default router
