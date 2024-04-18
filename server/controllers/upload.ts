const {
  isValidString,
  extractExt,
  UPLOAD_DIR,
  getChunkDir
} = require('../utils')
const { HttpStatus, HttpError } = require('../utils/http-error')
import type {
  UploadChunkControllerParams,
  UploadChunkControllerReponse
} from '../utils/types'
const path = require('path')
const fse = require('fs-extra')

const fn_upload = async (ctx) => {
  const { filename, fileHash, hash } = ctx.request.body

  const chunkFile = ctx.request.files?.chunk.filepath || undefined
  if (!chunkFile || Array.isArray(chunkFile)) {
    throw new Error(`无效的块文件参数`)
  }
  const chunk = await fse.readFile(chunkFile)
  if (!isValidString(fileHash)) {
    throw new HttpError(
      HttpStatus.PARAMS_ERROR,
      'fileHash 不能为空: ',
      fileHash
    )
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
    chunk
  } as UploadChunkControllerParams
  const ext = extractExt(params.filename)
  const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
  const chunkDir = getChunkDir(params.fileHash)
  const chunkPath = path.resolve(chunkDir, params.hash)
  // 切片目录不存在，创建切片目录
  if (!fse.existsSync(chunkDir)) {
    await fse.mkdirs(chunkDir)
  }
  // 文件存在直接返回
  if (fse.existsSync(filePath)) {
    ctx.body = {
      code: 0,
      data: { hash: fileHash!, message: 'file exist' }
    } satisfies UploadChunkControllerReponse
    return
  }
  // 切片存在直接返回
  if (fse.existsSync(chunkPath)) {
    ctx.body = {
      code: 0,
      data: { hash: fileHash!, message: 'chunk exist' }
    } satisfies UploadChunkControllerReponse
    return
  }
  await fse.move(chunkFile, `${chunkDir}/${hash}`)
  ctx.body = {
    code: 0,
    data: { hash: params.fileHash!, message: 'received file chunk' }
  } satisfies UploadChunkControllerReponse
}

module.exports = {
  'POST /api/upload': fn_upload
}
