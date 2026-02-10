import { DashboardOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'

export const NAV_OPTIONS = [
  {
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    label: 'Invoices',
    icon: <FileTextOutlined />,
    path: '/invoices',
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
  },
]
