import { Dropdown, Avatar, Input } from 'antd'
import { SearchOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Logo } from '@/components/atoms'
import { useAuth } from '@/context/auth'

export function AppHeader() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join('')

  const dropdownItems = {
    items: [
      {
        key: 'signout',
        label: 'Sign out',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleSignOut,
      },
    ],
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6">
      <div className="flex items-center">
        <Logo />
      </div>

      <div className="flex-1 max-w-lg mx-8">
        <Input
          placeholder="Search..."
          prefix={<SearchOutlined className="text-gray-400" />}
          className="rounded-lg"
        />
      </div>

      <Dropdown menu={dropdownItems} trigger={['click']} placement="bottomRight">
        <button className="flex items-center gap-3 cursor-pointer border-none bg-transparent p-1 rounded-lg hover:bg-gray-50 transition-colors">
          <Avatar
            size={36}
            className="bg-blue-600 text-white font-semibold"
            icon={!initials ? <UserOutlined /> : undefined}
          >
            {initials || undefined}
          </Avatar>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-tight m-0">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 leading-tight m-0">
              {user?.email || ''}
            </p>
          </div>
        </button>
      </Dropdown>
    </header>
  )
}
