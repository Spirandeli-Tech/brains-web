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
  const { signInWithEmail, signUpWithEmail } = useAuth()
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

