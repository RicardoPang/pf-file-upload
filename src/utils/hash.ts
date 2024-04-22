// 导入脚本
import SparkMD5 from 'spark-md5'

const ctx: Worker = self as any
ctx.onmessage = (e) => {
  // 接收主线程的通知
  const { chunks } = e.data
  const blob = new Blob(chunks)
  const spark = new SparkMD5.ArrayBuffer()
  const reader = new FileReader()

  reader.onload = (e) => {
    spark.append(e.target?.result as ArrayBuffer)
    const hash = spark.end()
    ctx.postMessage({
      progress: 100,
      hash
    })
  }
  reader.onerror = (e: any) => {
    ctx.postMessage({
      error: e.message
    })
  }
  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const progress = (e.loaded / e.total) * 100
      ctx.postMessage({
        progress
      })
    }
  }
  // 读取Blob对象的内容
  reader.readAsArrayBuffer(blob)
}
ctx.onerror = (e) => {
  ctx.postMessage({
    error: e.message
  })
}
