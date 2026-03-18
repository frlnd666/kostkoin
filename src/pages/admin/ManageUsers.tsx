import { memo, useEffect, useState } from 'react'
import { User, Home, Shield } from 'lucide-react'
import Card    from '../../components/ui/Card'
import Badge   from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getAllUsers } from '../../services/adminService'
import type { User as UserType } from '../../types/user'

const ManageUsers = memo(() => {
  const [users, setUsers]     = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  const roleIcon = (role: UserType['role']) => {
    if (role === 'admin')   return <Shield size={14} />
    if (role === 'pemilik') return <Home size={14} />
    return <User size={14} />
  }

  const roleBadge = (role: UserType['role']) => {
    const map = {
      admin:   'danger'  as const,
      pemilik: 'info'    as const,
      penyewa: 'success' as const,
    }
    return map[role]
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        Kelola Pengguna
        <span className="text-sm font-normal text-slate-400 ml-2">({users.length} total)</span>
      </h2>

      {loading ? (
        <Spinner size="lg" className="py-12" />
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((user, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                    {user.nama?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{user.nama}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-400">{user.noHp}</p>
                  </div>
                </div>
                <Badge variant={roleBadge(user.role)}>
                  <span className="flex items-center gap-1">
                    {roleIcon(user.role)}
                    {user.role}
                  </span>
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
})

ManageUsers.displayName = 'ManageUsers'
export default ManageUsers
 
