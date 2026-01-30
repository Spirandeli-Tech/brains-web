import { ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import { useAuth } from '@/context/auth'
import { LoginPage, DashboardPage, LoadingPage } from '@/pages'

type Screen = 'loading' | 'authenticated' | 'login'

const screens: Record<Screen, () => ReactNode> = {
  loading: LoadingPage,
  authenticated: DashboardPage,
  login: LoginPage,
}

function AppContent() {
  const { loading, authenticated } = useAuth()

  const renderScreen = (): Screen => {
    if (loading) return 'loading'
    if (authenticated) return 'authenticated'
    return 'login'
  }

  const SelectedScreen = screens[renderScreen()]

  return <SelectedScreen />
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AppContent />
    </ConfigProvider>
  )
}

export default App
