'use client'

import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import type { PlaceNode } from '@/lib/types'

// Dynamic import to avoid SSR issues with mapbox-gl
export function GeographicMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const currentYear = new Date().getFullYear()
  const [dateRange, setDateRange] = useState<[number, number]>([1800, currentYear])
  const [selectedPlace, setSelectedPlace] = useState<PlaceNode | null>(null)

  const { data: places } = trpc.places.listPlaces.useQuery()

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-98.5795, 39.8283],
        zoom: 4,
      })

      mapRef.current = map

      map.on('load', () => {
        if (!places) return
        places.forEach((place) => {
          if (place.latitude == null || place.longitude == null) return

          const marker = new mapboxgl.default.Marker({ color: '#3b82f6' })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 25 }).setHTML(
                `<strong>${place.name}</strong><br/>${place.country ?? ''}`
              )
            )
            .addTo(map)

          marker.getElement().addEventListener('click', () => {
            setSelectedPlace(place)
          })
        })
      })
    })

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove()
        mapRef.current = null
      }
    }
  }, [places])

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Timeline slider */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-6 py-4 w-96">
        <p className="text-sm font-medium text-slate-700 mb-2">
          Timeline: {dateRange[0]} – {dateRange[1]}
        </p>
        <input
          type="range"
          min={1800}
          max={currentYear}
          value={dateRange[1]}
          onChange={(e) => setDateRange([dateRange[0], parseInt(e.target.value)])}
        />
      </div>

      {/* Selected place panel */}
      {selectedPlace && (
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-4 w-72">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">{selectedPlace.name}</h3>
            <button onClick={() => setSelectedPlace(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <p className="text-sm text-slate-500">{selectedPlace.country}{selectedPlace.region ? `, ${selectedPlace.region}` : ''}</p>
        </div>
      )}
    </div>
  )
}
