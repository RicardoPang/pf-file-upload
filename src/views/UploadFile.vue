<template>
  <div class="hn-upload-container">
    <el-upload ref="uploadRef" :action="''" :before-upload="beforeUpload">
      <template v-slot:trigger>
        <el-button size="small" type="primary">选取文件</el-button>
      </template>
      <el-button
        style="margin-left: 10px"
        size="small"
        type="success"
        @click="submitUpload"
        >上传到服务器</el-button
      >
    </el-upload>
    <div class="file">
      <div style="font-size: 12px; color: #666">
        文件名称为：{{ file?.name }}
      </div>
      <div style="font-size: 12px; color: #666">文件大小为：{{ fileSize }}</div>
      <div class="progress">
        <span style="font-size: 12px; color: #666">计算hash：</span>
        <el-progress
          :percentage="hashProgress > 100 ? 100 : hashProgress"
        ></el-progress>
      </div>
      <div class="progress">
        <span style="font-size: 12px; color: #666">上传进度：</span>
        <el-progress
          :percentage="uploadProgress > 100 ? 100 : uploadProgress"
        ></el-progress>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import pfRequest from '../service'
import type { UploadProps } from 'element-plus'
import Worker from '../utils/hash.ts?worker'
import type { FileSlice } from '@/utils/file'
import { CHUNK_SIZE } from '@/const'
import { ElMessage, ElUpload } from 'element-plus'
import { ConcurrencyPool } from '@/utils/pool'

const file = ref<File | null>(null)
const fileChunks = ref<FileSlice[]>([])
const hash = ref<string>('')
const hashProgress = ref<number>(0)
const uploadProgress = ref<number>(0)
const uploadRef = ref<InstanceType<typeof ElUpload>>()

// 使用Web Worker进行hash计算的函数
function calculateHash(fileChunks: FileSlice[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker()

    worker.postMessage({ chunks: fileChunks })

    worker.onmessage = (e) => {
      const { progress, hash } = e.data
      hashProgress.value = Number(progress.toFixed(2))
      if (hash) {
        resolve(hash)
      }
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(event.error)
    }
  })
}

async function uploadChunks({
  chunks,
  hash
}: {
  chunks: FileSlice[]
  hash: string
  concurrency?: number
}) {
  const pool = new ConcurrencyPool(4)
  const totalChunks = chunks.length
  let uploadedChunksCount = 0

  for (let i = 0; i < chunks.length; i++) {
    const { chunk } = chunks[i]
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('hash', `${hash}-${chunks.indexOf(chunks[i])}`)
    formData.append('fileHash', hash)
    formData.append('filename', file.value?.name as string)

    await pool.enqueue(async () => {
      await pfRequest.post({
        url: '',
        data: formData,
        headers: {
          'content-type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent
          const percent = Math.floor((loaded / (total || 0)) * 100)
          chunks[chunks.indexOf(chunks[i])].progress = percent
          const totalProgress =
            chunks.reduce((sum, chunk) => sum + (chunk.progress || 0), 0) /
            totalChunks
          uploadProgress.value = Number(totalProgress.toFixed(2))
        }
      })
      uploadedChunksCount++

      // 判断所有切片都已上传完成后，调用mergeRequest方法
      if (uploadedChunksCount === totalChunks) {
        mergeRequest()
        console.log('上传完成')
      }
    })
  }
}

async function mergeRequest() {
  await pfRequest.post({
    url: '/merge',
    data: JSON.stringify({
      filename: file.value?.name as string,
      size: file.value?.size as number,
      fileHash: hash.value
    })
  })
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  file.value = rawFile
  return false
}

async function submitUpload() {
  if (!file.value) {
    ElMessage.error('Oops, 请您选择文件后再操作~~.')
    return
  }

  // 将文件切片
  const chunks: FileSlice[] = []
  let cur = 0
  while (cur < file.value.size) {
    const slice = file.value.slice(cur, cur + CHUNK_SIZE)
    chunks.push({
      chunk: slice,
      size: slice.size
    })
    cur += CHUNK_SIZE
  }

  // 计算hash
  hash.value = await calculateHash(chunks)
  fileChunks.value = chunks
  // 上传切片
  await uploadChunks({
    chunks: fileChunks.value,
    hash: hash.value
  })
}

const fileSize = computed(() => {
  return file.value ? `${(file.value.size / 1024 / 1024).toFixed(2)} MB` : ''
})
</script>

<style lang="less">
.hn-upload-container {
  width: 100%;
  position: relative;
  padding: 30px 20px;
  color: #606266;
  font-size: 14px;

  .file {
    width: 50%;
    overflow: hidden;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    box-sizing: border-box;
    margin-top: 10px;
    padding: 10px;
  }

  .el-upload-list__item.is-success:hover {
    .el-upload-list__item-status-label {
      display: block;
    }

    .el-icon-close {
      display: none;
    }
  }

  .el-button.el-button--default {
    color: #fff !important;
  }
}
</style>
