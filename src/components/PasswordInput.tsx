import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  showLockIcon?: boolean
}

export default function PasswordInput({
  value,
  onChange,
  showLockIcon = false,
  className = '',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  const baseClass =
    'w-full rounded-lg border border-gray-300 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
  const paddingClass = showLockIcon ? 'py-2.5 pl-10 pr-10' : 'px-3 py-2 pr-10'

  return (
    <div className="relative">
      {showLockIcon && (
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      )}
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseClass} ${paddingClass} ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
