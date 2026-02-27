import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">FamilyGraph</h1>
        <UserButton afterSignOutUrl="/" />
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/tree" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">🌳</div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Family Tree</h2>
            <p className="text-slate-500 mt-1">Explore the interactive force-directed family graph</p>
          </Link>
          <Link href="/map" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">🗺️</div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Geographic View</h2>
            <p className="text-slate-500 mt-1">See where your family lived on an interactive map</p>
          </Link>
          <Link href="/persons" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">👥</div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">People</h2>
            <p className="text-slate-500 mt-1">Browse and manage family members</p>
          </Link>
          <Link href="/admin" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">🤖</div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">AI Review Queue</h2>
            <p className="text-slate-500 mt-1">Review and approve AI-suggested additions</p>
          </Link>
          <Link href="/export" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">📤</div>
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">Export</h2>
            <p className="text-slate-500 mt-1">Export your family tree in multiple formats</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
