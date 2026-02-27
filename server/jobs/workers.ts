import { Worker } from 'bullmq'
import { getRedisConnection } from './redis'
import { runResearchAgent } from '@/server/agents/researchAgent'
import { labelMediaWithAI } from '@/server/agents/mediaLabelAgent'

export function startWorkers() {
  const researchWorker = new Worker(
    'research',
    async (job) => {
      const { personId } = job.data
      return runResearchAgent(personId)
    },
    { connection: getRedisConnection() }
  )

  const mediaWorker = new Worker(
    'media-labeling',
    async (job) => {
      const { mediaId } = job.data
      return labelMediaWithAI(mediaId)
    },
    { connection: getRedisConnection() }
  )

  researchWorker.on('failed', (job, err) => {
    console.error(`Research job ${job?.id} failed:`, err)
  })

  mediaWorker.on('failed', (job, err) => {
    console.error(`Media labeling job ${job?.id} failed:`, err)
  })

  return { researchWorker, mediaWorker }
}
