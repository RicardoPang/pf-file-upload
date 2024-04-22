export interface IUploadFile {
  hash?: string
  name?: string
  time?: string
  totalSize?: number
  uploadedSize?: number
  size?: number
}

export interface IFileUploadState {
  hash: string
  message: string
  exists: boolean
  existsList: string[] // 已上传切片列表
  fileList: IUploadFile[] // 已上传文件列表
}
