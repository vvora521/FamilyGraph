import Anthropic from '@anthropic-ai/sdk'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { v2 as cloudinary } from 'cloudinary'
import type { MediaNode } from '@/lib/types'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function labelMediaWithAI(mediaId: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const media = await runQuery<{ m: MediaNode }>(
    'MATCH (m:Media {id: $id}) RETURN m',
    { id: mediaId }
  )
  const node = media[0]?.m
  if (!node) throw new Error(`Media ${mediaId} not found`)

  // Get CDN URL from Cloudinary
  const imageUrl = cloudinary.url(node.cloudinaryPublicId, {
    secure: true,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  })

  // Update status to pending
  await runWrite(
    'MATCH (m:Media {id: $id}) SET m.aiLabelStatus = $status',
    { id: mediaId, status: 'pending' }
  )

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `Analyze this family photo and provide labels as a JSON array. Include:
- Approximate decade/era (e.g., "1940s")
- Number of people visible
- Setting/location type (e.g., "outdoor", "living room", "church")
- Notable clothing or fashion details
- Any visible activities or events
- Mood or occasion
Return ONLY a JSON array of short label strings, e.g.: ["1950s", "outdoor", "3 people", "formal occasion"]`,
          },
        ],
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  let labels: string[] = []
  try {
    const match = content.text.match(/\[.*\]/s)
    if (match) labels = JSON.parse(match[0])
  } catch {
    labels = [content.text.slice(0, 200)]
  }

  await runWrite(
    'MATCH (m:Media {id: $id}) SET m.aiLabels = $labels, m.aiLabelStatus = $status',
    { id: mediaId, labels, status: 'complete' }
  )

  return labels
}
