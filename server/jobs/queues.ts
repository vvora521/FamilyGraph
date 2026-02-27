import { Queue } from 'bullmq'
import { getRedisConnection } from './redis'

let researchQueue: Queue | null = null
let mediaQueue: Queue | null = null

export function getResearchQueue() {
  if (!researchQueue) {
    researchQueue = new Queue('research', { connection: getRedisConnection() })
  }
  return researchQueue
}

export function getMediaQueue() {
  if (!mediaQueue) {
    mediaQueue = new Queue('media-labeling', { connection: getRedisConnection() })
  }
  return mediaQueue
}
