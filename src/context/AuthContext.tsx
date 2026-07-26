import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setToken, removeToken, getToken, ApiError } from '../lib/api'
import type { User, AuthResponse, LoginCredentials } from '../types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    api
      .get<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        removeToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    setToken(response.token)
    setUser(response.user)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export { ApiError }
