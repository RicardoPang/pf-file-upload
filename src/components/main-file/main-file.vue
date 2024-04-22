<template>
  <div class="main-file">
    <h2 class="file-title">{{ title }}</h2>
    <div class="file-container">
      <template v-if="file">
        <fileItem
          :fileName="file.name"
          :fileSize="file.size"
          :progress="progress"
        />
      </template>
      <template v-else-if="fileList && fileList.length">
        <fileItem
          v-for="file in fileList"
          :key="file.uid"
          :fileName="file.name"
          :fileSize="file.size"
          :progress="100"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadFile } from 'element-plus'
import fileItem from './c-cpns/file-item.vue'

export interface IUploadFile {
  hash: string
  name: string
  time: string
  size: number
  totalSize: number
  uploadedSize: number
}

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  file: {
    type: Object as () => UploadFile,
    default: null
  },
  progress: {
    type: Number,
    default: 0
  },
  fileList: {
    type: Array as () => UploadFile[],
    default: () => []
  }
})

console.log(props.fileList)
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
