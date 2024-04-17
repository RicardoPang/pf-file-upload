export interface FileSlice {
  chunk: Blob
  size: number
  progress?: number
}
