import Anthropic from '@anthropic-ai/sdk'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { PersonNode } from '@/lib/types'

type ToolInput = Record<string, string>

const tools: Anthropic.Tool[] = [
  {
    name: 'neo4j_read',
    description: 'Run a read-only Cypher query against the Neo4j database',
    input_schema: {
      type: 'object' as const,
      properties: {
        cypher: { type: 'string', description: 'The Cypher query to run' },
        params: { type: 'string', description: 'JSON string of query parameters' },
      },
      required: ['cypher'],
    },
  },
  {
    name: 'neo4j_write',
    description: 'Propose a new node/relationship to be reviewed by admin',
    input_schema: {
      type: 'object' as const,
      properties: {
        proposedData: { type: 'string', description: 'JSON string of the proposed data' },
        personId: { type: 'string', description: 'The person ID this relates to' },
      },
      required: ['proposedData', 'personId'],
    },
  },
  {
    name: 'cloudinary_tag',
    description: 'Update AI-generated labels on a Media node',
    input_schema: {
      type: 'object' as const,
      properties: {
        mediaId: { type: 'string', description: 'The Media node ID' },
        labels: { type: 'string', description: 'JSON array of label strings' },
      },
      required: ['mediaId', 'labels'],
    },
  },
]

async function executeTool(name: string, input: ToolInput): Promise<string> {
  if (name === 'neo4j_read') {
    const result = await runQuery(input.cypher, input.params ? JSON.parse(input.params) : {})
    return JSON.stringify(result)
  }
  if (name === 'neo4j_write') {
    const id = randomUUID()
    const now = new Date().toISOString()
    await runWrite(
      `CREATE (pc:PendingContribution {
        id: $id,
        proposedData: $proposedData,
        status: 'pending',
        agentId: 'claude',
        createdBy: $personId,
        createdAt: $createdAt
      })`,
      { id, proposedData: input.proposedData, personId: input.personId, createdAt: now }
    )
    return `Pending contribution created with id: ${id}`
  }
  if (name === 'cloudinary_tag') {
    await runWrite(
      `MATCH (m:Media {id: $mediaId}) SET m.aiLabels = $labels, m.aiLabelStatus = 'complete'`,
      { mediaId: input.mediaId, labels: JSON.parse(input.labels) }
    )
    return `Labels updated for media ${input.mediaId}`
  }
  return `Unknown tool: ${name}`
}

export async function runResearchAgent(personId: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const persons = await runQuery<{ p: PersonNode }>(
    'MATCH (p:Person {id: $id}) RETURN p',
    { id: personId }
  )
  const person = persons[0]?.p
  if (!person) throw new Error(`Person ${personId} not found`)

  const systemPrompt = `You are a genealogy research assistant with tools to query and write to a Neo4j graph database.
Use neo4j_read to check existing data, then neo4j_write to propose new historically relevant Event nodes for human review.`

  const userPrompt = `Given this person: Name: ${person.name}, Birth Date: ${person.birthDate ?? 'unknown'}, Birth Place: ${person.birthPlace ?? 'unknown'}
Research their historical context, check existing data, then propose new Event nodes that would be historically relevant to their life.`

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userPrompt }]

  // Agentic loop: allow up to 10 tool-use iterations
  for (let i = 0; i < 10; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text')
      return textBlock && textBlock.type === 'text' ? textBlock.text : 'Research complete.'
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content })
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as ToolInput)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }
      }
      messages.push({ role: 'user', content: toolResults })
    }
  }

  return 'Research agent reached max iterations.'
}
