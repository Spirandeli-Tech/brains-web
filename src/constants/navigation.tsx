import { AuditOutlined, BankOutlined, BulbOutlined, ClockCircleOutlined, CodeOutlined, CommentOutlined, DashboardOutlined, DollarOutlined, EyeOutlined, FileTextOutlined, PlayCircleOutlined, RobotOutlined, TagsOutlined, ThunderboltOutlined, ToolOutlined, TeamOutlined, UserOutlined, VideoCameraOutlined, WalletOutlined } from '@ant-design/icons'

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
    label: 'Insights for Today',
    icon: <BulbOutlined />,
    path: '/insights',
  },
  {
    label: 'Content',
    icon: <VideoCameraOutlined />,
    path: '/content/videos',
    children: [
      {
        label: 'Videos',
        icon: <PlayCircleOutlined />,
        path: '/content/videos',
      },
      {
        label: 'Ideas',
        icon: <BulbOutlined />,
        path: '/content/ideas',
      },
    ],
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
    label: 'Code Review',
    icon: <AuditOutlined />,
    path: '/code-review',
  },
  {
    label: 'Address PR Comments',
    icon: <CommentOutlined />,
    path: '/address-pr-comments',
  },
  {
    label: 'Automations',
    icon: <ClockCircleOutlined />,
    path: '/automations',
  },
  {
    label: 'Runner',
    icon: <RobotOutlined />,
    path: '/runner',
  },
  {
    label: 'Watchers',
    icon: <EyeOutlined />,
    path: '/watchers',
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
    adminOnly: true,
  },
]
