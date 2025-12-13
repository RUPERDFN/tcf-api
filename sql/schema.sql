-- TheCookFlow Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User profile
CREATE TABLE IF NOT EXISTS user_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  budget_eur_week DECIMAL(10,2) NOT NULL CHECK (budget_eur_week >= 30 AND budget_eur_week <= 500),
  diners INT NOT NULL CHECK (diners >= 1 AND diners <= 20),
  meals_per_day INT NOT NULL CHECK (meals_per_day >= 1 AND meals_per_day <= 3),
  days INT NOT NULL CHECK (days IN (3, 5, 7)),
  diet_type VARCHAR(100) NOT NULL,
  allergies JSONB DEFAULT '[]',
  favorite_foods JSONB NOT NULL,
  disliked_foods JSONB DEFAULT '[]',
  pantry_items TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  days INT NOT NULL,
  menu_json JSONB NOT NULL,
  total_cost_eur DECIMAL(10,2),
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_user_active ON menus(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_menus_created ON menus(created_at DESC);

-- Shopping lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
  list_json JSONB NOT NULL,
  total_items INT,
  estimated_cost_eur DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_user ON shopping_lists(user_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'free',
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements ON user_achievements(user_id);

-- User stats
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INT DEFAULT 0,
  level INT DEFAULT 1,
  total_menus_generated INT DEFAULT 0,
  total_shopping_lists INT DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events (analytics)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name VARCHAR(255) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);

-- Seed basic achievements
INSERT INTO achievements (code, name, description, icon, points) VALUES
  ('first_menu', 'Primer Menú', 'Crea tu primer menú semanal', '🍽️', 10),
  ('week_streak', 'Semana Completa', 'Genera menús 7 días seguidos', '🔥', 50),
  ('budget_master', 'Maestro del Presupuesto', 'Mantén el presupuesto 5 semanas', '💰', 100),
  ('chef_explorer', 'Chef Explorador', 'Prueba 10 tipos de cocina diferentes', '🌍', 75)
ON CONFLICT (code) DO NOTHING;
