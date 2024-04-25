import type { IUploadedFile } from '@/types/file'

export interface IFileUploadState {
  exists: boolean
  existsList: string[] // 已上传切片列表
  files: IUploadedFile[] // 已上传文件列表
}
