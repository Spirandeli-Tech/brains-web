import { AuditOutlined, BankOutlined, CodeOutlined, DashboardOutlined, DollarOutlined, FileTextOutlined, TagsOutlined, ThunderboltOutlined, ToolOutlined, TeamOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons'

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
    label: 'Contracts',
    icon: <AuditOutlined />,
    path: '/invoices/contracts',
    children: [
      {
        label: 'Contracts',
        icon: <AuditOutlined />,
        path: '/invoices/contracts',
      },
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
    label: 'Productivity',
    icon: <CodeOutlined />,
    path: '/productivity',
    children: [
      {
        label: 'By Connection',
        icon: <CodeOutlined />,
        path: '/productivity',
      },
      {
        label: 'By User',
        icon: <UserOutlined />,
        path: '/productivity/user',
      },
    ],
  },
  {
    label: 'Implementations',
    icon: <ThunderboltOutlined />,
    path: '/implementations',
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
    adminOnly: true,
  },
]
