'use client'

import { trpc } from '@/lib/trpc/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = trpc.persons.getPersonWithRelationships.useQuery({ id })
  const { data: events } = trpc.events.getEventsForPerson.useQuery({ personId: id })
  const { data: media } = trpc.media.getMediaForPerson.useQuery({ personId: id })
  const triggerResearch = trpc.agents.triggerResearch.useMutation()

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  if (!data) return <div className="p-8 text-center text-slate-500">Person not found</div>

  const { person, parents, children, spouses } = data

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <Link href="/persons" className="text-slate-500 hover:text-slate-900">← Back</Link>
        <h1 className="font-semibold text-lg">{person.name}</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl flex-shrink-0">
              {person.gender === 'female' ? '👩' : '👨'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">{person.name}</h2>
              <div className="flex gap-4 text-sm text-slate-500 mt-1">
                {person.birthDate && <span>Born: {person.birthDate}</span>}
                {person.deathDate && <span>Died: {person.deathDate}</span>}
                {person.birthPlace && <span>From: {person.birthPlace}</span>}
              </div>
              {person.bio && <p className="mt-3 text-slate-700">{person.bio}</p>}
            </div>
            <button
              onClick={() => triggerResearch.mutate({ personId: person.id })}
              disabled={triggerResearch.isPending}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              {triggerResearch.isPending ? 'Researching...' : '🤖 AI Research'}
            </button>
          </div>
        </div>

        {/* Family */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Family</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Parents</p>
              {parents?.map((p) => <p key={p.id} className="text-sm">{p.name}</p>) ?? <p className="text-sm text-slate-400">None recorded</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Spouse(s)</p>
              {spouses?.map((p) => <p key={p.id} className="text-sm">{p.name}</p>) ?? <p className="text-sm text-slate-400">None recorded</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Children</p>
              {children?.map((p) => <p key={p.id} className="text-sm">{p.name}</p>) ?? <p className="text-sm text-slate-400">None recorded</p>}
            </div>
          </div>
        </div>

        {/* Life Events Timeline */}
        {events && events.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Life Events</h3>
            <div className="space-y-4">
              {events.map((event, i) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                    {i < events.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-slate-900">{event.title}</p>
                    {event.date && <p className="text-xs text-slate-500">{event.date}</p>}
                    {event.description && <p className="text-sm text-slate-600 mt-1">{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {media && media.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Photos & Videos</h3>
            <div className="grid grid-cols-3 gap-3">
              {media.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${m.cloudinaryPublicId}`}
                    alt={m.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                  {m.aiLabelStatus === 'pending' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 text-white text-xs py-1 text-center">
                      AI Processing...
                    </div>
                  )}
                  {m.aiLabels && m.aiLabels.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                      {m.aiLabels.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
