import { AuditOutlined, BankOutlined, BulbOutlined, ClockCircleOutlined, CodeOutlined, CommentOutlined, CreditCardOutlined, DashboardOutlined, DollarOutlined, EyeOutlined, FileTextOutlined, PlayCircleOutlined, RobotOutlined, TagsOutlined, ThunderboltOutlined, ToolOutlined, TeamOutlined, UserOutlined, VideoCameraOutlined, WalletOutlined } from '@ant-design/icons'

export interface NavChild {
  label: string
  icon: React.ReactNode
  path: string
}

export interface NavOption {
  label: string
  icon: React.ReactNode
  /** For a group, this mirrors the first child's path — it doubles as the
   * accordion key and as the fallback target. */
  path: string
  children?: NavChild[]
  adminOnly?: boolean
  /** Draws a separator *above* this item. Used to detach admin from the rest. */
  divider?: boolean
}

/** Grouped by the job the pages serve, not by the tables behind them.
 *
 * The two money groups stay apart on purpose: billing is monthly and outbound
 * (who we invoice, for what), while cash is continuous and reconciliation-shaped
 * (what actually moved). Merging them would mean one accordion of eight, which
 * reads like a restaurant menu. Both bank pages live under Cash — they are the
 * same real-world entity and used to be split across two groups.
 *
 * Children are ordered by how often they get opened, not by hierarchy. */
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
      // Calendar first: it is the daily view. Ideas is where you go to plan.
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
    label: 'Billing',
    icon: <FileTextOutlined />,
    path: '/invoices',
    children: [
      {
        label: 'Invoices',
        icon: <FileTextOutlined />,
        path: '/invoices',
      },
      {
        label: 'Contracts',
        icon: <AuditOutlined />,
        path: '/invoices/contracts',
      },
      {
        label: 'Customers',
        icon: <UserOutlined />,
        path: '/invoices/customers',
      },
      {
        label: 'Services',
        icon: <ToolOutlined />,
        path: '/invoices/services',
      },
    ],
  },
  {
    label: 'Cash',
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
        label: 'Bank Accounts',
        icon: <CreditCardOutlined />,
        path: '/invoices/bank-accounts',
      },
      {
        label: 'Bank Balances',
        icon: <BankOutlined />,
        path: '/finance/balances',
      },
    ],
  },
  {
    label: 'Engineering',
    icon: <CodeOutlined />,
    path: '/implementations',
    children: [
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
        label: 'PR Feedback',
        icon: <CommentOutlined />,
        path: '/address-pr-comments',
      },
      {
        label: 'Productivity',
        icon: <CodeOutlined />,
        path: '/productivity',
      },
      {
        label: 'Productivity (by user)',
        icon: <UserOutlined />,
        path: '/productivity/user',
      },
    ],
  },
  {
    // Automations schedules, Watchers detects, Runner executes — the three
    // together are how work gets triggered and done.
    label: 'Platform',
    icon: <RobotOutlined />,
    path: '/automations',
    children: [
      {
        label: 'Automations',
        icon: <ClockCircleOutlined />,
        path: '/automations',
      },
      {
        label: 'Watchers',
        icon: <EyeOutlined />,
        path: '/watchers',
      },
      {
        label: 'Runner',
        icon: <RobotOutlined />,
        path: '/runner',
      },
    ],
  },
  {
    label: 'Users',
    icon: <TeamOutlined />,
    path: '/users',
    adminOnly: true,
    divider: true,
  },
]
