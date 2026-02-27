import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="text-center text-white p-8">
        <h1 className="text-5xl font-bold mb-4">FamilyGraph</h1>
        <p className="text-xl text-slate-300 mb-8">
          Discover, visualize, and preserve your family history
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
