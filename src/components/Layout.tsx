import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, LayoutGrid, Users, CalendarDays, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-indigo-600">
              Quantum
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/spaces"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Espacios
                </Link>
                <Link
                  to="/reservations"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  <CalendarDays className="h-4 w-4" />
                  Reservas
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/users"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600"
                  >
                    <Users className="h-4 w-4" />
                    Usuarios
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role === 'admin' ? 'Administrador' : 'Operador'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
