import { auth } from '@/lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4242'

interface ApiOptions {
  method?: string
  body?: unknown
  requireAuth?: boolean
}

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

async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null
  return currentUser.getIdToken()
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, requireAuth = false } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (requireAuth) {
    const token = await getAuthToken()
    if (!token) {
      throw new ApiError('Not authenticated', 401)
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

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

export interface RegisterPayload {
  firebase_token: string
  first_name: string
  last_name: string
}

export interface LoginPayload {
  firebase_token: string
}

export interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  firebase_id: string
  last_login: string | null
  created_at: string
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<UserData>('/auth/register', { method: 'POST', body: payload }),

  login: (payload: LoginPayload) =>
    request<UserData>('/auth/login', { method: 'POST', body: payload }),
}

export default request
