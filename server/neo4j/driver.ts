import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI!
    const username = process.env.NEO4J_USERNAME!
    const password = process.env.NEO4J_PASSWORD!

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
      maxConnectionPoolSize: 50,
    })
  }
  return driver
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close()
    driver = null
  }
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver()
  const session = d.session({ defaultAccessMode: neo4j.session.READ })
  try {
    const result = await session.run(cypher, params)
    return result.records.map((record) => record.toObject() as T)
  } finally {
    await session.close()
  }
}

export async function runWrite<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver()
  const session = d.session({ defaultAccessMode: neo4j.session.WRITE })
  try {
    const result = await session.executeWrite((tx) => tx.run(cypher, params))
    return result.records.map((record) => record.toObject() as T)
  } finally {
    await session.close()
  }
}
