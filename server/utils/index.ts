import fse from 'fs-extra'
import path from 'path'

export const isValidString = (s) => typeof s === 'string' && s.length > 0

export const isPositiveInter = (s) =>
  typeof s === 'number' && s >= 0 && s % 1 === 0

export const isUndefined = (s) => typeof s === 'undefined'

// 大文件存储目录
export const UPLOAD_DIR = path.resolve(__dirname, '..', 'target')

// 提取后缀名
export const extractExt = (filename: string): string =>
  filename.slice(filename.lastIndexOf('.'), filename.length)

// 返回已经上传切片名列表
export const getUploadedList = async (fileHash: string) =>
  fse.existsSync(getChunkDir(fileHash))
    ? await fse.readdir(getChunkDir(fileHash))
    : []

// 创建临时文件夹用于临时存储 chunk
export const getChunkDir = (fileHash: string): string =>
  path.resolve(UPLOAD_DIR, `chunkDir_${fileHash}`)
