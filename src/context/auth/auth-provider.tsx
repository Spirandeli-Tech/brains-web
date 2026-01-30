import { useEffect, useState, ReactNode, FC, useContext } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthContext } from './auth-context'
import type { AuthUser, AuthContextType } from './types'
import { STORAGE_KEYS } from '@/constants/storage-keys'

interface AuthProviderProps {
  children: ReactNode
}

const mapFirebaseUser = (firebaseUser: User): AuthUser => ({
  id: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
})

const saveUserToStorage = (user: AuthUser | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser = mapFirebaseUser(firebaseUser)
        setUser(mappedUser)
        saveUserToStorage(mappedUser)
      } else {
        setUser(null)
        saveUserToStorage(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      throw err
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      await firebaseSignOut(auth)
      setUser(null)
      saveUserToStorage(null)
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
