'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'

export default function PersonsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: persons, isLoading } = trpc.persons.listPersons.useQuery({ limit: 50, skip: 0 })
  const { data: searchResults } = trpc.persons.searchPersons.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length > 1 }
  )

  const displayPersons = debouncedSearch.length > 1 ? searchResults ?? [] : persons ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">People</h1>
      </header>
      
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Search by name or bio..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setTimeout(() => setDebouncedSearch(e.target.value), 300)
            }}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Link
            href="/persons/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Person
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPersons.map((person) => (
            <Link
              key={person.id}
              href={`/persons/${person.id}`}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                {person.gender === 'female' ? '👩' : '👨'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">
                  {person.birthDate ? `b. ${person.birthDate}` : ''}
                  {person.deathDate ? ` – d. ${person.deathDate}` : ''}
                </p>
                {person.bio && <p className="text-xs text-slate-400 truncate max-w-xs">{person.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
