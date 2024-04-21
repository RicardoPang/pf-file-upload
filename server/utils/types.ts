export interface Response<T> {
  code: number
  data: T
  message?: string
}

export interface VefiryFileControllerParams {
  // 文件 hash 值
  fileHash?: string
  // 分片索引
  filename?: string
}

export type VefiryFileControllerResponse = Response<{
  exists: boolean
  existsList: string[]
}>

export interface UploadedFileControllerParams {
  name: string
  uploadedSize: number
  totalSize: number
  time: string
  hash: string
}

export type UploadedFileControllerResponse = Response<{
  files: string[]
}>

export interface MergeChunksControllerParams {
  filename?: string
  size?: number
  // 文件 hash 值
  fileHash?: string
}

export type MergeChunksControllerResponse = Response<{
  message: string
  hash: string
}>

export interface UploadChunkControllerParams {
  // 切片 hash 值
  hash?: string
  // 文件 hash 值
  fileHash?: string
  // 分片内容
  chunk?: Buffer
  // 文件名
  filename?: string
  // 文件大小
  size?: string
}

export type UploadChunkControllerReponse = Response<{
  hash: string
  message: string
}>

export const fileSizes: { [fileHash: string]: number } = {}
