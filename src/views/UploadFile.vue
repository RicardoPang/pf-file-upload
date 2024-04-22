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
        <MainFile title="上传中" :file="file" :progress="uploadProgress" />
      </template>
      <template v-if="files && files.length">
        <MainFile title="已上传" :fileList="files" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile, UploadProps } from 'element-plus'
import Worker from '../utils/hash.ts?worker'
import type { FileSlice } from '@/utils/file'
import { CHUNK_SIZE } from '@/const'
import { ElMessage, ElUpload } from 'element-plus'
import { Scheduler } from '@/utils/scheduler'
import MainFile from '@/components/main-file/main-file.vue'
import useFileStore from '@/store/file/file'
import { storeToRefs } from 'pinia'

const upload = ref<boolean>(true)
const file = ref<UploadFile | null>(null)
const fileChunks = ref<FileSlice[]>([])
const hash = ref<string>('')
const uploadProgress = ref<number>(0)
const uploadRef = ref<InstanceType<typeof ElUpload>>()
let controller: AbortController | null = null

const fileStore = useFileStore()
fileStore.getFilesAction()
const { files } = storeToRefs(fileStore)

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
        await fileStore.uploadChunkAction(
          {
            formData,
            onProgress: (progress: number) => {
              uploadProgress.value = progress
            },
            chunks,
            index: i
          },
          signal
        )
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
  await fileStore.mergeFileAction({
    filename: file.value?.name as string,
    size: CHUNK_SIZE,
    fileHash: hash.value
  })
  file.value = null
  fileStore.getFilesAction()
  const { files } = storeToRefs(fileStore)
  console.log(files.value)
}

const handleChange: UploadProps['onChange'] = (uploadFile) => {
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
  await fileStore.verifyFileAction({
    filename: file.value.name,
    fileHash: hash.value
  })
  const { exists } = storeToRefs(fileStore)
  if (!exists.value) {
    await uploadChunks({
      chunks,
      hash: hash.value
    })
  } else {
    ElMessage.success('秒传: 文件上传成功')
  }
}

async function handlePause() {
  upload.value = !upload.value
  if (upload.value) {
    // 校验文件是否已存在
    if (!file.value?.name) {
      return
    }
    await fileStore.verifyFileAction({
      filename: file.value.name,
      fileHash: hash.value
    })
    const { exists, existsList } = storeToRefs(fileStore)
    const newChunks = fileChunks.value.filter(
      (item) => !existsList.value.includes(item.hash)
    )
    if (!exists.value) {
      await uploadChunks({
        chunks: newChunks,
        hash: hash.value
      })
    } else {
      ElMessage.success('秒传: 文件上传成功')
    }
  } else {
    console.log('暂停上传')
    if (controller) {
      controller.abort()
      controller = null
    }
  }
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
  }
}
</style>
