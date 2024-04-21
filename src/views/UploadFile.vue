<template>
  <div class="hn-upload-container">
    <div class="upload-wrapper">
      <div class="upload-item">
        <el-upload
          :on-change="handleChange"
          :action="''"
          :auto-upload="false"
          :show-file-list="false"
          ref="uploadRef"
          drag
          multiple
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件放到这里或 <em>选择文件</em></div>
        </el-upload>
      </div>
      <div class="tool-item">
        <div class="btns">
          <el-button
            style="margin-left: 10px"
            class="tool-btn"
            @click="submitUpload"
            >上传</el-button
          >
          <el-button class="tool-btn" @click="handlePause">{{
            upload ? '暂停' : '继续'
          }}</el-button>
        </div>
        <div class="el-upload__tip">大文件上传</div>
      </div>
    </div>
    <div class="file-wrapper">
      <template v-if="file">
        <h2 class="file-title">上传中</h2>
        <ul class="file-container">
          <li class="file-item">
            <div class="file-item-top">
              <span>{{ file.name }} {{ fileSize(file.size) }}</span>
            </div>
            <div class="file-item-progress">
              <el-progress
                :percentage="uploadProgress > 100 ? 100 : uploadProgress"
                :show-text="false"
                :color="'#265AEB'"
                :stroke-width="10"
              >
              </el-progress>
            </div>
            <div class="file-item-value">
              <span class="percentage-value">{{ uploadProgress }}% done</span>
            </div>
          </li>
        </ul>
      </template>

      <template v-if="uploadedFileList && uploadedFileList.length">
        <h2 class="file-title">已上传</h2>
        <ul class="file-container">
          <li
            class="file-item"
            v-for="file in uploadedFileList"
            :key="file.uid"
          >
            <div class="file-item-top">
              <span>{{ file.name }} {{ fileSize(file.size) }}</span>
            </div>
            <div class="file-item-progress">
              <el-progress
                :percentage="fileProgress(file)"
                :show-text="false"
                :color="'#265AEB'"
                :stroke-width="10"
              >
              </el-progress>
            </div>
            <div class="file-item-value">
              <span class="percentage-value"
                >{{ fileProgress(file) }}% done</span
              >
            </div>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import pfRequest from '../service'
import type { UploadFile, UploadProps } from 'element-plus'
import Worker from '../utils/hashSample.ts?worker'
import type { FileSlice } from '@/utils/file'
import { CHUNK_SIZE } from '@/const'
import { ElMessage, ElUpload } from 'element-plus'
import { Scheduler } from '@/utils/scheduler'

const upload = ref<boolean>(true)
const file = ref<UploadFile | null>(null)
const uploadedFileList = ref<UploadFile[]>([])
const fileChunks = ref<FileSlice[]>([])
const hash = ref<string>('')
const uploadProgress = ref<number>(0)
const uploadRef = ref<InstanceType<typeof ElUpload>>()
let controller: AbortController | null = null

onMounted(() => {
  getFiles()
})

async function getFiles() {
  const res = await pfRequest.get({ url: '/api/files' })
  const files = (res.data && res.data.files) || []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (+file.uploadedSize === +file.totalSize) {
      uploadedFileList.value.push(file)
    }
  }
}

// 使用Web Worker进行hash计算的函数
function calculateHash(fileChunks: FileSlice[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker()
    worker.postMessage({ chunks: fileChunks })
    worker.onmessage = (e) => {
      const { hash } = e.data
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
  hash,
  paralleSize = 3
}: {
  chunks: FileSlice[]
  hash: string
  paralleSize?: number
}) {
  const scheduler = new Scheduler(paralleSize)
  const totalChunks = chunks.length
  let uploadedChunksCount = 0

  console.log(fileChunks.value)

  for (let i = 0; i < chunks.length; i++) {
    const { chunk } = chunks[i]

    let h = ''
    if (chunks[i].hash) {
      h = chunks[i].hash as string
    } else {
      h = `${hash}-${chunks.indexOf(chunks[i])}`
    }

    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('hash', h)
    formData.append('fileHash', hash)
    formData.append('filename', file.value?.name as string)
    formData.append('size', String(file.value?.size))

    await scheduler.add(async () => {
      if (!upload.value) {
        return
      }
      controller = new AbortController()
      const { signal } = controller
      try {
        await pfRequest.post({
          url: '/api/upload',
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
          },
          signal
        })
        uploadedChunksCount++
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('上传被取消')
          return
        }
        throw error
      } finally {
        controller = null
      }

      // 判断所有切片都已上传完成后，调用mergeRequest方法
      if (uploadedChunksCount === totalChunks) {
        mergeRequest()
      }
    })
  }
}

