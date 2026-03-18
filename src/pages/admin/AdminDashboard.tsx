import { memo, useEffect, useState } from 'react'
import { Users, Home, Clock, TrendingUp } from 'lucide-react'
import Card          from '../../components/ui/Card'
import Spinner       from '../../components/ui/Spinner'
import ManageListing from './ManageListing'
import ManageUsers   from './ManageUsers'
import { getStats }  from '../../services/adminService'

type Tab = 'listing' | 'users'

const AdminDashboard = memo(() => {
  const [stats, setStats]   = useState({ totalUsers: 0, totalListings: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<Tab>('listing')

  useEffect(() => {
    getStats().then(setStats).finally(() => setLoading(false))
  }, [])

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm">Pantau dan kelola seluruh aktivitas KostKoin</p>
      </div>

      {/* Stats */}
      {loading ? (
        <Spinner size="md" className="mb-8" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total User',    value: stats.totalUsers,    icon: <Users size={20} />,      color: 'text-blue-500' },
            { label: 'Total Listing', value: stats.totalListings, icon: <Home size={20} />,       color: 'text-green-500' },
            { label: 'Pending',       value: '-',                 icon: <Clock size={20} />,      color: 'text-yellow-500' },
            { label: 'Pendapatan',    value: '-',                 icon: <TrendingUp size={20} />, color: 'text-amber-500' },
          ].map((s, i) => (
            <Card key={i} padding="md">
              <div className={`mb-2 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'listing', label: '📋 Kelola Listing' },
          { key: 'users',   label: '👥 Kelola User' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'listing' && <ManageListing />}
      {tab === 'users'   && <ManageUsers />}
    </main>
  )
})

AdminDashboard.displayName = 'AdminDashboard'
export default AdminDashboard
 
