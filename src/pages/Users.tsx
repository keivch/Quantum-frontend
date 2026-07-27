import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Ban, CheckCircle, Users, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useToast } from '../context/ToastContext'
import PasswordInput from '../components/PasswordInput'
import type { User, UserRole } from '../types/auth'

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    try {
      const data = await api.get<User[]>('/users')
      setUsers(data)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const created = await api.post<User>('/users', formData)
      setUsers((prev) => [created, ...prev])
      setShowForm(false)
      setFormData({ name: '', email: '', password: '', role: 'operator' })
      toast.success('Usuario creado correctamente')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al crear usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (user: User) => {
    const confirmed = await toast.confirm(`¿Desactivar al usuario "${user.name}"?`)
    if (!confirmed) return

    try {
      const updated = await api.patch<User>(`/users/${user.id}/deactivate`)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success('Usuario desactivado correctamente')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al desactivar usuario')
    }
  }

  const handleActivate = async (user: User) => {
    const confirmed = await toast.confirm(`¿Reactivar al usuario "${user.name}"?`, {
      variant: 'default',
    })
    if (!confirmed) return

    try {
      const updated = await api.patch<User>(`/users/${user.id}/activate`)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success('Usuario reactivado correctamente')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al reactivar usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">Administra las cuentas del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Crear usuario</h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Correo</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Contraseña</label>
                <PasswordInput
                  value={formData.password}
                  onChange={(password) => setFormData({ ...formData, password })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-5 py-3 font-medium text-gray-600">Nombre</th>
              <th className="px-5 py-3 font-medium text-gray-600">Correo</th>
              <th className="px-5 py-3 font-medium text-gray-600">Rol</th>
              <th className="px-5 py-3 font-medium text-gray-600">Estado</th>
              <th className="px-5 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className={!user.active ? 'opacity-60' : ''}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{user.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {user.active ? (
                    <button
                      onClick={() => handleDeactivate(user)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(user)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
