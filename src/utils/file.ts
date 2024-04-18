export interface FileSlice {
  chunk: Blob
  size: number
  hash?: string
  progress?: number
}
