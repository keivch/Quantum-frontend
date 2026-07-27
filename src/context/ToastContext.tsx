import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

interface ConfirmState {
  message: string
  title: string
  confirmLabel: string
  cancelLabel: string
  variant: 'danger' | 'default'
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const confirmResolver = useRef<((value: boolean) => void) | null>(null)

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const resolveConfirm = useCallback((value: boolean) => {
    confirmResolver.current?.(value)
    confirmResolver.current = null
    setConfirmState(null)
  }, [])

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        confirmResolver.current?.(false)
        confirmResolver.current = resolve
        setConfirmState({
          message,
          title: options?.title ?? 'Confirmar acción',
          confirmLabel: options?.confirmLabel ?? 'Confirmar',
          cancelLabel: options?.cancelLabel ?? 'Cancelar',
          variant: options?.variant ?? 'danger',
        })
      }),
    []
  )

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => removeToast(id), TOAST_DURATION)
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string) => addToast(message, 'success'),
    [addToast]
  )

  const error = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ success, error, confirm }}>
      {children}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4"
          onClick={() => resolveConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="toast-enter w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <div
                className={`rounded-full p-2 ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="confirm-title" className="text-base font-semibold text-gray-900">
                  {confirmState.title}
                </h2>
                <p id="confirm-message" className="mt-1 text-sm text-gray-600">
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => resolveConfirm(true)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className={`shrink-0 rounded p-0.5 transition hover:bg-black/5 ${
                toast.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return ctx
}
