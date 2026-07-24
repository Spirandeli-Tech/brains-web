import { useCallback, useEffect, useState } from 'react'
import { Button, Popconfirm, Table, Tag, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined } from '@ant-design/icons'
import { usersClient } from '@/lib/clients/users'
import type { UserData } from '@/lib/clients/auth'
import { useAuth } from '@/context/auth'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setUsers(await usersClient.listUsers())
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async (user: UserData) => {
    setDeleting(user.id)
    try {
      await usersClient.deleteUser(user.id)
      message.success(`${user.email} removed`)
      void load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to remove user')
    } finally {
      setDeleting(null)
    }
  }

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
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id
        return (
          <Tooltip title={isSelf ? 'You cannot remove your own account' : 'Remove user'}>
            <Popconfirm
              title="Remove this user?"
              description="They stop being listed and can no longer sign in. Everything they own is kept, and it can be undone in the database."
              onConfirm={() => handleDelete(record)}
              okText="Remove"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={isSelf}
                loading={deleting === record.id}
              />
            </Popconfirm>
          </Tooltip>
        )
      },
    },
  ]

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
