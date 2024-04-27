import { getFiles, merge, upload, verify } from '@/service/file/file'
import { defineStore } from 'pinia'
import type { IFileUploadState } from './type'
import type {
  IMergeChunksControllerParams,
  IUploadChunkControllerParams,
  IVefiryFileControllerParams
} from '@/types/file'

const useFileStore = defineStore('file', {
  state: (): IFileUploadState => ({
    exists: false,
    existsList: [],
    files: []
  }),
  actions: {
    async uploadChunkAction(
      params: IUploadChunkControllerParams,
      onTick: (index: number, percent: number) => void,
      index: number,
      signal?: AbortSignal
    ) {
      const resp = await upload(params, onTick, index, signal)
      if (resp.code !== 0) {
        ElMessage.error(resp.message || `上传第${index}个切片失败`)
      }
    },
    async verifyFileAction(file: IVefiryFileControllerParams) {
      const resp = await verify(file)
      if (resp.code === 0) {
        this.exists = resp.data.exists
        this.existsList = resp.data.existsList
      } else {
        ElMessage.error('校验文件是否已存在失败')
      }
    },
    async mergeFileAction(file: IMergeChunksControllerParams) {
      const resp = await merge(file)
      if (resp.code === 0) {
        ElMessage.success('上传成功')
      } else {
        ElMessage.error(resp.message || '上传失败')
      }
    },
    async getFilesAction() {
      const resp = await getFiles()
      if (resp.code === 0) {
        this.files = resp.data.files
      } else {
        ElMessage.error('获取文件列表失败')
      }
    }
  }
})

export default useFileStore
