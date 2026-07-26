export interface Space {
  _id: string
  name: string
  description: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSpaceData {
  name: string
  description?: string
}

export interface UpdateSpaceData {
  name?: string
  description?: string
}
