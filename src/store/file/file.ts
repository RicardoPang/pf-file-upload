import { getFiles, merge, upload, verify } from '@/service/file/file'
import { defineStore } from 'pinia'
import type { IMerge, IUpload, IVerify } from '@/types/file'
import type { IFileUploadState } from './type'

const useFileStore = defineStore('file', {
  state: (): IFileUploadState => ({
    exists: false,
    existsList: [],
    files: []
  }),
  actions: {
    async uploadChunkAction(file: IUpload, signal?: AbortSignal) {
      const resp = await upload(file, signal)
      if (resp.code !== 0) {
        ElMessage.error(resp.data.message || `上传第${file.index}个切片失败`)
      }
    },
    async verifyFileAction(file: IVerify) {
      const resp = await verify(file)
      if (resp.code === 0) {
        this.exists = resp.data.exists
        this.existsList = resp.data.existsList
      } else {
        ElMessage.error('校验文件是否已存在失败')
      }
    },
    async mergeFileAction(file: IMerge) {
      const resp = await merge(file)
      if (resp.code === 0) {
        ElMessage.success('上传成功')
      } else {
        ElMessage.error(resp.data?.message || '上传失败')
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
