<template>
  <div class="main-file">
    <h2 class="file-title">{{ title }}</h2>
    <div class="file-container">
      <template v-if="fileList && fileList.length">
        <FileItem v-for="file in fileList" :key="getKey(file)" :file="file" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import type { IUploadedFile } from '@/types/file'
import FileItem from './cpns/file-item.vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  fileList: {
    type: Array as () => (IUploadedFile | UploadFile)[],
    default: () => []
  }
})

const getKey = (file: IUploadedFile | UploadFile) => {
  return 'hash' in file ? file.hash : file.uid
}
</script>

<style lang="less" scoped>
.main-file {
  width: 344px;
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: 16px;

  .file-title {
    font-size: 16px;
    line-height: 24px;
    color: #4b5563;
    font-weight: 600;
    margin-bottom: 16px;
  }
}
</style>