async function mergeRequest() {
  await pfRequest.post({
    url: '/api/merge',
    data: {
      filename: file.value?.name as string,
      size: CHUNK_SIZE,
      fileHash: hash.value
    }
  })
  ElMessage.success('上传成功')
  file.value = null
  uploadedFileList.value = []
  getFiles()
}

async function verifyUpload(filename: string, fileHash: string) {
  return await pfRequest.post({
    url: '/api/verify',
    data: {
      filename,
      fileHash
    }
  })
}

const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  file.value = uploadFile
  uploadProgress.value = 0
}

async function submitUpload() {
  if (!file.value) {
    ElMessage.error('Oops, 请您选择文件后再操作~~.')
    return
  }

  // 将文件切片
  const chunks: FileSlice[] = []
  let cur = 0
  while (cur < file.value.raw!.size) {
    const slice = file.value.raw!.slice(cur, cur + CHUNK_SIZE)
    chunks.push({
      chunk: slice,
      size: slice.size
    })
    cur += CHUNK_SIZE
  }

  // 计算hash
  hash.value = await calculateHash(chunks)
  fileChunks.value = chunks.map((item, index) => ({
    ...item,
    hash: `${hash.value}-${index}`,
    progress: 0
  }))
  // 校验文件是否已存在
  const resp = await verifyUpload(file.value.name, hash.value)
  if (resp.code === 0) {
    const { exists } = resp.data
    if (!exists) {
      await uploadChunks({
        chunks,
        hash: hash.value
      })
    } else {
      ElMessage.success('秒传: 文件上传成功')
    }
  } else {
    ElMessage.error('校验文件是否已存在失败')
  }
}

async function handlePause() {
  upload.value = !upload.value
  if (upload.value) {
    // 校验文件是否已存在
    const resp = await verifyUpload(file.value?.name as string, hash.value)
    if (resp.code === 0) {
      const { exists, existsList } = resp.data
      const newChunks = fileChunks.value.filter(
        (item) => !existsList.includes(item.hash)
      )
      if (!exists) {
        await uploadChunks({
          chunks: newChunks,
          hash: hash.value
        })
      } else {
        ElMessage.success('秒传: 文件上传成功')
      }
    } else {
      ElMessage.error('校验文件是否已存在失败')
    }
  } else {
    console.log('暂停上传')
    if (controller) {
      controller.abort()
      controller = null
    }
  }
}

function fileSize(size?: number | undefined) {
  if (!size) {
    return ''
  }
  size = +size
  const sizes = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${sizes[i]}`
}

const fileProgress = (file: any) => {
  return +((file.uploadedSize / file.totalSize) * 100).toFixed(2)
}
</script>

<style lang="less">
.hn-upload-container {
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 30px 20px;
  color: #606266;
  font-size: 14px;

  .upload-wrapper {
    width: 344px;
    height: 320px;
    text-align: center;
    border: 2px dashed #9ca3af;
    border-radius: 4px;
    background: #f9fafb;

    .el-upload-dragger {
      border: none;
      background: #f9fafb;
    }

    .tool-item {
      display: flex;
      flex-direction: column;
      margin: 0 16px;
      padding: 24px 30px;
      border-top: 1px solid #9ca3af;

      .btns {
        display: flex;
      }

      .tool-btn {
        flex: 1;
        border-radius: 4px;
        outline: 2px solid transparent;
        outline-offset: 2px;
        cursor: pointer;
        color: #4b5563;
        font-weight: 600;
        background: #e5e7eb;
      }

      .el-upload__tip {
        color: #9ca3af;
        font-size: 12px;
        line-height: 16px;
        margin-top: 16px;
      }
    }
  }

  .file-wrapper {
    padding-left: 48px;

    .file-title {
      font-size: 16px;
      line-height: 24px;
      color: #4b5563;
      font-weight: 600;
      margin: 16px 0;
    }

    .file-container {
      width: 344px;
      max-height: 60vh;
      overflow-y: auto;
      margin-top: 10px;

      .file-item {
        display: flex;
        flex-direction: column;
        margin-top: 32px;
        color: #6b7280;
        font-weight: 600;

        .file-item-top {
          display: flex;
          margin-bottom: 8px;
        }
        .file-item-top span {
          flex: 1;
        }
        .file-item-value {
          margin-top: 8px;
        }
      }
      .file-item:first-child {
        margin-top: 0;
      }
    }
  }
}
</style>
