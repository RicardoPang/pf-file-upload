<template>
  <div class="hn-upload-container">
    <div class="upload-wrapper">
      <div class="upload-item">
        <el-upload
          :on-change="handleChange"
          :action="''"
          :auto-upload="false"
          :show-file-list="false"
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
        <MainFile title="上传中" :fileList="[file]" />
      </template>
      <template v-if="files?.length > 0">
        <MainFile title="已上传" :fileList="files" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile, UploadProps } from 'element-plus'
import HashWorker from '../utils/hash.ts?worker'
import { CHUNK_SIZE } from '@/const'
import { ElMessage, ElUpload } from 'element-plus'
import { Scheduler } from '@/utils/scheduler'
import MainFile from '@/components/main-file/main-file.vue'
import useFileStore from '@/store/file/file'
import { storeToRefs } from 'pinia'
import type {
  IFileSlice,
  IUploadChunkControllerParams,
  IUploadChunkParams
} from '@/types/file'

const upload = ref<boolean>(true)
const file = ref<UploadFile | null>(null)
const fileChunks = ref<IFileSlice[]>([])
const hash = ref<string>('')
const controllersMap = new Map<number, AbortController>()

// 发起数据请求
const fileStore = useFileStore()
fileStore.getFilesAction()
// 从store获取数据
const { files } = storeToRefs(fileStore)

// 使用Web Worker进行hash计算的函数
function calculateHash(fileChunks: IFileSlice[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const worker = new HashWorker()
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

// 切片上传 limit-限制并发数
async function uploadChunks({
  chunks,
  hash,
  totalChunksCount,
  uploadedChunks,
  limit = 3
}: IUploadChunkParams) {
  const scheduler = new Scheduler(limit)
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

    const params = {
      chunk,
      hash: h,
      fileHash: hash,
      filename: file.value?.name as string,
      size: file.value?.size
    } as IUploadChunkControllerParams

    scheduler.add(() => {
      const controller = new AbortController()
      controllersMap.set(i, controller)
      const { signal } = controller

      console.log(`开始上传切片 ${i}`)
      if (!upload.value) {
        return Promise.reject('上传暂停')
      }

      return fileStore
        .uploadChunkAction(params, onTick, i, signal)
        .then(() => {
          console.log(`完成切片的上传 ${i}`)
          uploadedChunksCount++
          // 判断所有切片都已上传完成后，调用mergeRequest方法
          if (uploadedChunksCount === totalChunks) {
            mergeRequest()
          }
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.log('上传被取消')
          } else {
            throw error
          }
        })
        .finally(() => {
          // 完成后将控制器从map中移除
          controllersMap.delete(i)
        })
    })
  }

  function onTick(index: number, percent: number) {
    chunks[index].percentage = percent

    const newChunksProgress = chunks.reduce(
      (sum, chunk) => sum + (chunk.percentage || 0),
      0
    )
    const totalProgress =
      (newChunksProgress + uploadedChunks * 100) / totalChunksCount

    file.value!.percentage = Number(totalProgress.toFixed(2))
  }
}

function abortAll() {
  controllersMap.forEach((controller, index) => {
    console.log(`Aborting upload for chunk ${index}`)
    controller.abort()
  })
  controllersMap.clear()
}

// 合并切片请求
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

// 文件上传
const handleChange: UploadProps['onChange'] = (uploadFile) => {
  file.value = uploadFile
}

// 文件上传服务器
async function submitUpload() {
  if (!file.value) {
    ElMessage.error('Oops, 请您选择文件后再操作~~.')
    return
  }

  // 将文件切片
  const chunks: IFileSlice[] = []
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
      hash: hash.value,
      totalChunksCount: fileChunks.value.length,
      uploadedChunks: 0
    })
  } else {
    ElMessage.success('秒传: 文件上传成功')
  }
}

// 上传暂停和继续
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
    const newChunks = fileChunks.value.filter((item) => {
      return !existsList.value.includes(item.hash || '')
    })
    console.log('newChunks', newChunks)
    if (!exists.value) {
      await uploadChunks({
        chunks: newChunks,
        hash: hash.value,
        totalChunksCount: fileChunks.value.length,
        uploadedChunks: fileChunks.value.length - newChunks.length
      })
    } else {
      ElMessage.success('秒传: 文件上传成功')
    }
  } else {
    console.log('暂停上传')
    abortAll()
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
