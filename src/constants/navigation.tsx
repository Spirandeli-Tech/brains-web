import { BankOutlined, DashboardOutlined, DollarOutlined, FileTextOutlined, TagsOutlined, ToolOutlined, TeamOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons'

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
  adminOnly?: boolean
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
    label: 'Finance',
    icon: <DollarOutlined />,
    path: '/finance',
    children: [
      {
        label: 'Transactions',
        icon: <WalletOutlined />,
        path: '/finance',
      },
      {
        label: 'Categories',
        icon: <TagsOutlined />,
        path: '/finance/categories',
      },
      {
        label: 'Bank Balances',
        icon: <BankOutlined />,
        path: '/finance/balances',
      },
    ],
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
    adminOnly: true,
  },
]
