import { memo } from 'react'
import { clsx } from 'clsx'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children:   React.ReactNode
  variant?:   BadgeVariant
  className?: string
}

const Badge = memo<BadgeProps>(({ children, variant = 'default', className }) => {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger:  'bg-red-100 text-red-700 border-red-200',
    info:    'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'
export default Badge
 
