import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
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

export const accountAccess = sqliteTable('account_access', {
  userId: text('user_id').primaryKey().references(()=>accounts.id,{onDelete:'cascade'}),
  role: text('role',{enum:['customer','engineer','admin']}).notNull().default('customer'),
  blocked: integer('blocked',{mode:'boolean'}).notNull().default(false),
  changedBy: text('changed_by'),
});

export const accessEvents = sqliteTable('access_events', {
  id: integer('id').primaryKey({autoIncrement:true}),
  userId: text('user_id').notNull(),
  actorId: text('actor_id'),
  action: text('action',{enum:['access','password_reset']}).notNull().default('access'),
  oldRole: text('old_role').notNull(),
  role: text('role').notNull(),
  oldBlocked: integer('old_blocked',{mode:'boolean'}).notNull(),
  blocked: integer('blocked',{mode:'boolean'}).notNull(),
  at: text('at').notNull(),
},table=>[index('access_events_at_idx').on(table.at)]);

export const subscriptionEvents = sqliteTable('subscription_events', {
  id: integer('id').primaryKey({autoIncrement:true}),
  orderId: text('order_id').notNull(),
  plan: text('plan').notNull(),
  previous: text('previous'),
  status: text('status').notNull(),
  at: text('at').notNull(),
},table=>[index('subscription_events_at_idx').on(table.at)]);

export const requestMetrics = sqliteTable('request_metrics', {
  hour: text('hour').primaryKey(),
  requests: integer('requests').notNull(),
  clientErrors: integer('client_errors').notNull(),
  serverErrors: integer('server_errors').notNull(),
  totalMs: integer('total_ms').notNull(),
  maxMs: integer('max_ms').notNull(),
});

export const orbitObservations = sqliteTable('orbit_observations', {
  norad: text('norad').notNull(),
  epoch: text('epoch').notNull(),
  observedAt: text('observed_at').notNull(),
  elements: text('elements').notNull(),
},table=>[primaryKey({columns:[table.norad,table.epoch]})]);
