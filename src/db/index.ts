import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Solo para uso del lado del servidor
// DATABASE_URL debe ser la cadena de conexión de Supabase
// Usar el pooler "Transaction" para entornos serverless (Vercel)

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

// Re-exportar el esquema por conveniencia
export * from './schema'
