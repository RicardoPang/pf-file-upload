import type {
  GetFileControllerResponse,
  IMergeChunksControllerParams,
  IUploadChunkControllerParams,
  IVefiryFileControllerParams,
  MergeChunksControllerResponse,
  UploadChunkControllerResponse,
  VefiryFileControllerResponse
} from '@/types/file'
import pfRequest from '..'

export function upload(
  params: IUploadChunkControllerParams,
  onTick: (index: number, percent: number) => void,
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
      onTick(index, percent)
    },
    signal
  }) as Promise<UploadChunkControllerResponse>
}

export function verify(params: IVefiryFileControllerParams) {
  return pfRequest.post({
    url: '/api/verify',
    data: params
  }) as Promise<VefiryFileControllerResponse>
}

export function merge(params: IMergeChunksControllerParams) {
  return pfRequest.post({
    url: '/api/merge',
    data: params
  }) as Promise<MergeChunksControllerResponse>
}

export function getFiles() {
  return pfRequest.get({
    url: '/api/files'
  }) as Promise<GetFileControllerResponse>
}
