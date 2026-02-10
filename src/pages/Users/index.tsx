import { useEffect, useState } from 'react'
import { Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { usersClient } from '@/lib/clients/users'
import type { UserData } from '@/lib/clients/auth'

const columns: ColumnsType<UserData> = [
  {
    title: 'Name',
    key: 'name',
    render: (_, record) => `${record.first_name} ${record.last_name}`,
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Role',
    key: 'role',
    render: (_, record) => {
      const roleName = record.role?.name ?? 'N/A'
      const color = roleName === 'ADMIN' ? 'red' : 'blue'
      return <Tag color={color}>{roleName}</Tag>
    },
  },
  {
    title: 'Created At',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Last Login',
    dataIndex: 'last_login',
    key: 'last_login',
    render: (date: string | null) => (date ? new Date(date).toLocaleDateString() : 'Never'),
  },
]

export function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await usersClient.listUsers()
        setUsers(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load users'
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  )
}
