export interface IUploadFile {
  hash?: string
  name?: string
  time?: string
  totalSize?: number
  uploadedSize?: number
  size?: number
}

export interface IFileUploadState {
  exists: boolean
  existsList: any // 已上传切片列表
  files: any[] // 已上传文件列表
}
