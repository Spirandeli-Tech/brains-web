export interface RegisterPayload {
  firebase_token: string
  first_name: string
  last_name: string
}

export interface LoginPayload {
  firebase_token: string
}

export interface RoleData {
  id: string
  name: string
  description: string | null
}

export interface UserData {
  id: string
  email: string
  first_name: string
  last_name: string
  firebase_id: string
  last_login: string | null
  created_at: string
  role: RoleData | null
}

export interface IAuthClient {
  register(payload: RegisterPayload): Promise<UserData>
  login(payload: LoginPayload): Promise<UserData>
}
