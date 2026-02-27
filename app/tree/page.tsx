'use client'

import { useState } from 'react'
import { FamilyTree } from '@/components/graph/FamilyTree'
import { PersonSidePanel } from '@/components/graph/PersonSidePanel'
import type { PersonNode } from '@/lib/types'
import Link from 'next/link'

export default function TreePage() {
  const [selectedPerson, setSelectedPerson] = useState<PersonNode | null>(null)

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4 z-10">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">Family Tree</h1>
      </header>
      <div className="flex-1 relative">
        <FamilyTree onNodeClick={setSelectedPerson} />
        {selectedPerson && (
          <PersonSidePanel
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </div>
    </div>
  )
}
