import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">
        {isAuthenticated ? `Hola, ${user?.name}` : 'Bienvenido a Quantum'}
      </h1>
      <p className="mt-3 text-gray-600">
        {isAuthenticated
          ? 'Accede a los espacios y gestiona tu cuenta desde el menú superior.'
          : 'Plataforma de gestión de espacios. Inicia sesión para continuar.'}
      </p>
      {isAuthenticated ? (
        <Link
          to="/spaces"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Ver espacios
        </Link>
      ) : (
        <Link
          to="/login"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Iniciar sesión
        </Link>
      )}
    </div>
  )
}
