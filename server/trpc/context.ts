import { auth, currentUser } from '@clerk/nextjs/server'
import { runQuery, runWrite } from '@/server/neo4j/driver'
import { randomUUID } from 'crypto'
import type { Role } from '@/lib/types'

export async function createTRPCContext() {
  const { userId, sessionClaims } = await auth()
  
  let role: Role = 'viewer'
  let contributorId: string | null = null

  if (userId) {
    const roleFromClaims = (sessionClaims?.metadata as { role?: Role })?.role
    role = roleFromClaims || 'viewer'

    // Ensure contributor node exists in Neo4j
    const existing = await runQuery<{ c: { id: string } }>(
      'MATCH (c:Contributor {clerkUserId: $clerkUserId}) RETURN c',
      { clerkUserId: userId }
    )

    if (existing.length === 0) {
      const user = await currentUser()
      const newId = randomUUID()
      await runWrite(
        `CREATE (c:Contributor {
          id: $id,
          clerkUserId: $clerkUserId,
          role: $role,
          name: $name,
          email: $email,
          createdAt: $createdAt
        })`,
        {
          id: newId,
          clerkUserId: userId,
          role,
          name: user?.fullName ?? 'Unknown',
          email: user?.emailAddresses[0]?.emailAddress ?? '',
          createdAt: new Date().toISOString(),
        }
      )
      contributorId = newId
    } else {
      contributorId = (existing[0].c as { id: string }).id
    }
  }

  return {
    userId,
    role,
    contributorId,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
