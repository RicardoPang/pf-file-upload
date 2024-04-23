import type { FileSlice } from '@/utils/file'

export interface SaveChunkControllerParams {
  // 切片 hash 值
  hash: string
  // 分片内容
  chunk: Blob
  // 文件 hash 值
  fileHash: string
  // 文件名
  filename: string
  // 文件大小
  size: number
}

export interface IUpload {
  formData: SaveChunkControllerParams
  onProgress: (progress: number) => void
  chunks: FileSlice[]
  index: number
}

export interface IVerify {
  filename: string
  fileHash: string
}

export interface IMerge {
  filename: string
  fileHash: string
  size: number
}
