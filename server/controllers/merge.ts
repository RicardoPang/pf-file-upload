const {
  isValidString,
  extractExt,
  UPLOAD_DIR,
  getChunkDir
} = require('../utils')
const { HttpStatus, HttpError } = require('../utils/http-error')
import type {
  MergeChunksControllerParams,
  MergeChunksControllerResponse
} from '../utils/types'

const path = require('path')
const fse = require('fs-extra')

// 写入文件流
const pipeStream = (
  filePath: string,
  writeStream: NodeJS.WritableStream
): Promise<boolean> => {
  return new Promise((resolve) => {
    const readStream = fse.createReadStream(filePath)
    readStream.on('end', () => {
      fse.unlinkSync(filePath)
      resolve(true)
    })
    readStream.pipe(writeStream)
  })
}

const mergeFileChunk = async (
  filePath: string,
  fileHash: string,
  size: number = 10485760
) => {
  const chunkDir = getChunkDir(fileHash)
  const chunkPaths = await fse.readdir(chunkDir)
  // 切片排序
  chunkPaths.sort((a, b) => {
    return a.split('-')[1] - b.split('-')[1]
  })
  // 写入文件
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath),
        // 根据 size 在指定位置创建可写流
        fse.createWriteStream(filePath, {
          start: index * size
        })
      )
    )
  )
  // 合并后删除保存切片的目录
  fse.rmdirSync(chunkDir)
}

const fn_merge = async (ctx) => {
  const { filename, fileHash, size } = ctx.request
    .body as MergeChunksControllerParams
  if (!isValidString(fileHash)) {
    throw new HttpError(
      HttpStatus.PARAMS_ERROR,
      'fileHash 不能为空: ',
      fileHash
    )
  }
  if (!isValidString(filename)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'filename 不能为空')
  }
  const ext = extractExt(filename!)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  await mergeFileChunk(filePath, fileHash!, size)
  ctx.body = {
    code: 0,
    data: { hash: fileHash!, message: 'file merged success' }
  } satisfies MergeChunksControllerResponse
}

module.exports = {
  'POST /api/merge': fn_merge
}
