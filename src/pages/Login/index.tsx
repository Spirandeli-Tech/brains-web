import { AuthLayout, LoginForm } from '@/components'
import type { LoginFormData } from '@/components/organisms/LoginForm'

export function LoginPage() {
  const handleLogin = async (data: LoginFormData) => {
    console.log('Login data:', data)
    // TODO: Implement actual login logic
    // navigate('/dashboard')
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  )
}
