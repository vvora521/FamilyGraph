import { z } from 'zod'
import { router, protectedProcedure, contributorProcedure } from '@/server/trpc/trpc'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { PersonNode, EventNode, MediaNode } from '@/lib/types'

const personInput = z.object({
  name: z.string().min(1).max(200),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  bio: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthPlace: z.string().optional(),
  cloudinaryPublicId: z.string().optional(),
})

export const personsRouter = router({
  createPerson: contributorProcedure
    .input(personInput)
    .mutation(async ({ input, ctx }) => {
      const id = randomUUID()
      const now = new Date().toISOString()
      const result = await runWrite<{ p: PersonNode }>(
        `CREATE (p:Person {
          id: $id,
          name: $name,
          birthDate: $birthDate,
          deathDate: $deathDate,
          bio: $bio,
          gender: $gender,
          birthPlace: $birthPlace,
          cloudinaryPublicId: $cloudinaryPublicId,
          archived: false,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        WITH p
        MATCH (c:Contributor {id: $contributorId})
        CREATE (p)-[:CONTRIBUTED_BY]->(c)
        RETURN p`,
        {
          id,
          name: input.name,
          birthDate: input.birthDate ?? null,
          deathDate: input.deathDate ?? null,
          bio: input.bio ?? null,
          gender: input.gender ?? null,
          birthPlace: input.birthPlace ?? null,
          cloudinaryPublicId: input.cloudinaryPublicId ?? null,
          archived: false,
          createdAt: now,
          updatedAt: now,
          contributorId: ctx.contributorId,
        }
      )
      return result[0]?.p ?? null
    }),

  updatePerson: contributorProcedure
    .input(z.object({ id: z.string().uuid(), data: personInput.partial() }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString()
      const result = await runWrite<{ p: PersonNode }>(
        `MATCH (p:Person {id: $id, archived: false})
        SET p += $data, p.updatedAt = $updatedAt
        RETURN p`,
        { id: input.id, data: input.data, updatedAt: now }
      )
      return result[0]?.p ?? null
    }),

  deletePerson: contributorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await runWrite(
        `MATCH (p:Person {id: $id}) SET p.archived = true, p.updatedAt = $updatedAt`,
        { id: input.id, updatedAt: new Date().toISOString() }
      )
      return { success: true }
    }),

  getPerson: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery<{ p: PersonNode }>(
        `MATCH (p:Person {id: $id, archived: false}) RETURN p`,
        { id: input.id }
      )
      return result[0]?.p ?? null
    }),

  getPersonWithRelationships: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery<{
        person: PersonNode
        parents: PersonNode[]
        children: PersonNode[]
        spouses: PersonNode[]
        events: EventNode[]
        media: MediaNode[]
      }>(
        `MATCH (person:Person {id: $id, archived: false})
        OPTIONAL MATCH (person)<-[:PARENT_OF]-(parent:Person {archived: false})
        OPTIONAL MATCH (person)-[:PARENT_OF]->(child:Person {archived: false})
        OPTIONAL MATCH (person)-[:MARRIED_TO]-(spouse:Person {archived: false})
        OPTIONAL MATCH (person)-[:PARTICIPATED_IN]->(event:Event)
        OPTIONAL MATCH (person)-[:APPEARS_IN]->(media:Media)
        RETURN person,
          collect(DISTINCT parent) AS parents,
          collect(DISTINCT child) AS children,
          collect(DISTINCT spouse) AS spouses,
          collect(DISTINCT event) AS events,
          collect(DISTINCT media) AS media`,
        { id: input.id }
      )
      return result[0] ?? null
    }),

  searchPersons: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(100).default(20),
      skip: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const result = await runQuery<{ p: PersonNode; score: number }>(
        `CALL db.index.fulltext.queryNodes('person_fulltext', $query) YIELD node AS p, score
        WHERE p.archived = false
        RETURN p, score
        ORDER BY score DESC
        SKIP $skip LIMIT $limit`,
        { query: input.query, skip: input.skip, limit: input.limit }
      )
      return result.map((r) => ({ ...r.p, score: r.score }))
    }),

  listPersons: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      skip: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const result = await runQuery<{ p: PersonNode }>(
        `MATCH (p:Person {archived: false}) RETURN p ORDER BY p.name SKIP $skip LIMIT $limit`,
        { skip: input.skip, limit: input.limit }
      )
      return result.map((r) => r.p)
    }),

  getGraphData: protectedProcedure.query(async () => {
    const result = await runQuery<{
      person: PersonNode
      related: PersonNode
      relType: string
    }>(
      `MATCH (p:Person {archived: false})
      OPTIONAL MATCH (p)-[r:PARENT_OF|MARRIED_TO]->(related:Person {archived: false})
      RETURN p AS person, related, type(r) AS relType`
    )

    const nodesMap = new Map<string, PersonNode>()
    const links: { source: string; target: string; type: string }[] = []

    for (const row of result) {
      nodesMap.set(row.person.id, row.person)
      if (row.related) {
        nodesMap.set(row.related.id, row.related)
        links.push({ source: row.person.id, target: row.related.id, type: row.relType })
      }
    }

    return {
      nodes: Array.from(nodesMap.values()).map((p) => ({
        id: p.id,
        label: p.name,
        type: 'Person' as const,
        data: p,
      })),
      links,
    }
  }),

  findPath: protectedProcedure
    .input(z.object({ fromId: z.string().uuid(), toId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery<{ path: unknown }>(
        `MATCH path = shortestPath(
          (a:Person {id: $fromId})-[*..10]-(b:Person {id: $toId})
        )
        RETURN path`,
        { fromId: input.fromId, toId: input.toId }
      )
      return result[0]?.path ?? null
    }),

  addRelationship: contributorProcedure
    .input(z.object({
      fromPersonId: z.string().uuid(),
      toPersonId: z.string().uuid(),
      relationshipType: z.enum(['PARENT_OF', 'CHILD_OF', 'MARRIED_TO']),
    }))
    .mutation(async ({ input }) => {
      const { fromPersonId, toPersonId, relationshipType } = input
      await runWrite(
        `MATCH (a:Person {id: $fromId}), (b:Person {id: $toId})
        CALL apoc.merge.relationship(a, $relType, {}, {}, b) YIELD rel
        RETURN rel`,
        { fromId: fromPersonId, toId: toPersonId, relType: relationshipType }
      )
      return { success: true }
    }),

  mergePersons: contributorProcedure
    .input(z.object({ keepId: z.string().uuid(), mergeId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      // Transfer all relationships from mergeId to keepId, then archive mergeId
      await runWrite(
        `MATCH (keep:Person {id: $keepId}), (merge:Person {id: $mergeId})
        // Re-point all incoming relationships
        CALL apoc.refactor.mergeNodes([keep, merge], {properties: 'discard', mergeRels: true})
        YIELD node
        SET node.id = $keepId, node.archived = false
        RETURN node`,
        { keepId: input.keepId, mergeId: input.mergeId }
      )
      return { success: true }
    }),
})
