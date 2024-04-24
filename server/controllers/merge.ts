import { UPLOAD_DIR, extractExt, getChunkDir, isValidString } from '../utils'
import { HttpError, HttpStatus } from '../utils/http-error'
import type {
  MergeChunksControllerParams,
  MergeChunksControllerResponse
} from '../utils/types'
import path from 'path'
import fse from 'fs-extra'
import { IMiddleware } from 'koa-router'
import { Controller } from '../controller'
import { Context } from 'koa'

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
  size: number
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

const fnMerge: IMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  const { filename, fileHash, size } = ctx.request
    .body as MergeChunksControllerParams
  if (!isValidString(fileHash)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'fileHash 不能为空: ')
  }
  if (!isValidString(filename)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'filename 不能为空')
  }
  const ext = extractExt(filename!)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  await mergeFileChunk(filePath, fileHash!, size!)
  ctx.body = {
    code: 0,
    data: { hash: fileHash!, message: 'file merged success' }
  } satisfies MergeChunksControllerResponse

  await next()
}

const controllers: Controller[] = [
  {
    method: 'POST',
    path: '/api/merge',
    fn: fnMerge
  }
]

export default controllers
