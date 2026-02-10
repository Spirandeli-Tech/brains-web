import { useAuth } from '@/context/auth'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white mb-8">
        <p className="text-sm opacity-90">Welcome, {user?.displayName || user?.email}</p>
        <p className="text-2xl font-bold mt-2">Great to see you again!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600">View your activity and insights</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600">Configure your preferences</p>
        </div>
      </div>
    </div>
  )
}
