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
  role: varchar('role', { length: 20 }).default('USER'), // USER, NUTRITIONIST, ADMIN
  tenantId: integer('tenant_id'), // Will be linked to tenants table
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

// Badge entry type for gamification badges stored as JSON
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Gamification = typeof gamification.$inferSelect;

// --- SaaS & AI Platform Models ---

export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  plan: varchar('plan', { length: 20 }).default('FREE'), // FREE, PRO, FAMILY, B2B
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tenantId: integer('tenant_id').references(() => tenants.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull(), // ACTIVE, CANCELED, PAST_DUE
  plan: varchar('plan', { length: 20 }).notNull(), // PRO, FAMILY
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userMetrics = pgTable('user_metrics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique().notNull(),
  preferenceScore: json('preference_score'), // Vector/JSON tracking preferences
  wasteReductionScore: real('waste_reduction_score').default(0), // kg or currency saved
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  instructions: text('instructions'),
  prepTime: integer('prep_time'), // minutes
  cookTime: integer('cook_time'), // minutes
  servings: integer('servings'),
  macros: json('macros'), // { calories, protein, carbs, fat }
  isPremium: boolean('is_premium').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }),
  defaultUnit: varchar('default_unit', { length: 20 }),
  priceEstimate: real('price_estimate'), // For Smart Pricing Inflation-Trigger
  createdAt: timestamp('created_at').defaultNow(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  quantity: real('quantity').notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  isOptional: boolean('is_optional').default(false),
});

export type Tenant = typeof tenants.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserMetrics = typeof userMetrics.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
