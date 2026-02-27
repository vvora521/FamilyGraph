'use client'

import { GeographicMap } from '@/components/map/GeographicMap'
import Link from 'next/link'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">Geographic View</h1>
      </header>
      <div className="flex-1">
        <GeographicMap />
      </div>
    </div>
  )
}
