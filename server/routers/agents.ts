import { z } from 'zod'
import { router, contributorProcedure, adminProcedure } from '@/server/trpc/trpc'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { PendingContributionNode } from '@/lib/types'

export const agentsRouter = router({
  triggerResearch: contributorProcedure
    .input(z.object({ personId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Enqueue a BullMQ job
      const { getResearchQueue } = await import('@/server/jobs/queues')
      const queue = getResearchQueue()
      const job = await queue.add('research-person', {
        personId: input.personId,
        contributorId: ctx.contributorId,
      })
      return { jobId: job.id }
    }),

  triggerMediaLabeling: contributorProcedure
    .input(z.object({ mediaId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { getMediaQueue } = await import('@/server/jobs/queues')
      const queue = getMediaQueue()
      const job = await queue.add('label-media', { mediaId: input.mediaId })
      return { jobId: job.id }
    }),

  getPendingContributions: adminProcedure.query(async () => {
    const result = await runQuery<{ pc: PendingContributionNode }>(
      `MATCH (pc:PendingContribution {status: 'pending'}) RETURN pc ORDER BY pc.createdAt DESC`
    )
    return result.map((r) => r.pc)
  }),

  reviewContribution: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      action: z.enum(['accept', 'reject']),
      editedData: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const now = new Date().toISOString()
      if (input.action === 'accept') {
        // Parse and apply the proposed data
        const pc = await runQuery<{ pc: PendingContributionNode }>(
          `MATCH (pc:PendingContribution {id: $id}) RETURN pc`,
          { id: input.id }
        )
        const contribution = pc[0]?.pc
        if (contribution) {
          const data = JSON.parse(input.editedData ?? contribution.proposedData)
          // Create the node based on the proposal
          await runWrite(
            `MATCH (pc:PendingContribution {id: $id})
            SET pc.status = 'accepted', pc.reviewedBy = $reviewedBy, pc.reviewedAt = $reviewedAt
            WITH pc
            CREATE (p:Person {
              id: $newId,
              name: $name,
              bio: $bio,
              createdAt: $createdAt,
              updatedAt: $createdAt,
              archived: false,
              createdBy: 'agent:claude',
              reviewedBy: $reviewedBy
            })`,
            {
              id: input.id,
              reviewedBy: ctx.contributorId,
              reviewedAt: now,
              newId: randomUUID(),
              name: data.name ?? 'Unknown',
              bio: data.bio ?? null,
              createdAt: now,
            }
          )
        }
      } else {
        await runWrite(
          `MATCH (pc:PendingContribution {id: $id})
          SET pc.status = 'rejected', pc.reviewedBy = $reviewedBy, pc.reviewedAt = $reviewedAt`,
          { id: input.id, reviewedBy: ctx.contributorId, reviewedAt: now }
        )
      }
      return { success: true }
    }),
})
