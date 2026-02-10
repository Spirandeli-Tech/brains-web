import type { UserData } from '../auth/types'

export interface IUsersClient {
  listUsers(): Promise<UserData[]>
}
