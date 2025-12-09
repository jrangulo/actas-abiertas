import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Conexión a la base de datos PostgreSQL usando Drizzle ORM
 *
 * Usamos un patrón singleton para evitar crear múltiples conexiones
 * durante hot-reload en desarrollo (causa el error "MaxClientsInSessionMode")
 */

const connectionString = process.env.DATABASE_URL!

// En desarrollo, guardar el cliente en globalThis para evitar crear
// múltiples conexiones durante hot-reload
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined
}

// Reusar cliente existente o crear uno nuevo
const client = globalForDb.pgClient ?? postgres(connectionString, { prepare: false })

// En desarrollo, guardar en global para reusar
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client
}

export const db = drizzle(client, { schema })

// Re-exportar el esquema por conveniencia
export * from './schema'
