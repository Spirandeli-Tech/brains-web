export interface AuthUser {
  id: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  firstName: string | null
  lastName: string | null
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  authenticated: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  error: string | null
}
