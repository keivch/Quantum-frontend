import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  Plus,
  Pencil,
  Ban,
  CalendarDays,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import type { Space } from '../types/space'
import type {
  Reservation,
  ReservationFilters,
  PaginatedResponse,
  CreateReservationData,
  UpdateReservationData,
  ReservationStatus,
} from '../types/reservation'
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_COLORS,
} from '../types/reservation'

const EMPTY_FORM = {
  title: '',
  clientName: '',
  clientEmail: '',
  attendees: 1,
  space: '',
  startDate: '',
  endDate: '',
  status: 'pending' as ReservationStatus,
  notes: '',
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function getSpaceName(reservation: Reservation) {
  if (typeof reservation.space === 'object' && reservation.space !== null) {
    return reservation.space.name
  }
  return '—'
}

function getCreatorName(reservation: Reservation) {
  if (typeof reservation.createdBy === 'object' && reservation.createdBy !== null) {
    return reservation.createdBy.name
  }
  return '—'
}

function isTerminalStatus(status: ReservationStatus) {
  return status === 'cancelled' || status === 'completed'
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [filters, setFilters] = useState<ReservationFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    space: '',
    startDateFrom: '',
    startDateTo: '',
    sortBy: 'startDate',
    sortOrder: 'desc',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState<Reservation | null>(null)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchSpaces = async () => {
    try {
      const data = await api.get<Space[]>('/spaces')
      setSpaces(data.filter((s) => s.active))
    } catch {
      /* espacios opcionales para filtros */
    }
  }

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.get<PaginatedResponse<Reservation>>('/reservations', {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        status: filters.status || undefined,
        space: filters.space || undefined,
        startDateFrom: filters.startDateFrom || undefined,
        startDateTo: filters.startDateTo || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      setReservations(result.data)
      setPagination(result.pagination)
      setError('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchSpaces()
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const openCreateForm = () => {
    setEditingReservation(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setFormData({
      title: reservation.title,
      clientName: reservation.clientName,
      clientEmail: reservation.clientEmail,
      attendees: reservation.attendees,
      space:
        typeof reservation.space === 'object'
          ? reservation.space._id
          : (reservation.space as string),
      startDate: toLocalDatetimeValue(reservation.startDate),
      endDate: toLocalDatetimeValue(reservation.endDate),
      status: reservation.status,
      notes: reservation.notes,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingReservation(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    setSubmitting(true)
    setError('')

    const payload = {
      ...formData,
      attendees: Number(formData.attendees),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    }

    try {
      if (editingReservation) {
        const updated = await api.put<Reservation>(
          `/reservations/${editingReservation._id}`,
          payload as UpdateReservationData
        )
        setReservations((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        )
        if (showDetail?._id === updated._id) setShowDetail(updated)
      } else {
        await api.post<Reservation>('/reservations', payload as CreateReservationData)
        await fetchReservations()
      }
      closeForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar reserva')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (reservation: Reservation) => {
    if (!confirm(`¿Cancelar la reserva "${reservation.title}"?`)) return

    try {
      const updated = await api.patch<Reservation>(
        `/reservations/${reservation._id}/cancel`
      )
      setReservations((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      )
      if (showDetail?._id === updated._id) setShowDetail(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cancelar reserva')
    }
  }

  const handleViewDetail = async (reservation: Reservation) => {
    try {
      const detail = await api.get<Reservation>(`/reservations/${reservation._id}`)
      setShowDetail(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar detalle')
    }
  }

  const applyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }))
  }

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reservas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las reservas del coworking
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Buscar por título, cliente o correo..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as ReservationStatus | '',
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.space}
            onChange={(e) => setFilters({ ...filters, space: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Todos los espacios</option>
            {spaces.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDateFrom}
            onChange={(e) => setFilters({ ...filters, startDateFrom: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            title="Desde"
          />
          <input
            type="date"
            value={filters.startDateTo}
            onChange={(e) => setFilters({ ...filters, startDateTo: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            title="Hasta"
          />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortBy: e.target.value as 'startDate' | 'createdAt',
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="startDate">Ordenar por inicio</option>
            <option value="createdAt">Ordenar por creación</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortOrder: e.target.value as 'asc' | 'desc',
              })
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={applyFilters}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingReservation ? 'Editar reserva' : 'Nueva reserva'}
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nombre del cliente
                </label>
                <input
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Correo del cliente
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEmail: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  N.º de asistentes
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.attendees}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attendees: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Espacio
                </label>
                <select
                  value={formData.space}
                  onChange={(e) => setFormData({ ...formData, space: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Seleccionar espacio</option>
                  {spaces.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.location}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as ReservationStatus,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  {editingReservation && <option value="completed">Completado</option>}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
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

      {/* Modal detalle */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Detalle de reserva</h2>
              <button
                onClick={() => setShowDetail(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Título</dt>
                <dd className="text-gray-900">{showDetail.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Cliente</dt>
                <dd className="text-gray-900">
                  {showDetail.clientName} ({showDetail.clientEmail})
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Asistentes</dt>
                <dd className="text-gray-900">{showDetail.attendees}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Espacio</dt>
                <dd className="text-gray-900">{getSpaceName(showDetail)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Inicio</dt>
                <dd className="text-gray-900">{formatDateTime(showDetail.startDate)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Fin</dt>
                <dd className="text-gray-900">{formatDateTime(showDetail.endDate)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Estado</dt>
                <dd>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESERVATION_STATUS_COLORS[showDetail.status]}`}
                  >
                    {RESERVATION_STATUS_LABELS[showDetail.status]}
                  </span>
                </dd>
              </div>
              {showDetail.notes && (
                <div>
                  <dt className="font-medium text-gray-500">Notas</dt>
                  <dd className="text-gray-900">{showDetail.notes}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500">Creador</dt>
                <dd className="text-gray-900">{getCreatorName(showDetail)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Creada</dt>
                <dd className="text-gray-900">{formatDateTime(showDetail.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Actualizada</dt>
                <dd className="text-gray-900">{formatDateTime(showDetail.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-600">Título</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Cliente</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Espacio</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Inicio</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-5 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((reservation) => (
                  <tr
                    key={reservation._id}
                    className={isTerminalStatus(reservation.status) ? 'opacity-60' : ''}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {reservation.title}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      <div>{reservation.clientName}</div>
                      <div className="text-xs text-gray-400">{reservation.clientEmail}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {getSpaceName(reservation)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDateTime(reservation.startDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESERVATION_STATUS_COLORS[reservation.status]}`}
                      >
                        {RESERVATION_STATUS_LABELS[reservation.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewDetail(reservation)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver
                        </button>
                        {!isTerminalStatus(reservation.status) && (
                          <>
                            <button
                              onClick={() => openEditForm(reservation)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleCancel(reservation)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reservations.length === 0 && (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No hay reservas registradas</p>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
                <p className="text-sm text-gray-500">
                  {pagination.total} reserva{pagination.total !== 1 ? 's' : ''} — Página{' '}
                  {pagination.page} de {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
