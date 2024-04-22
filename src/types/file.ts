import type { FileSlice } from '@/utils/file'

export interface IUpload {
  formData: FormData
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
