import { IMiddleware } from 'koa-router'
import { UPLOAD_DIR, extractExt, getChunkDir, isValidString } from '../utils'
import fileSizesStore from '../utils/fileSizesStore'
import { HttpError, HttpStatus } from '../utils/http-error'
import {
  type UploadChunkControllerParams,
  type UploadChunkControllerResponse
} from '../utils/types'
import path from 'path'
import fse from 'fs-extra'
import { Controller } from '../controller'
import { Context } from 'koa'
import koaBody from 'koa-body'

const fnUpload: IMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  const { filename, fileHash, hash, size } = ctx.request.body

  const chunkFile = ctx.request.files?.chunk
  if (!chunkFile || Array.isArray(chunkFile)) {
    throw new Error(`无效的块文件参数`)
  }
  const chunk = await fse.readFile(chunkFile.filepath)
  if (!isValidString(fileHash)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'fileHash 不能为空: ')
  }
  if (isValidString(chunk)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'chunk 不能为空')
  }
  if (!isValidString(filename)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'filename 不能为空')
  }
  const params = {
    filename,
    fileHash,
    hash,
    chunk,
    size
  } as UploadChunkControllerParams

  fileSizesStore.storeFileSize(fileHash, size)
  const ext = extractExt(params.filename!)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  const chunkDir = getChunkDir(params.fileHash!)
  const chunkPath = path.resolve(chunkDir, params.hash!)
  // 切片目录不存在，创建切片目录
  if (!(await fse.pathExists(chunkDir))) {
    await fse.mkdir(chunkDir, { recursive: true })
  }

  // 文件存在直接返回
  if (await fse.pathExists(filePath)) {
    ctx.body = {
      code: 1,
      data: { hash: fileHash!, message: 'file exist' }
    } satisfies UploadChunkControllerResponse
    return
  }
  // 切片存在直接返回
  if (await fse.pathExists(chunkPath)) {
    ctx.body = {
      code: 2,
      data: { hash: fileHash!, message: 'chunk exist' }
    } satisfies UploadChunkControllerResponse
    return
  }
  await fse.move(chunkFile.filepath, `${chunkDir}/${hash}`)
  ctx.body = {
    code: 0,
    data: { hash: params.fileHash!, message: 'received file chunk' }
  } satisfies UploadChunkControllerResponse

  await next()
}

const controllers: Controller[] = [
  {
    method: 'POST',
    path: '/api/upload',
    fn: fnUpload,
    middleware: [koaBody({ multipart: true })]
  }
]

export default controllers
