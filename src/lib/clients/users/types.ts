import type { UserData } from '../auth/types'

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  photo_url?: string | null
}

export interface UserPreferencesData {
  id: string
  user_id: string
  report_theme_color: string | null
  report_header_image_url: string | null
  default_currency: string | null
  created_at: string
  updated_at: string
}

export interface UpdatePreferencesPayload {
  report_theme_color?: string
  report_header_image_url?: string | null
  default_currency?: string
}

export interface IUsersClient {
  listUsers(): Promise<UserData[]>
  getMe(): Promise<UserData>
  updateMe(data: UpdateProfilePayload): Promise<UserData>
  getPreferences(): Promise<UserPreferencesData>
  updatePreferences(data: UpdatePreferencesPayload): Promise<UserPreferencesData>
}
