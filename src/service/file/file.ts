import pfRequest from '..'
import type { IMerge, IUpload, IVerify } from '@/types/file'

export function upload(file: IUpload, signal?: AbortSignal) {
  const {
    formData: { chunk, hash, fileHash, filename, size }
  } = file
  const formData = new FormData()
  formData.append('chunk', chunk)
  formData.append('hash', hash)
  formData.append('fileHash', fileHash)
  formData.append('filename', filename)
  formData.append('size', String(size))
  return pfRequest.post({
    url: '/api/upload',
    data: file.formData,
    headers: {
      'content-type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent
      const percent = Math.floor((loaded / (total || 0)) * 100)
      file.chunks[file.chunks.indexOf(file.chunks[file.index])].progress =
        percent
      const totalProgress =
        file.chunks.reduce((sum, chunk) => sum + (chunk.progress || 0), 0) /
        file.chunks.length
      file.onProgress(Number(totalProgress.toFixed(2)))
    },
    signal
  })
}

export function verify(file: IVerify) {
  return pfRequest.post({
    url: '/api/verify',
    data: file
  })
}

export function merge(file: IMerge) {
  return pfRequest.post({
    url: '/api/merge',
    data: file
  })
}

export function getFiles() {
  return pfRequest.get({
    url: '/api/files'
  })
}
