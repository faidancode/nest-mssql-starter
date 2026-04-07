import { sql } from 'drizzle-orm';
import { varchar, datetime } from 'drizzle-orm/mssql-core';

// Shared UUID helper
export const uuid = (name: string) => varchar(name, { length: 36 });

// Timestamp helper
export const timestamps = {
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`GETDATE()`),
  updatedAt: datetime('updated_at').default(sql`GETDATE()`),
  deletedAt: datetime('deleted_at'),
};
