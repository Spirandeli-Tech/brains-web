import { ApiClient } from '../api-client'
import type { IAuthClient, RegisterPayload, LoginPayload, UserData } from './types'

export class AuthClient implements IAuthClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async register(payload: RegisterPayload): Promise<UserData> {
    return this.client.post<UserData>('/auth/register', payload)
  }

  async login(payload: LoginPayload): Promise<UserData> {
    return this.client.post<UserData>('/auth/login', payload)
  }
}
