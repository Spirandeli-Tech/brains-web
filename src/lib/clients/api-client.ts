import { auth } from '@/lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async getAuthToken(): Promise<string | null> {
    const currentUser = auth.currentUser
    if (!currentUser) return null
    return currentUser.getIdToken()
  }

  private async buildHeaders(requireAuth: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (requireAuth) {
      const token = await this.getAuthToken()
      if (!token) {
        throw new ApiError('Not authenticated', 401)
      }
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.detail || `Request failed with status ${response.status}`,
        response.status,
        errorData.detail,
      )
    }
    return response.json()
  }

  async get<T>(endpoint: string, requireAuth = true): Promise<T> {
    const headers = await this.buildHeaders(requireAuth)
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'GET', headers })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, body: unknown, requireAuth = false): Promise<T> {
    const headers = await this.buildHeaders(requireAuth)
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, body: unknown, requireAuth = true): Promise<T> {
    const headers = await this.buildHeaders(requireAuth)
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, body: unknown, requireAuth = true): Promise<T> {
    const headers = await this.buildHeaders(requireAuth)
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string, requireAuth = true): Promise<T> {
    const headers = await this.buildHeaders(requireAuth)
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'DELETE', headers })
    return this.handleResponse<T>(response)
  }
}
