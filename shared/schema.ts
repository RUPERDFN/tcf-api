import { pgTable, serial, text, integer, boolean, timestamp, json, real, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').default(true),
  isPremium: boolean('is_premium').default(false),
  premiumUntil: timestamp('premium_until'),
});

export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  budgetWeekly: real('budget_weekly').default(50),
  diners: integer('diners').default(2),
  mealsPerDay: integer('meals_per_day').default(3),
  daysPerWeek: integer('days_per_week').default(7),
  dietType: varchar('diet_type', { length: 50 }).default('omnivora'),
  allergies: json('allergies').$type<string[]>().default([]),
  dislikes: json('dislikes').$type<string[]>().default([]),
  pantryItems: json('pantry_items').$type<string[]>().default([]),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const menus = pgTable('menus', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  weekStart: timestamp('week_start').notNull(),
  menuData: json('menu_data').notNull(),
  shoppingList: json('shopping_list'),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

export const completedMeals = pgTable('completed_meals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  menuId: integer('menu_id').references(() => menus.id),
  dayIndex: integer('day_index').notNull(),
  mealType: varchar('meal_type', { length: 20 }).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
  rating: integer('rating'),
  notes: text('notes'),
});

export interface BadgeEntry {
  id: string;
  unlockedAt: string;
}

export const gamification = pgTable('gamification', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  points: integer('points').default(0),
  level: integer('level').default(1),
  streak: integer('streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActiveDate: timestamp('last_active_date'),
  badges: json('badges').$type<BadgeEntry[]>().default([]),
});

export const pointsLog = pgTable('points_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shoppingItems = pgTable('shopping_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  menuId: integer('menu_id').references(() => menus.id),
  itemName: varchar('item_name', { length: 200 }).notNull(),
  quantity: varchar('quantity', { length: 50 }),
  category: varchar('category', { length: 50 }),
  isPurchased: boolean('is_purchased').default(false),
  purchasedAt: timestamp('purchased_at'),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
