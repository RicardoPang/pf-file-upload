const fse = require('fs-extra')
const path = require('path')

exports.isValidString = (s) => typeof s === 'string' && s.length > 0

exports.isPositiveInter = (s) => typeof s === 'number' && s >= 0 && s % 1 === 0

exports.isUndefined = (s) => typeof s === 'undefined'

// 大文件存储目录
const UPLOAD_DIR = path.resolve(__dirname, '..', 'target')
exports.UPLOAD_DIR = UPLOAD_DIR

// 提取后缀名
exports.extractExt = (filename: string): string =>
  filename.slice(filename.lastIndexOf('.'), filename.length)

// 返回已经上传切片名列表
exports.getUploadedList = async (fileHash: string) =>
  fse.existsSync(getChunkDir(fileHash))
    ? await fse.readdir(getChunkDir(fileHash))
    : []

// 创建临时文件夹用于临时存储 chunk
const getChunkDir = (fileHash: string): string =>
  path.resolve(UPLOAD_DIR, `chunkDir_${fileHash}`)
exports.getChunkDir = getChunkDir
