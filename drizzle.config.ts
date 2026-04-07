import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config as loadEnv } from 'dotenv';

// Prefer .env.local for local dev, fallback to default .env if present
loadEnv({ path: '.env.local' });
loadEnv();

export default defineConfig({
  out: './drizzle',
  schema: './src/drizzle/schema/index.ts',
  dialect: 'mssql',
  dbCredentials: {
    server: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    options: {
      encrypt: false, // penting untuk local docker
      trustServerCertificate: true,
    },
  },
});
