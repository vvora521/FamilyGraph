import { z } from 'zod'
import { router, protectedProcedure, contributorProcedure } from '@/server/trpc/trpc'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { EventNode } from '@/lib/types'

export const eventsRouter = router({
  createEvent: contributorProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      date: z.string().optional(),
      eventType: z.string(),
      personId: z.string().uuid().optional(),
      placeId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = randomUUID()
      const now = new Date().toISOString()
      const result = await runWrite<{ e: EventNode }>(
        `CREATE (e:Event {
          id: $id,
          title: $title,
          description: $description,
          date: $date,
          eventType: $eventType,
          archived: false,
          createdAt: $createdAt
        })
        WITH e
        OPTIONAL MATCH (p:Person {id: $personId})
        FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
          CREATE (p)-[:PARTICIPATED_IN]->(e)
        )
        WITH e
        OPTIONAL MATCH (pl:Place {id: $placeId})
        FOREACH (_ IN CASE WHEN pl IS NOT NULL THEN [1] ELSE [] END |
          CREATE (e)-[:OCCURS_AT]->(pl)
        )
        RETURN e`,
        { id, title: input.title, description: input.description ?? null, date: input.date ?? null, eventType: input.eventType, createdAt: now, personId: input.personId ?? null, placeId: input.placeId ?? null }
      )
      return result[0]?.e ?? null
    }),

  getEventsForPerson: protectedProcedure
    .input(z.object({ personId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery<{ e: EventNode }>(
        `MATCH (:Person {id: $personId})-[:PARTICIPATED_IN]->(e:Event)
        WHERE e.archived = false OR e.archived IS NULL
        RETURN e ORDER BY e.date`,
        { personId: input.personId }
      )
      return result.map((r) => r.e)
    }),
})
