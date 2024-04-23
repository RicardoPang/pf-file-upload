import { type Context } from 'koa'
import {
  type UploadedFileControllerParams,
  type UploadedFileControllerResponse,
  type VefiryFileControllerParams,
  type VefiryFileControllerResponse
} from '../utils/types'
import fileSizesStore from '../utils/fileSizesStore'
import { HttpError, HttpStatus } from '../utils/http-error'
import {
  UPLOAD_DIR,
  extractExt,
  getChunkDir,
  getUploadedList,
  isValidString
} from '../utils'
import { IMiddleware } from 'koa-router'
import { Controller } from '../controller'

const path = require('path')
const fse = require('fs-extra')

const fn_verify: IMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  const { filename, fileHash } = ctx.request.body as VefiryFileControllerParams
  if (!isValidString(fileHash)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'fileHash 不能为空')
  }
  if (!isValidString(filename)) {
    throw new HttpError(HttpStatus.PARAMS_ERROR, 'filename 不能为空')
  }
  const ext = extractExt(filename!)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  let isExist = false
  let existsList: string[] = []
  if (fse.existsSync(filePath)) {
    isExist = true
  } else {
    existsList = await getUploadedList(fileHash!)
  }
  ctx.body = {
    code: 0,
    data: { exists: isExist, existsList: existsList }
  } satisfies VefiryFileControllerResponse

  await next()
}

// 获取所有已上传文件的接口
const fn_getFiles: IMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
): Promise<void> => {
  const files = await fse.readdir(UPLOAD_DIR).catch(() => [])
  const fileListPromises = files.map(async (file) => {
    const filePath = path.resolve(UPLOAD_DIR, file)
    const stat = fse.statSync(filePath)
    const ext = extractExt(file)
    let fileHash = ''
    let size = stat.size
    if (file.includes('chunkDir_')) {
      fileHash = file.slice('chunkDir_'.length)
      const chunkDir = getChunkDir(fileHash)
      const chunks = await fse.readdir(chunkDir)
      size = chunks.reduce((totalSize, chunk) => {
        const chunkPath = path.resolve(chunkDir, chunk)
        const stat = fse.statSync(chunkPath)
        return totalSize + stat.size
      }, 0)
    } else {
      fileHash = file.slice(0, file.length - ext.length)
    }
    const total = await fileSizesStore.getFileSize(fileHash)
    return {
      name: file,
      uploadedSize: size,
      totalSize: total,
      time: stat.mtime.toISOString(),
      hash: fileHash
    } as UploadedFileControllerParams
  })
  const fileList = await Promise.all(fileListPromises)
  ctx.body = {
    code: 0,
    data: { files: fileList }
  } satisfies UploadedFileControllerResponse

  await next()
}

const controllers: Controller[] = [
  {
    method: 'POST',
    path: '/api/verify',
    fn: fn_verify
  },
  {
    method: 'GET',
    path: '/api/files',
    fn: fn_getFiles
  }
]

export default controllers
