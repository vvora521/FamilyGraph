import { router } from '@/server/trpc/trpc'
import { personsRouter } from './persons'
import { eventsRouter } from './events'
import { placesRouter } from './places'
import { mediaRouter } from './media'
import { agentsRouter } from './agents'

export const appRouter = router({
  persons: personsRouter,
  events: eventsRouter,
  places: placesRouter,
  media: mediaRouter,
  agents: agentsRouter,
})

export type AppRouter = typeof appRouter
