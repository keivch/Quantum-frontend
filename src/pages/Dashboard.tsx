import { useCallback, useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Percent,
  Trophy,
  Inbox,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useToast } from '../context/ToastContext'
import type { ReservationAnalytics } from '../types/analytics'
import { RESERVATION_STATUS_LABELS } from '../types/reservation'
import type { ReservationStatus } from '../types/reservation'

const STATUS_CHART_COLORS: Record<ReservationStatus, string> = {
  pending: '#eab308',
  confirmed: '#16a34a',
  cancelled: '#9ca3af',
  completed: '#2563eb',
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    startDateFrom: formatDateInput(start),
    startDateTo: formatDateInput(end),
  }
}

function formatShortDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  })
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default function Dashboard() {
  const toast = useToast()
  const defaultRange = getDefaultDateRange()
  const [draftFrom, setDraftFrom] = useState(defaultRange.startDateFrom)
  const [draftTo, setDraftTo] = useState(defaultRange.startDateTo)
  const [filters, setFilters] = useState(defaultRange)
  const [analytics, setAnalytics] = useState<ReservationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<ReservationAnalytics>('/analytics/reservations', {
        startDateFrom: filters.startDateFrom,
        startDateTo: filters.startDateTo,
      })
      setAnalytics(data)
    } catch (err) {
      setAnalytics(null)
      toast.error(err instanceof ApiError ? err.message : 'Error al cargar analíticas')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const applyFilters = () => {
    if (new Date(draftTo) < new Date(draftFrom)) {
      toast.error('La fecha de fin debe ser posterior o igual a la fecha de inicio')
      return
    }
    setFilters({ startDateFrom: draftFrom, startDateTo: draftTo })
  }

  const statusChartData =
    analytics?.statusDistribution
      .filter((item) => item.count > 0)
      .map((item) => ({
        name: RESERVATION_STATUS_LABELS[item.status],
        value: item.count,
        status: item.status,
      })) ?? []

  const dailyChartData =
    analytics?.reservationsByDay.map((item) => ({
      ...item,
      label: formatShortDate(item.date),
    })) ?? []

  const usageChartData = analytics?.usageBySpace ?? []
  const isEmpty = analytics?.summary.totalReservations === 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Indicadores de reservas y uso de espacios
        </p>
      </div>

      {/* Filtro global de fechas */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <CalendarRange className="h-4 w-4 text-indigo-600" />
          Periodo de análisis
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Desde</label>
            <input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Hasta</label>
            <input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            onClick={applyFilters}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : analytics ? (
        <>
          {isEmpty && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-600 shadow-sm">
              <Inbox className="h-5 w-5 shrink-0 text-gray-400" />
              No hay reservas en el periodo seleccionado. Ajusta el rango de fechas para
              ver indicadores.
            </div>
          )}

          {/* KPIs */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Total de reservas
              </div>
              <p className="text-3xl font-semibold text-gray-900">
                {analytics.summary.totalReservations}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Confirmadas
              </div>
              <p className="text-3xl font-semibold text-gray-900">
                {analytics.summary.confirmedCount}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Percent className="h-4 w-4 text-amber-600" />
                Tasa de cancelación
              </div>
              <p className="text-3xl font-semibold text-gray-900">
                {formatPercent(analytics.summary.cancellationRate)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {analytics.summary.cancelledCount} cancelada
                {analytics.summary.cancelledCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Espacio más reservado
              </div>
              {analytics.summary.topSpace ? (
                <>
                  <p className="truncate text-lg font-semibold text-gray-900">
                    {analytics.summary.topSpace.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {analytics.summary.topSpace.confirmedCount} confirmada
                    {analytics.summary.topSpace.confirmedCount !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Sin confirmadas</p>
              )}
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reservas por día */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="mb-1 text-sm font-semibold text-gray-900">
                Reservas por día
              </h2>
              <p className="mb-4 text-xs text-gray-500">
                Cantidad de reservas cuya fecha de inicio cae en cada día del periodo
              </p>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dailyChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value) => [value, 'Reservas']}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]?.payload
                        return item ? formatShortDate(item.date) : ''
                      }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-400">Sin datos</p>
              )}
            </div>

            {/* Distribución por estado */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-gray-900">
                Distribución por estado
              </h2>
              <p className="mb-4 text-xs text-gray-500">
                Proporción de reservas según su estado en el periodo
              </p>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusChartData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_CHART_COLORS[entry.status]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-400">Sin datos</p>
              )}
            </div>

            {/* Uso por espacio */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-gray-900">Uso por espacio</h2>
              <p className="mb-4 text-xs text-gray-500">
                {analytics.usageMetric.description}
              </p>
              {usageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={usageChartData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      unit=" h"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} h`, 'Horas confirmadas']}
                    />
                    <Bar dataKey="confirmedHours" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-400">
                  Sin reservas confirmadas en el periodo
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
