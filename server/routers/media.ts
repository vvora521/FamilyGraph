import { z } from 'zod'
import { router, protectedProcedure, contributorProcedure } from '@/server/trpc/trpc'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { MediaNode } from '@/lib/types'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const mediaRouter = router({
  createMedia: contributorProcedure
    .input(z.object({
      cloudinaryPublicId: z.string().min(1),
      mediaType: z.enum(['image', 'video']),
      caption: z.string().optional(),
      takenAt: z.string().optional(),
      personId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = randomUUID()
      const now = new Date().toISOString()
      const result = await runWrite<{ m: MediaNode }>(
        `CREATE (m:Media {
          id: $id,
          cloudinaryPublicId: $cloudinaryPublicId,
          mediaType: $mediaType,
          caption: $caption,
          takenAt: $takenAt,
          aiLabels: [],
          aiLabelStatus: 'none',
          createdAt: $createdAt
        })
        WITH m
        OPTIONAL MATCH (p:Person {id: $personId})
        FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END |
          CREATE (p)-[:APPEARS_IN]->(m)
        )
        RETURN m`,
        { id, cloudinaryPublicId: input.cloudinaryPublicId, mediaType: input.mediaType, caption: input.caption ?? null, takenAt: input.takenAt ?? null, personId: input.personId ?? null, createdAt: now }
      )
      return result[0]?.m ?? null
    }),

  getSignedUrl: protectedProcedure
    .input(z.object({ publicId: z.string() }))
    .query(async ({ input }) => {
      const url = cloudinary.url(input.publicId, {
        secure: true,
        sign_url: true,
        type: 'authenticated',
      })
      return { url }
    }),

  getMediaForPerson: protectedProcedure
    .input(z.object({ personId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await runQuery<{ m: MediaNode }>(
        `MATCH (:Person {id: $personId})-[:APPEARS_IN]->(m:Media) RETURN m ORDER BY m.takenAt`,
        { personId: input.personId }
      )
      return result.map((r) => r.m)
    }),

  updateAiLabels: protectedProcedure
    .input(z.object({
      mediaId: z.string().uuid(),
      labels: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      await runWrite(
        `MATCH (m:Media {id: $mediaId})
        SET m.aiLabels = $labels, m.aiLabelStatus = 'complete'`,
        { mediaId: input.mediaId, labels: input.labels }
      )
      return { success: true }
    }),

  getUnlabeledMedia: protectedProcedure.query(async () => {
    const result = await runQuery<{ m: MediaNode }>(
      `MATCH (m:Media) WHERE m.aiLabelStatus = 'none' OR m.aiLabelStatus IS NULL RETURN m LIMIT 50`
    )
    return result.map((r) => r.m)
  }),
})
