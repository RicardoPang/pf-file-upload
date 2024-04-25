import fs from 'fs/promises'
import { UPLOAD_DIR } from '.'

export class FileSizesStore {
  // 全局唯一，状态共享：存储所有文件的大小
  private static instance: FileSizesStore
  private fileSizes: { [fileHash: string]: number } = {}

  private constructor() {}

  static getInstance(): FileSizesStore {
    if (!FileSizesStore.instance) {
      FileSizesStore.instance = new FileSizesStore()
    }
    return FileSizesStore.instance
  }

  async storeFileSize(fileHash: string, size: number): Promise<void> {
    this.fileSizes[fileHash] = size

    try {
      await fs.access(UPLOAD_DIR)
      await fs.writeFile(
        `${UPLOAD_DIR}/fileSizes.json`,
        JSON.stringify(this.fileSizes, null, 2)
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        // 文件夹不存在，尝试创建
        await fs.mkdir(UPLOAD_DIR, { recursive: true })
        await fs.writeFile(
          `${UPLOAD_DIR}/fileSizes.json`,
          JSON.stringify(this.fileSizes, null, 2)
        )
      } else {
        throw error
      }
    }
  }

  async getFileSize(fileHash: string): Promise<number | undefined> {
    if (Object.keys(this.fileSizes).length === 0) {
      try {
        await fs.access(`${UPLOAD_DIR}/fileSizes.json`)
        const content = await fs.readFile(
          `${UPLOAD_DIR}/fileSizes.json`,
          'utf-8'
        )
        // 记录文件大小是为了计算进度
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
