export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  authenticated: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}
