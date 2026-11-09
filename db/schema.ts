import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(), passwordHash: text('password_hash').notNull(), createdAt: text('created_at').notNull(),
});
export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(), userId: text('user_id').notNull().references(()=>accounts.id,{onDelete:'cascade'}), expiresAt: integer('expires_at').notNull(),
}, table=>[index('sessions_user_idx').on(table.userId)]);
export const authAttempts = sqliteTable('auth_attempts', {
  key: text('key').primaryKey(), count: integer('count').notNull(), expiresAt: integer('expires_at').notNull(),
});
export const profiles = sqliteTable('profiles', {
  userId: text('user_id').primaryKey(), name: text('name').notNull(), phone: text('phone').notNull().default(''), avatar: text('avatar').notNull().default(''), updatedAt: text('updated_at').notNull(),
});
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), plan: text('plan').notNull(), billing: text('billing').notNull(), address: text('address').notNull(), monthlyPrice: integer('monthly_price').notNull(), equipmentPrice: integer('equipment_price').notNull(), firstPayment: integer('first_payment').notNull(), status: text('status').notNull().default('new'), createdAt: text('created_at').notNull(), equipmentConfig:text('equipment_config'),
});
export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), subject: text('subject').notNull(), message: text('message').notNull(), createdAt: text('created_at').notNull(),
});
