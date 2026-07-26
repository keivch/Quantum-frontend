import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-indigo-600">
            Quantum
          </Link>
          <Link to="/" className="text-sm font-medium hover:text-indigo-600">
            Inicio
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-indigo-600">
            Acerca de
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
