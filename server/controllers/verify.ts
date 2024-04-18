const {
  isValidString,
  extractExt,
  UPLOAD_DIR,
  getUploadedList
} = require('../utils')
const { HttpStatus, HttpError } = require('../utils/http-error')
import type {
  VefiryFileControllerParams,
  VefiryFileControllerResponse
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

module.exports = {
  'POST /api/verify': fn_verify
}
