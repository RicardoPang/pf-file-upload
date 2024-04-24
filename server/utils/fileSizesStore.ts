import fs from 'fs/promises'
import { UPLOAD_DIR } from '.'

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
    fs.access(UPLOAD_DIR)
      .then(() => {
        fs.writeFile(
          `${UPLOAD_DIR}/fileSizes.json`,
          JSON.stringify(this.fileSizes, null, 2)
        )
      })
      .catch(() => {
        fs.mkdir(UPLOAD_DIR, { recursive: true }).then(() => {
          fs.writeFile(
            `${UPLOAD_DIR}/fileSizes.json`,
            JSON.stringify(this.fileSizes, null, 2)
          )
        })
      })
  }

  async getFileSize(fileHash: string): Promise<number | undefined> {
    if (Object.keys(this.fileSizes).length === 0) {
      try {
        const content = await fs.readFile(
          `${UPLOAD_DIR}/fileSizes.json`,
          'utf-8'
        )
        this.fileSizes = JSON.parse(content)
      } catch (error) {
        if (error instanceof Error && error.message.includes('ENOENT')) {
          // 文件不存在，忽略错误，因为这是正常情况
        } else {
          throw error
        }
      }
    }

    return this.fileSizes[fileHash]
  }
}

export default FileSizesStore.getInstance()
