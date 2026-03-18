import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Lock, Phone, Home } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { registerUser } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import type { UserRole } from '../../types/user'
import { APP_NAME } from '../../constants'

const schema = z.object({
  nama:            z.string().min(3, 'Nama minimal 3 karakter'),
  email:           z.string().email('Email tidak valid'),
  noHp:            z.string().min(10, 'Nomor HP tidak valid'),
  password:        z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
  role:            z.enum(['penyewa', 'pemilik']),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Password tidak cocok',
  path:    ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const RegisterPage = memo(() => {
  const navigate  = useNavigate()
  const { setUser } = useAuthStore()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'penyewa' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
  setLoading(true)
  setError('')
  try {
    const user = await registerUser(data.email, data.password, data.nama, data.noHp, data.role as UserRole)
    setUser(user)
    setTimeout(() => {
      if (data.role === 'pemilik') navigate('/pemilik/dashboard')
      else navigate('/')
    }, 500)
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') setError('Email sudah terdaftar')
    else setError('Gagal mendaftar, coba lagi')
    setLoading(false)
  }
}


  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-amber-400">{APP_NAME}</Link>
          <p className="text-slate-500 mt-2">Buat akun baru</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { value: 'penyewa', label: 'Saya Penyewa',  icon: <User size={18} /> },
              { value: 'pemilik', label: 'Saya Pemilik Kost', icon: <Home size={18} /> },
            ].map(r => (
              <label
                key={r.value}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                  selectedRole === r.value
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <input type="radio" value={r.value} {...register('role')} className="hidden" />
                {r.icon}
                {r.label}
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              leftIcon={<User size={16} />}
              error={errors.nama?.message}
              required
              {...register('nama')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              required
              {...register('email')}
            />
            <Input
              label="Nomor HP"
              placeholder="08xxxxxxxxxx"
              leftIcon={<Phone size={16} />}
              error={errors.noHp?.message}
              required
              {...register('noHp')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Daftar Sekarang
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-amber-500 font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
})

RegisterPage.displayName = 'RegisterPage'
export default RegisterPage
 
