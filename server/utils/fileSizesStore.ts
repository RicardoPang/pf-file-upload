export class FileSizesStore {
  private static instance: FileSizesStore
  private fileSizes: { [fileHash: string]: number } = {}

  private constructor() {}

  static getInstance(): FileSizesStore {
    if (!FileSizesStore.instance) {
      FileSizesStore.instance = new FileSizesStore()
    }
    return FileSizesStore.instance
  }

  storeFileSize(fileHash: string, size: number): void {
    this.fileSizes[fileHash] = size
  }

  getFileSize(fileHash: string): number | undefined {
    return this.fileSizes[fileHash]
  }
}

export default FileSizesStore.getInstance()
