import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Solo manejar el esquema public - el esquema auth es manejado por Supabase
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
})
