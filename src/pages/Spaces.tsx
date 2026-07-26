import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil, Ban, LayoutGrid, X } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Space, CreateSpaceData, UpdateSpaceData, SpaceType } from '../types/space'
import { SPACE_TYPE_LABELS } from '../types/space'

const EMPTY_FORM = {
  name: '',
  type: 'sala' as SpaceType,
  location: '',
  capacity: 1,
  openingTime: '08:00',
  closingTime: '18:00',
}

export default function Spaces() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchSpaces = async () => {
    try {
      const data = await api.get<Space[]>('/spaces')
      setSpaces(data)
      setError('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar espacios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpaces()
  }, [])

  const openCreateForm = () => {
    setEditingSpace(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (space: Space) => {
    setEditingSpace(space)
    setFormData({
      name: space.name,
      type: space.type,
      location: space.location,
      capacity: space.capacity,
      openingTime: space.openingTime,
      closingTime: space.closingTime,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSpace(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.openingTime >= formData.closingTime) {
      setError('La hora de cierre debe ser posterior a la hora de apertura')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (editingSpace) {
        const updated = await api.put<Space>(
          `/spaces/${editingSpace._id}`,
          formData as UpdateSpaceData
        )
        setSpaces((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
      } else {
        const created = await api.post<Space>('/spaces', formData as CreateSpaceData)
        setSpaces((prev) => [created, ...prev])
      }
      closeForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar espacio')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (space: Space) => {
    if (!confirm(`¿Desactivar el espacio "${space.name}"?`)) return

    try {
      const updated = await api.patch<Space>(`/spaces/${space._id}/deactivate`)
      setSpaces((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al desactivar espacio')
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
          <h1 className="text-2xl font-semibold text-gray-900">Espacios</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Gestiona los espacios del coworking'
              : 'Consulta los espacios disponibles'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo espacio
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingSpace ? 'Editar espacio' : 'Crear espacio'}
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as SpaceType })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Sede / ubicación
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Capacidad
                </label>
                <input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="openingTime"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Hora de apertura
                  </label>
                  <input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="closingTime"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Hora de cierre
                  </label>
                  <input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
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
              <th className="px-5 py-3 font-medium text-gray-600">Tipo</th>
              <th className="px-5 py-3 font-medium text-gray-600">Ubicación</th>
              <th className="px-5 py-3 font-medium text-gray-600">Capacidad</th>
              <th className="px-5 py-3 font-medium text-gray-600">Horario</th>
              <th className="px-5 py-3 font-medium text-gray-600">Estado</th>
              {isAdmin && <th className="px-5 py-3 font-medium text-gray-600">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {spaces.map((space) => (
              <tr key={space._id} className={!space.active ? 'opacity-60' : ''}>
                <td className="px-5 py-3.5 font-medium text-gray-900">{space.name}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {SPACE_TYPE_LABELS[space.type] ?? space.type}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{space.location}</td>
                <td className="px-5 py-3.5 text-gray-500">{space.capacity}</td>
                <td className="px-5 py-3.5 text-gray-500">
                  {space.openingTime} – {space.closingTime}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      space.active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {space.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3.5">
                    {space.active && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditForm(space)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeactivate(space)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Desactivar
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {spaces.length === 0 && (
          <div className="py-12 text-center">
            <LayoutGrid className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay espacios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}
