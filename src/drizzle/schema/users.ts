import { mssqlTable, varchar, bit } from 'drizzle-orm/mssql-core';
import { uuid, timestamps } from './helpers';
import { sql } from 'drizzle-orm';

export const users = mssqlTable('users', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  // MSSQL menggunakan bit (0/1) untuk boolean
  isActive: bit('isActive')
    .notNull()
    .default(sql`1`),
  role: varchar('role', {
    length: 50,
    enum: ['Administrator', 'User'],
  }).notNull(),

  ...timestamps,
});
