const {
  isValidString,
  extractExt,
  UPLOAD_DIR,
  getUploadedList,
  getChunkDir
} = require('../utils')
const { HttpStatus, HttpError } = require('../utils/http-error')
import { Context } from 'vm'
import {
  fileSizes,
  type UploadedFileControllerParams,
  type UploadedFileControllerResponse,
  type VefiryFileControllerParams,
  type VefiryFileControllerResponse
} from '../utils/types'

const path = require('path')
const fse = require('fs-extra')

const fn_verify = async (ctx) => {
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
    existsList = await getUploadedList(fileHash)
  }
  ctx.body = {
    code: 0,
    data: { exists: isExist, existsList: existsList }
  } satisfies VefiryFileControllerResponse
}

const getTotalSizeByFileHash = async (fileHash: string): Promise<number> => {
  return fileSizes[fileHash] || 0
}

// 获取所有已上传文件的接口
const fn_getFiles = async (ctx: Context): Promise<void> => {
  const files = await fse.readdir(UPLOAD_DIR).catch(() => [])
  const fileListPromises = files.map(async (file) => {
    const filePath = path.resolve(UPLOAD_DIR, file)
    const stat = fse.statSync(filePath)
    const ext = extractExt(file)
    let fileHash = ''
    let size = stat.size
    if (file.includes('chunkDir_')) {
      fileHash = file.slice(9)
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
    const total = await getTotalSizeByFileHash(fileHash)
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
}

module.exports = {
  'GET /api/files': fn_getFiles,
  'POST /api/verify': fn_verify
}
