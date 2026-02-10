import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { message } from 'antd'
import { useAuth } from '@/context/auth'
import { Logo, Button, Checkbox } from '@/components/atoms'
import { FormField } from '@/components/molecules'

export interface LoginFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  remember: boolean
}

export interface LoginFormProps {
  // Props can be extended here if needed
}

export function LoginForm(_props?: LoginFormProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    remember: false,
  })
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    const { checked } = e.target
    const name = e.target.name as string
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      message.success('Logged in successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed'
      message.error(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        })
        message.success('Account created successfully!')
      } else {
        await signInWithEmail(formData.email, formData.password)
        message.success('Logged in successfully!')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <Logo className="mb-6" />

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isSignUp ? 'Create Account' : 'Log In'}
      </h1>
      <p className="text-gray-500 mb-6">
        {isSignUp
          ? 'Create a new account to get started'
          : 'Enter your credentials to access your account'}
      </p>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <FormField
              label="First Name"
              name="firstName"
              type="text"
              required
              placeholder="John"
              value={formData.firstName}
              onChange={handleInputChange}
            />

            <FormField
              label="Last Name"
              name="lastName"
              type="text"
              required
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleInputChange}
            />
          </>
        )}

        <FormField
          label="Email Address"
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          value={formData.email}
          onChange={handleInputChange}
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          required
          placeholder="••••••••••••"
          value={formData.password}
          onChange={handleInputChange}
        />

        {!isSignUp && (
          <div className="mb-6">
            <Checkbox
              name="remember"
              checked={formData.remember}
              onChange={handleCheckboxChange}
            >
              Remember me
            </Checkbox>
          </div>
        )}

        <Button type="primary" htmlType="submit" block loading={loading}>
          {isSignUp ? 'Sign Up' : 'Log in'}
        </Button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300" />
        <span className="px-4 text-sm text-gray-400">ou</span>
        <div className="flex-1 border-t border-gray-300" />
      </div>

      <Button
        block
        loading={googleLoading}
        onClick={handleGoogleSignIn}
        icon={
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        }
        className="flex items-center justify-center gap-2 border-gray-300"
      >
        Sign in with Google
      </Button>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>

      <p className="text-center text-gray-400 text-sm mt-6">
        Copyright © Brains {new Date().getFullYear()}
      </p>
    </div>
  )
}

