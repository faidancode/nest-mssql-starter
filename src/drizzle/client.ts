import mssql from 'mssql';
import { drizzle } from 'drizzle-orm/node-mssql';
import * as schema from '../drizzle/schema';

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let pool: mssql.ConnectionPool;

export async function createDrizzleClient(config: {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}) {
  const connectionConfig: mssql.config = {
    server: config.host,
    port: config.port,
    user: config.user,
    password: config.password || '',
    database: config.database,
    options: {
      encrypt: true, // Gunakan true jika menggunakan Azure atau koneksi aman lainnya
      trustServerCertificate: true, // Sering dibutuhkan untuk development/local
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  // Membuat pool koneksi mssql
  pool = await new mssql.ConnectionPool(connectionConfig).connect();

  // Inisialisasi drizzle dengan mssql pool
  const db = drizzle({ client: pool, schema });
  return db;
}

export async function destroyDrizzleClient() {
  if (pool) {
    console.log('Closing MSSQL pool...');
    await pool.close();
    console.log('MSSQL pool closed');
  }
}
