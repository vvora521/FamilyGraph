import { Redis } from 'ioredis'

let redis: Redis | null = null

export function getRedisConnection() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  }
  return redis
}
