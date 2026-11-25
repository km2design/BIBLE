import { readdir, readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL?.trim() ?? ''

type DbGlobal = typeof globalThis & {
  __guangdao_pg_pool?: pg.Pool
  __guangdao_pglite?: Promise<PGlite>
}

const dbGlobal = globalThis as DbGlobal

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== '') {
    dbGlobal.__guangdao_pg_pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 })
    return (await dbGlobal.__guangdao_pg_pool.query(text, params)).rows as T[]
  }
  // Pin on globalThis so Next route / HMR reloads reuse one in-memory DB
  // (module-local `let` is reset per compile and wiped Mode A mid-smoke).
  dbGlobal.__guangdao_pglite ??= startLocal().catch((error: unknown) => {
    dbGlobal.__guangdao_pglite = undefined
    throw error
  })
  return (await (await dbGlobal.__guangdao_pglite).query<T>(text, params)).rows
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite()
  const files = (await readdir('migrations').catch(() => []))
    .filter((f) => f.endsWith('.sql'))
    .sort()
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, 'utf8'))
  }
  return db
}
