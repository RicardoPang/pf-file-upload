import type {
  IFileSlice,
  IMergeChunksControllerParams,
  IUploadChunkControllerParams,
  IVefiryFileControllerParams
} from '@/types/file'
import pfRequest from '..'

export function upload(
  params: IUploadChunkControllerParams,
  onProgress: (progress: number) => void,
  chunks: IFileSlice[],
  index: number,
  signal?: AbortSignal
) {
  const { chunk, hash, fileHash, filename, size } = params
  const formData = new FormData()
  formData.append('chunk', chunk)
  formData.append('hash', hash)
  formData.append('fileHash', fileHash)
  formData.append('filename', filename)
  formData.append('size', String(size))

  return pfRequest.post({
    url: '/api/upload',
    data: formData,
    headers: {
      'content-type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent
      const percent = Math.floor((loaded / (total || 0)) * 100)
      chunks[chunks.indexOf(chunks[index])].progress = percent
      const totalProgress =
        chunks.reduce((sum, chunk) => sum + (chunk.progress || 0), 0) /
        chunks.length
      onProgress(Number(totalProgress.toFixed(2)))
    },
    signal
  })
}

export function verify(params: IVefiryFileControllerParams) {
  return pfRequest.post({
    url: '/api/verify',
    data: params
  })
}

export function merge(params: IMergeChunksControllerParams) {
  return pfRequest.post({
    url: '/api/merge',
    data: params
  })
}

export function getFiles() {
  return pfRequest.get({
    url: '/api/files'
  })
}
