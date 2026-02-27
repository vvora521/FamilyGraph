import { z } from 'zod'
import { router, protectedProcedure, contributorProcedure } from '@/server/trpc/trpc'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { PlaceNode } from '@/lib/types'

export const placesRouter = router({
  createPlace: contributorProcedure
    .input(z.object({
      name: z.string().min(1),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      country: z.string().optional(),
      region: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = randomUUID()
      const now = new Date().toISOString()
      const result = await runWrite<{ pl: PlaceNode }>(
        `CREATE (pl:Place {
          id: $id, name: $name, latitude: $latitude, longitude: $longitude,
          country: $country, region: $region, createdAt: $createdAt
        }) RETURN pl`,
        { id, ...input, latitude: input.latitude ?? null, longitude: input.longitude ?? null, country: input.country ?? null, region: input.region ?? null, createdAt: now }
      )
      return result[0]?.pl ?? null
    }),

  listPlaces: protectedProcedure.query(async () => {
    const result = await runQuery<{ pl: PlaceNode }>(
      `MATCH (pl:Place) RETURN pl ORDER BY pl.name`
    )
    return result.map((r) => r.pl)
  }),

  getPlaceWithEvents: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery(
        `MATCH (pl:Place {id: $id})
        OPTIONAL MATCH (e:Event)-[:OCCURS_AT]->(pl)
        OPTIONAL MATCH (p:Person)-[:LIVES_AT]->(pl)
        RETURN pl, collect(DISTINCT e) AS events, collect(DISTINCT p) AS persons`,
        { id: input.id }
      )
      return result[0] ?? null
    }),
})
