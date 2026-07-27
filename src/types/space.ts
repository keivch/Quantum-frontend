export type SpaceType = 'sala' | 'escritorio' | 'sala_reuniones' | 'phone_booth' | 'otro'

export interface Space {
  _id: string
  name: string
  type: SpaceType
  location: string
  capacity: number
  openingTime: string
  closingTime: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSpaceData {
  name: string
  type: SpaceType
  location: string
  capacity: number
  openingTime: string
  closingTime: string
}

export interface UpdateSpaceData {
  name?: string
  type?: SpaceType
  location?: string
  capacity?: number
  openingTime?: string
  closingTime?: string
}

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  sala: 'Sala',
  escritorio: 'Escritorio',
  sala_reuniones: 'Sala de reuniones',
  phone_booth: 'Phone booth',
  otro: 'Otro',
}
