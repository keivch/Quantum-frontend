import type { Space } from './space'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface ReservationUser {
  _id: string
  name: string
  email: string
}

export interface Reservation {
  _id: string
  title: string
  clientName: string
  clientEmail: string
  attendees: number
  space: Space | string
  startDate: string
  endDate: string
  status: ReservationStatus
  notes: string
  createdBy?: ReservationUser | string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReservationFilters {
  page?: number
  limit?: number
  search?: string
  status?: ReservationStatus | ''
  space?: string
  startDateFrom?: string
  startDateTo?: string
  sortBy?: 'startDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateReservationData {
  title: string
  clientName: string
  clientEmail: string
  attendees: number
  space: string
  startDate: string
  endDate: string
  status?: ReservationStatus
  notes?: string
}

export interface UpdateReservationData {
  title?: string
  clientName?: string
  clientEmail?: string
  attendees?: number
  space?: string
  startDate?: string
  endDate?: string
  status?: ReservationStatus
  notes?: string
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-50 text-blue-700',
}
