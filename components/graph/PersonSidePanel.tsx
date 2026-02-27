'use client'

import { trpc } from '@/lib/trpc/client'
import type { PersonNode } from '@/lib/types'

interface Props {
  person: PersonNode
  onClose: () => void
}

export function PersonSidePanel({ person, onClose }: Props) {
  const { data } = trpc.persons.getPersonWithRelationships.useQuery({ id: person.id })
  const { data: mediaList } = trpc.media.getMediaForPerson.useQuery({ personId: person.id })
  const { data: events } = trpc.events.getEventsForPerson.useQuery({ personId: person.id })

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto z-50">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{person.name}</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl">×</button>
      </div>

      <div className="p-4 space-y-6">
        {/* Avatar */}
        {person.cloudinaryPublicId && (
          <div className="flex justify-center">
            <img
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${person.cloudinaryPublicId}`}
              alt={person.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
            />
          </div>
        )}

        {/* Bio */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-2">About</h3>
          <dl className="space-y-1 text-sm">
            {person.birthDate && <div><dt className="text-slate-500 inline">Born:</dt><dd className="inline ml-1">{person.birthDate}</dd></div>}
            {person.deathDate && <div><dt className="text-slate-500 inline">Died:</dt><dd className="inline ml-1">{person.deathDate}</dd></div>}
            {person.birthPlace && <div><dt className="text-slate-500 inline">From:</dt><dd className="inline ml-1">{person.birthPlace}</dd></div>}
          </dl>
          {person.bio && <p className="mt-2 text-sm text-slate-600">{person.bio}</p>}
        </div>

        {/* Family */}
        {data && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Family</h3>
            {data.parents?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Parents</p>
                {data.parents.map((p: PersonNode) => (
                  <p key={p.id} className="text-sm">{p.name}</p>
                ))}
              </div>
            )}
            {data.spouses?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Spouse(s)</p>
                {data.spouses.map((p: PersonNode) => (
                  <p key={p.id} className="text-sm">{p.name}</p>
                ))}
              </div>
            )}
            {data.children?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Children</p>
                {data.children.map((p: PersonNode) => (
                  <p key={p.id} className="text-sm">{p.name}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Life Events */}
        {events && events.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Life Events</h3>
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="border-l-2 border-blue-400 pl-3 py-1">
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.date && <p className="text-xs text-slate-500">{e.date}</p>}
                  {e.description && <p className="text-xs text-slate-600">{e.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Gallery */}
        {mediaList && mediaList.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Photos & Videos</h3>
            <div className="grid grid-cols-3 gap-2">
              {mediaList.map((m) => (
                <div key={m.id} className="relative aspect-square bg-slate-100 rounded overflow-hidden">
                  <img
                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_120,h_120,c_fill/${m.cloudinaryPublicId}`}
                    alt={m.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                  {m.aiLabelStatus === 'pending' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs">Processing...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
