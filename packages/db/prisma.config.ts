import { defineConfig } from 'prisma/config';

// O generate não abre conexão, então a URL só é exigida ao aplicar migrações.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? 'mysql://localhost:3306/gig' },
});
