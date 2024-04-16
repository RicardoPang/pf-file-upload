// 导入脚本
import SparkMD5 from 'spark-md5'
import { type FileSlice } from './file'

self.onmessage = async (e) => {
  // 接收主线程的通知
  const { chunks } = e.data as { chunks: FileSlice[] }
  const spark = new SparkMD5.ArrayBuffer()
  let progress = 0
  let count = 0

  const loadNext = (index: number) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(chunks[index].chunk)
    reader.onload = (e) => {
      count++
      spark.append(e.target?.result as ArrayBuffer)
      if (count === chunks.length) {
        self.postMessage({
          progress: 100,
          hash: spark.end()
        })
        self.close()
      } else {
        progress += 100 / chunks.length
        self.postMessage({
          progress
        })
        loadNext(count)
      }
    }
  }

  loadNext(0)
}
