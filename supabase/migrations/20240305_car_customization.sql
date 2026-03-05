-- Car Customization Migration
-- Adds customization options for user cars

-- Create car_customizations table
CREATE TABLE IF NOT EXISTS car_customizations (
  id BIGSERIAL PRIMARY KEY,
  parker_id BIGINT REFERENCES parkers(id) ON DELETE CASCADE,
  repo_id BIGINT NOT NULL,
  repo_name TEXT NOT NULL,
  
  -- Visual customizations
  color TEXT DEFAULT NULL, -- Hex color code
  decals TEXT[] DEFAULT '{}', -- Array of decal IDs
  underglow TEXT DEFAULT NULL, -- Hex color for underglow
  exhaust TEXT DEFAULT NULL, -- Hex color for exhaust smoke
  plate TEXT DEFAULT NULL, -- Custom license plate text (max 8 chars)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parker_id, repo_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_customizations_parker ON car_customizations(parker_id);
CREATE INDEX IF NOT EXISTS idx_car_customizations_repo ON car_customizations(repo_id);

-- Create customization_items table (available items to unlock/purchase)
CREATE TABLE IF NOT EXISTS customization_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('color', 'decal', 'underglow', 'exhaust', 'plate_style')),
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  
  -- Unlock requirements
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('free', 'achievement', 'streak', 'premium', 'event')),
  unlock_requirement TEXT, -- Achievement ID, streak count, etc.
  
  -- Pricing (if premium)
  price_coins INT DEFAULT 0,
  
  -- Visual data
  value TEXT NOT NULL, -- Hex color, decal SVG path, etc.
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- Metadata
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_unlocked_items table (tracks what each user has unlocked)
CREATE TABLE IF NOT EXISTS user_unlocked_items (
  parker_id BIGINT REFERENCES parkers(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES customization_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_method TEXT, -- 'achievement', 'purchase', 'event', etc.
  PRIMARY KEY (parker_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_unlocked_items_parker ON user_unlocked_items(parker_id);
CREATE INDEX IF NOT EXISTS idx_customization_items_category ON customization_items(category, rarity);

-- Insert default free customization items
INSERT INTO customization_items (id, category, name, description, unlock_type, value, rarity, sort_order) VALUES
  -- Free colors
  ('color_red', 'color', 'Racing Red', 'Classic racing red', 'free', '#FF0000', 'common', 1),
  ('color_blue', 'color', 'Ocean Blue', 'Deep ocean blue', 'free', '#0066FF', 'common', 2),
  ('color_green', 'color', 'Forest Green', 'Rich forest green', 'free', '#00AA00', 'common', 3),
  ('color_yellow', 'color', 'Sunshine Yellow', 'Bright sunshine yellow', 'free', '#FFD700', 'common', 4),
  ('color_black', 'color', 'Midnight Black', 'Sleek midnight black', 'free', '#000000', 'common', 5),
  ('color_white', 'color', 'Pearl White', 'Elegant pearl white', 'free', '#FFFFFF', 'common', 6),
  ('color_silver', 'color', 'Chrome Silver', 'Metallic chrome silver', 'free', '#C0C0C0', 'common', 7),
  ('color_purple', 'color', 'Royal Purple', 'Majestic royal purple', 'free', '#9933FF', 'common', 8),
  
  -- Achievement-locked colors
  ('color_gold', 'color', 'Golden Glory', 'Legendary gold finish', 'achievement', '#FFD700', 'legendary', 100),
  ('color_rainbow', 'color', 'Rainbow Shift', 'Iridescent rainbow effect', 'achievement', 'rainbow', 'legendary', 101),
  ('color_neon_pink', 'color', 'Neon Pink', 'Electric neon pink', 'streak', '#FF1493', 'epic', 102),
  ('color_cyber_cyan', 'color', 'Cyber Cyan', 'Futuristic cyan', 'streak', '#00FFFF', 'epic', 103),
  
  -- Free decals
  ('decal_flame', 'decal', 'Flame Decal', 'Racing flames', 'free', 'flame', 'common', 200),
  ('decal_stripe', 'decal', 'Racing Stripe', 'Classic racing stripe', 'free', 'stripe', 'common', 201),
  ('decal_star', 'decal', 'Star Badge', 'Star badge decal', 'free', 'star', 'common', 202),
  
  -- Achievement decals
  ('decal_trophy', 'decal', 'Trophy Decal', 'Winner trophy', 'achievement', 'trophy', 'rare', 210),
  ('decal_fire', 'decal', 'Fire Decal', 'Blazing fire', 'streak', 'fire', 'epic', 211),
  ('decal_lightning', 'decal', 'Lightning Bolt', 'Electric lightning', 'achievement', 'lightning', 'epic', 212),
  
  -- Underglow colors
  ('underglow_blue', 'underglow', 'Blue Underglow', 'Cool blue glow', 'free', '#0066FF', 'common', 300),
  ('underglow_green', 'underglow', 'Green Underglow', 'Toxic green glow', 'free', '#00FF00', 'common', 301),
  ('underglow_purple', 'underglow', 'Purple Underglow', 'Mystic purple glow', 'free', '#9933FF', 'common', 302),
  ('underglow_rainbow', 'underglow', 'Rainbow Underglow', 'Cycling rainbow glow', 'achievement', 'rainbow', 'legendary', 310),
  
  -- Exhaust colors
  ('exhaust_white', 'exhaust', 'White Smoke', 'Classic white smoke', 'free', '#FFFFFF', 'common', 400),
  ('exhaust_blue', 'exhaust', 'Blue Flame', 'Cool blue exhaust', 'free', '#4444FF', 'common', 401),
  ('exhaust_red', 'exhaust', 'Red Flame', 'Hot red exhaust', 'streak', '#FF4444', 'rare', 402),
  ('exhaust_rainbow', 'exhaust', 'Rainbow Flame', 'Magical rainbow exhaust', 'achievement', 'rainbow', 'legendary', 410)
ON CONFLICT (id) DO NOTHING;

-- Function to save car customization
CREATE OR REPLACE FUNCTION save_car_customization(
  p_parker_id BIGINT,
  p_repo_id BIGINT,
  p_repo_name TEXT,
  p_color TEXT DEFAULT NULL,
  p_decals TEXT[] DEFAULT NULL,
  p_underglow TEXT DEFAULT NULL,
  p_exhaust TEXT DEFAULT NULL,
  p_plate TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO car_customizations (
    parker_id, repo_id, repo_name, color, decals, underglow, exhaust, plate, updated_at
  ) VALUES (
    p_parker_id, p_repo_id, p_repo_name, p_color, p_decals, p_underglow, p_exhaust, p_plate, NOW()
  )
  ON CONFLICT (parker_id, repo_id) 
  DO UPDATE SET
    color = COALESCE(p_color, car_customizations.color),
    decals = COALESCE(p_decals, car_customizations.decals),
    underglow = COALESCE(p_underglow, car_customizations.underglow),
    exhaust = COALESCE(p_exhaust, car_customizations.exhaust),
    plate = COALESCE(p_plate, car_customizations.plate),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock item for user
CREATE OR REPLACE FUNCTION unlock_customization_item(
  p_parker_id BIGINT,
  p_item_id TEXT,
  p_unlock_method TEXT DEFAULT 'manual'
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_unlocked_items (parker_id, item_id, unlock_method)
  VALUES (p_parker_id, p_item_id, p_unlock_method)
  ON CONFLICT (parker_id, item_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's customizations
CREATE OR REPLACE FUNCTION get_user_customizations(p_parker_id BIGINT)
RETURNS TABLE(
  repo_id BIGINT,
  repo_name TEXT,
  color TEXT,
  decals TEXT[],
  underglow TEXT,
  exhaust TEXT,
  plate TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.repo_id,
    cc.repo_name,
    cc.color,
    cc.decals,
    cc.underglow,
    cc.exhaust,
    cc.plate
  FROM car_customizations cc
  WHERE cc.parker_id = p_parker_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get available items for user
CREATE OR REPLACE FUNCTION get_available_customization_items(p_parker_id BIGINT)
RETURNS TABLE(
  item_id TEXT,
  category TEXT,
  name TEXT,
  description TEXT,
  value TEXT,
  rarity TEXT,
  is_unlocked BOOLEAN,
  unlock_type TEXT,
  unlock_requirement TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.category,
    ci.name,
    ci.description,
    ci.value,
    ci.rarity,
    EXISTS(SELECT 1 FROM user_unlocked_items WHERE parker_id = p_parker_id AND item_id = ci.id) as is_unlocked,
    ci.unlock_type,
    ci.unlock_requirement
  FROM customization_items ci
  WHERE ci.is_active = TRUE
  ORDER BY ci.category, ci.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-unlock free items on first customization
CREATE OR REPLACE FUNCTION auto_unlock_free_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Unlock all free items for new users
  INSERT INTO user_unlocked_items (parker_id, item_id, unlock_method)
  SELECT NEW.parker_id, id, 'auto'
  FROM customization_items
  WHERE unlock_type = 'free'
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_unlock_free_items ON car_customizations;
CREATE TRIGGER trigger_auto_unlock_free_items
  AFTER INSERT ON car_customizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_unlock_free_items();

COMMENT ON TABLE car_customizations IS 'Stores user car customization preferences';
COMMENT ON TABLE customization_items IS 'Master list of available customization items';
COMMENT ON TABLE user_unlocked_items IS 'Tracks which items each user has unlocked';
