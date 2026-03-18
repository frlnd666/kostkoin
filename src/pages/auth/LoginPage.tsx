import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { loginUser } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { APP_NAME } from '../../constants'

const schema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type FormData = z.infer<typeof schema>

const LoginPage = memo(() => {
  const navigate    = useNavigate()
  const { setUser } = useAuthStore()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const user = await loginUser(data.email, data.password)
      setUser(user)
      if (user.role === 'admin')   navigate('/admin/dashboard')
      else if (user.role === 'pemilik') navigate('/pemilik/dashboard')
      else navigate('/')
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError('Email atau password salah')
      else setError('Gagal masuk, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-amber-400">{APP_NAME}</Link>
          <p className="text-slate-500 mt-2">Masuk ke akun kamu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              label="Password"
              type="password"
              placeholder="Masukkan password"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              required
              {...register('password')}
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Masuk
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Belum punya akun?{' '}
            <Link to="/register" className="text-amber-500 font-medium hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
})

LoginPage.displayName = 'LoginPage'
export default LoginPage
 
