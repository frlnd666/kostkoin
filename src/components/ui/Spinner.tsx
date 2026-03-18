import { memo } from 'react'
import { clsx } from 'clsx'

interface SpinnerProps {
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

const Spinner = memo<SpinnerProps>(({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx(
        'animate-spin rounded-full border-2 border-slate-200 border-t-amber-400',
        sizes[size]
      )} />
    </div>
  )
})

Spinner.displayName = 'Spinner'
export default Spinner
 
