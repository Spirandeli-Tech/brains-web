import { ApiClient } from '../api-client'
import type { UserData } from '../auth/types'
import type {
  IUsersClient,
  UpdateProfilePayload,
  UserPreferencesData,
  UpdatePreferencesPayload,
} from './types'

export class UsersClient implements IUsersClient {
  private client: ApiClient

  constructor() {
    this.client = new ApiClient()
  }

  async listUsers(): Promise<UserData[]> {
    return this.client.get<UserData[]>('/users')
  }

  async getMe(): Promise<UserData> {
    return this.client.get<UserData>('/users/me')
  }

  async updateMe(data: UpdateProfilePayload): Promise<UserData> {
    return this.client.put<UserData>('/users/me', data)
  }

  async getPreferences(): Promise<UserPreferencesData> {
    return this.client.get<UserPreferencesData>('/users/me/preferences')
  }

  async updatePreferences(data: UpdatePreferencesPayload): Promise<UserPreferencesData> {
    return this.client.put<UserPreferencesData>('/users/me/preferences', data)
  }
}
