export interface Response<T> {
  code: number
  data: T
  message?: string
}

export interface IVefiryFileControllerParams {
  // 文件 hash 值
  fileHash: string
  // 文件名
  filename: string
}

export type VefiryFileControllerResponse = Response<{
  exists: boolean
  existsList: string[]
}>

export interface IMergeChunksControllerParams {
  // 文件 hash 值
  fileHash: string
  // 文件名
  filename: string
  // 切片大小
  size?: number
}

export type MergeChunksControllerResponse = Response<{
  // 文件 hash 值
  hash: string
}>

export interface IUploadChunkControllerParams {
  // 分片内容
  chunk: Blob
  // 切片 hash 值
  hash: string
  // 文件 hash 值
  fileHash: string
  // 文件名
  filename: string
  // 文件大小
  size: number
}

export type UploadChunkControllerResponse = Response<{
  // 文件 hash 值
  hash: string
}>

export interface IUploadedFile {
  // 文件名
  name: string
  // 文件已上传大小
  uploadedSize: number
  // 文件总大小
  totalSize: number
  // 操作时间
  time: string
  // 文件 hash 值
  hash: string
}

export type GetFileControllerResponse = Response<{
  files: IUploadedFile[]
}>

export interface IFileSlice {
  chunk: Blob
  size: number
  hash?: string
  percentage?: number
}
