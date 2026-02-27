'use client'

import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'

function generateGEDCOM(persons: { id: string; name: string; birthDate?: string; deathDate?: string; gender?: string }[]) {
  const lines: string[] = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1', '1 CHAR UTF-8']
  
  persons.forEach((person, i) => {
    lines.push(`0 @I${i + 1}@ INDI`)
    lines.push(`1 NAME ${person.name}`)
    if (person.gender === 'male') lines.push('1 SEX M')
    if (person.gender === 'female') lines.push('1 SEX F')
    if (person.birthDate) { lines.push('1 BIRT'); lines.push(`2 DATE ${person.birthDate}`) }
    if (person.deathDate) { lines.push('1 DEAT'); lines.push(`2 DATE ${person.deathDate}`) }
  })
  
  lines.push('0 TRLR')
  return lines.join('\n')
}

function generateJsonLd(persons: { id: string; name: string; birthDate?: string; birthPlace?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FamilyRelationship',
    members: persons.map((p) => ({
      '@type': 'Person',
      '@id': `urn:familygraph:person:${p.id}`,
      name: p.name,
      birthDate: p.birthDate,
      birthPlace: p.birthPlace ? { '@type': 'Place', name: p.birthPlace } : undefined,
    })),
  }
}

export default function ExportPage() {
  const { data: persons } = trpc.persons.listPersons.useQuery({ limit: 1000, skip: 0 })

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">Export</h1>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-lg mb-1">GEDCOM Export</h2>
          <p className="text-sm text-slate-500 mb-3">Standard genealogy format compatible with Ancestry, MyHeritage, and other tools.</p>
          <button
            onClick={() => persons && downloadFile(generateGEDCOM(persons), 'familygraph.ged', 'text/plain')}
            disabled={!persons}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            Download GEDCOM (.ged)
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-lg mb-1">JSON-LD Export</h2>
          <p className="text-sm text-slate-500 mb-3">Linked open data format for Wikidata integration.</p>
          <button
            onClick={() => persons && downloadFile(JSON.stringify(generateJsonLd(persons), null, 2), 'familygraph.jsonld', 'application/ld+json')}
            disabled={!persons}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Download JSON-LD
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-lg mb-1">PDF Export</h2>
          <p className="text-sm text-slate-500 mb-3">Print-ready family tree document.</p>
          <button
            onClick={() => window.print()}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm"
          >
            Print / Save as PDF
          </button>
        </div>
      </main>
    </div>
  )
}
