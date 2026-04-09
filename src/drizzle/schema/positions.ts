import { mssqlTable, varchar, bit, index } from 'drizzle-orm/mssql-core';
import { uuid, timestamps } from './helpers';
import { sql } from 'drizzle-orm';

export const positions = mssqlTable(
  'positions',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull().unique(),
    isActive: bit('isActive')
      .notNull()
      .default(sql`1`),

    ...timestamps,
  },
  (table) => [index('idx_positions_name').on(table.name)],
);
