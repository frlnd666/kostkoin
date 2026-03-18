 
import { memo } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children:   React.ReactNode
  className?: string
  onClick?:   () => void
  hoverable?: boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
}

const Card = memo<CardProps>(({
  children,
  className,
  onClick,
  hoverable = false,
  padding   = 'md',
}) => {
  const paddings = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        paddings[padding],
        hoverable && 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
export default Card
