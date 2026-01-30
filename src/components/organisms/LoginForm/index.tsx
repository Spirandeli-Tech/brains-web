import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import { Logo, Button, Checkbox } from '@/components/atoms'
import { FormField } from '@/components/molecules'

export interface LoginFormData {
  email: string
  password: string
  remember: boolean
}

export interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false,
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    const { checked, name } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit?.(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <Logo className="mb-6" />
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Log In</h1>
      <p className="text-gray-500 mb-6">Enter your credentials to access your account</p>

      <form onSubmit={handleSubmit}>
        <FormField
          label="Username or Email Address"
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

        <div className="mb-6">
          <Checkbox
            name="remember"
            checked={formData.remember}
            onChange={handleCheckboxChange}
          >
            Remember me
          </Checkbox>
        </div>

        <Button type="primary" htmlType="submit" block loading={loading}>
          Log in
        </Button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-6">
        Copyright © Brains {new Date().getFullYear()}
      </p>
    </div>
  )
}
