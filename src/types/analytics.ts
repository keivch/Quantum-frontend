import type { ReservationStatus } from './reservation'

export interface AnalyticsPeriod {
  startDateFrom: string
  startDateTo: string
}

export interface AnalyticsTopSpace {
  spaceId: string
  name: string
  confirmedCount: number
}

export interface AnalyticsSummary {
  totalReservations: number
  confirmedCount: number
  cancelledCount: number
  cancellationRate: number
  topSpace: AnalyticsTopSpace | null
}

export interface ReservationsByDay {
  date: string
  count: number
}

export interface StatusDistribution {
  status: ReservationStatus
  count: number
}

export interface UsageBySpace {
  spaceId: string
  name: string
  confirmedHours: number
  confirmedCount: number
}

export interface UsageMetric {
  unit: 'hours'
  description: string
}

export interface ReservationAnalytics {
  period: AnalyticsPeriod
  summary: AnalyticsSummary
  reservationsByDay: ReservationsByDay[]
  statusDistribution: StatusDistribution[]
  usageBySpace: UsageBySpace[]
  usageMetric: UsageMetric
}

export interface AnalyticsFilters {
  startDateFrom: string
  startDateTo: string
}
