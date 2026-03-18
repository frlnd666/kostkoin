import { memo, useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button'

interface ModalProps {
  isOpen:     boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

const Modal = memo<ModalProps>(({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={clsx(
        'relative w-full bg-white rounded-2xl shadow-xl z-10',
        sizes[size],
        className
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup modal">
              <X size={18} />
            </Button>
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
})

Modal.displayName = 'Modal'
export default Modal
 
