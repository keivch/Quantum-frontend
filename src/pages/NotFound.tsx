import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404</h1>
      <p className="text-gray-600">La página que buscas no existe.</p>
      <Link
        to="/"
        className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Volver al inicio
      </Link>
    </section>
  )
}
