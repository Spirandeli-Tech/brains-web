import { useEffect, useState, useRef, ReactNode, FC, useContext } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { authClient, type UserData } from '@/lib/clients/auth'
import { AuthContext } from './auth-context'
import type { AuthUser, AuthContextType, SignUpData } from './types'
import { STORAGE_KEYS } from '@/constants/storage-keys'

interface AuthProviderProps {
  children: ReactNode
}

const mapFirebaseUser = (firebaseUser: User): AuthUser => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  firstName: null,
  lastName: null,
  role: null,
})

const mapBackendUser = (backendUser: UserData): AuthUser => ({
  id: String(backendUser.id),
  email: backendUser.email,
  displayName: `${backendUser.first_name} ${backendUser.last_name}`,
  photoURL: null,
  firstName: backendUser.first_name,
  lastName: backendUser.last_name,
  role: backendUser.role?.name ?? null,
})

const saveUserToStorage = (user: AuthUser | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
  }
}

const saveTokenToStorage = (token: string | null) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}

const getUserFromStorage = (): AuthUser | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER)
  return stored ? JSON.parse(stored) : null
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(getUserFromStorage())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const skipAuthStateSync = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (skipAuthStateSync.current) {
        setLoading(false)
        return
      }

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken()
          saveTokenToStorage(idToken)

          const backendUser = await authClient.login({ firebase_token: idToken })
          const mappedUser = mapBackendUser(backendUser)
          setUser(mappedUser)
          saveUserToStorage(mappedUser)
        } catch {
          // Backend login failed (user might not be registered yet, or backend is down)
          const mappedUser = mapFirebaseUser(firebaseUser)
          setUser(mappedUser)
          saveUserToStorage(mappedUser)
        }
      } else {
        setUser(null)
        saveUserToStorage(null)
        saveTokenToStorage(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    setError(null)
    skipAuthStateSync.current = true
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      saveTokenToStorage(idToken)

      const backendUser = await authClient.login({ firebase_token: idToken })
      const mappedUser = mapBackendUser(backendUser)
      setUser(mappedUser)
      saveUserToStorage(mappedUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      throw err
    } finally {
      skipAuthStateSync.current = false
    }
  }

  const signUpWithEmail = async ({ email, password, firstName, lastName }: SignUpData) => {
    setError(null)
    skipAuthStateSync.current = true
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      saveTokenToStorage(idToken)

      const backendUser = await authClient.register({
        firebase_token: idToken,
        first_name: firstName,
        last_name: lastName,
      })

      const mappedUser = mapBackendUser(backendUser)
      setUser(mappedUser)
      saveUserToStorage(mappedUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      setError(errorMessage)
      throw err
    } finally {
      skipAuthStateSync.current = false
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      await firebaseSignOut(auth)
      setUser(null)
      saveUserToStorage(null)
      saveTokenToStorage(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(errorMessage)
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    authenticated: !!user,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
