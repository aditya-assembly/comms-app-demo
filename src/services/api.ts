import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError, type AxiosResponse } from 'axios'
import { API_CONFIG } from '@/config/api'

// Lazy reference to auth store — avoids direct circular import while still
// allowing us to call logout() on 401. Set once app initializes.
let _authLogout: ((reason: string) => Promise<void>) | null = null
export function registerAuthLogout(fn: (reason: string) => Promise<void>) {
  _authLogout = fn
}

const API_URL = import.meta.env.VITE_API_URL as string | undefined
const API_VERSION = API_CONFIG.API_VERSION

const getApiBaseUrl = (): string => {
  if (!API_URL || API_URL.trim() === '') return `/${API_VERSION}`
  return `${API_URL.replace(/\/$/, '')}/${API_VERSION}`
}

class ApiClient {
  public readonly baseURL: string
  private readonly axiosInstance: AxiosInstance

  /** Exposed for streaming fetch URLs that bypass {@link request}. */
  getBaseUrl(): string {
    return this.baseURL
  }

  constructor() {
    this.baseURL = getApiBaseUrl()
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.REQUEST.TIMEOUT,
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    })

    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (API_CONFIG.FEATURES.ENABLE_DEBUG_LOGGING) {
          console.debug('[API Request]', config.method?.toUpperCase(), config.url)
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status
        const data = error.response?.data as { message?: string } | undefined
        const serverMessage = data?.message?.trim()

        if (status === API_CONFIG.STATUS_CODES.UNAUTHORIZED) {
          const isLogout = error.config?.url?.includes(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
          const isSessionCheck = error.config?.url?.includes(API_CONFIG.ENDPOINTS.COMMS_APP.INFO)
          if (!isLogout && !isSessionCheck && _authLogout) {
            void _authLogout('UNAUTHORIZED')
          }
        }

        const enhancedError = error as AxiosError & { retryable: boolean }
        if (serverMessage) enhancedError.message = serverMessage
        throw enhancedError
      }
    )
  }

  async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    const response = await this.axiosInstance.request<T>({ url: endpoint, ...options })
    return response.data
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', data })
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', data })
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', data })
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /** POST returning full Axios response (e.g. session event search pagination headers). */
  async postWithResponse<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(endpoint, data, config)
  }
}

export const apiClient = new ApiClient()
