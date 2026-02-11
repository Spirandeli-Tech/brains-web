import { BankOutlined, DashboardOutlined, FileTextOutlined, ToolOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'

export interface NavChild {
  label: string
  icon: React.ReactNode
  path: string
}

export interface NavOption {
  label: string
  icon: React.ReactNode
  path: string
  children?: NavChild[]
}

export const NAV_OPTIONS: NavOption[] = [
  {
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    path: '/dashboard',
  },
  {
    label: 'Invoices',
    icon: <FileTextOutlined />,
    path: '/invoices',
    children: [
      {
        label: 'Invoices',
        icon: <FileTextOutlined />,
        path: '/invoices',
      },
      {
        label: 'Customers',
        icon: <UserOutlined />,
        path: '/invoices/customers',
      },
      {
        label: 'Bank Accounts',
        icon: <BankOutlined />,
        path: '/invoices/bank-accounts',
      },
      {
        label: 'Services',
        icon: <ToolOutlined />,
        path: '/invoices/services',
      },
    ],
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
  },
]
