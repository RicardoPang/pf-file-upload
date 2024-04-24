import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

interface CustomError {
  message: string
  code: number
}

// 针对AxiosRequestConfig配置进行扩展
export interface PFInterceptors<T extends AxiosResponse = AxiosResponse> {
  requestSuccessFn?: (config: AxiosRequestConfig) => AxiosRequestConfig
  requestFailureFn?: (err: AxiosError) => CustomError
  responseSuccessFn?: (res: T) => T
  responseFailureFn?: (err: AxiosError) => CustomError
}

export interface PFRequestConfig<T extends AxiosResponse = AxiosResponse>
  extends AxiosRequestConfig {
  interceptors?: PFInterceptors<T>
}
