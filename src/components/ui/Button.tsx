import { memo } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?:     'sm' | 'md' | 'lg'
  loading?:  boolean
  fullWidth?: boolean
  children:  React.ReactNode
}

const Button = memo<ButtonProps>(({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  children,
  disabled,
  className,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-amber-400 hover:bg-amber-500 text-slate-900 focus:ring-amber-400',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
    danger:    'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost:     'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300',
    outline:   'border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 focus:ring-amber-400',
  }

  const sizes = {
    sm:  'px-3 py-1.5 text-sm gap-1.5',
    md:  'px-4 py-2 text-sm gap-2',
    lg:  'px-6 py-3 text-base gap-2',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
 
