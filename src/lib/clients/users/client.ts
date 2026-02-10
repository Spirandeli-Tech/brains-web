import { ApiClient } from '../api-client'
import type { UserData } from '../auth/types'
import type { IUsersClient } from './types'

export class UsersClient implements IUsersClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listUsers(): Promise<UserData[]> {
    return this.client.get<UserData[]>('/users')
  }
}
