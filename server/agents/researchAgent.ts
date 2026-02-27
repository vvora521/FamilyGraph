import { ChatAnthropic } from '@langchain/anthropic'
import { tool } from '@langchain/core/tools'
import { createReactAgent } from 'langchain/agents'
import { z } from 'zod'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { PersonNode } from '@/lib/types'

const neo4jReadTool = tool(
  async ({ cypher, params }) => {
    const result = await runQuery(cypher, params ? JSON.parse(params) : {})
    return JSON.stringify(result)
  },
  {
    name: 'neo4j_read',
    description: 'Run a read-only Cypher query against the Neo4j database',
    schema: z.object({
      cypher: z.string().describe('The Cypher query to run'),
      params: z.string().optional().describe('JSON string of query parameters'),
    }),
  }
)

const neo4jWriteTool = tool(
  async ({ proposedData, personId }) => {
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
      { id, proposedData, personId, createdAt: now }
    )
    return `Pending contribution created with id: ${id}`
  },
  {
    name: 'neo4j_write',
    description: 'Propose a new node/relationship to be reviewed by admin',
    schema: z.object({
      proposedData: z.string().describe('JSON string of the proposed data'),
      personId: z.string().describe('The person ID this relates to'),
    }),
  }
)

const cloudinaryTagTool = tool(
  async ({ mediaId, labels }) => {
    await runWrite(
      `MATCH (m:Media {id: $mediaId}) SET m.aiLabels = $labels, m.aiLabelStatus = 'complete'`,
      { mediaId, labels: JSON.parse(labels) }
    )
    return `Labels updated for media ${mediaId}`
  },
  {
    name: 'cloudinary_tag',
    description: 'Update AI-generated labels on a Media node',
    schema: z.object({
      mediaId: z.string().describe('The Media node ID'),
      labels: z.string().describe('JSON array of label strings'),
    }),
  }
)

export async function runResearchAgent(personId: string) {
  const model = new ChatAnthropic({
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Get person data
  const persons = await runQuery<{ p: PersonNode }>(
    'MATCH (p:Person {id: $id}) RETURN p',
    { id: personId }
  )
  const person = persons[0]?.p
  if (!person) throw new Error(`Person ${personId} not found`)

  const agent = await createReactAgent({
    llm: model,
    tools: [neo4jReadTool, neo4jWriteTool, cloudinaryTagTool],
  })

  const prompt = `You are a genealogy research assistant. 
Given this person: Name: ${person.name}, Birth Date: ${person.birthDate ?? 'unknown'}, Birth Place: ${person.birthPlace ?? 'unknown'}
Research their historical context using the neo4j_read tool to check existing data.
Then use neo4j_write to propose new Event nodes that would be historically relevant to their life.
For example, if they were born in 1890 in Germany and immigrated to America, propose migration events.
Always research what was historically happening during their lifetime.`

  const result = await agent.invoke({ messages: [{ role: 'user', content: prompt }] })
  return result
}
