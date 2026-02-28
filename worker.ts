import { startWorkers } from '@/server/jobs/workers'

const { researchWorker, mediaWorker } = startWorkers()

console.log('Workers started: research, media-labeling')

async function shutdown() {
  console.log('Shutting down workers...')
  try {
    await researchWorker.close()
    await mediaWorker.close()
    process.exit(0)
  } catch (err) {
    console.error('Error during worker shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
