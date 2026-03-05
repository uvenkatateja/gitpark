-- Item Shop Migration
-- Virtual currency and purchasable items system

-- Add coins column to parkers table
ALTER TABLE parkers 
ADD COLUMN IF NOT EXISTS coins INT DEFAULT 100, -- Start with 100 coins
ADD COLUMN IF NOT EXISTS total_coins_earned INT DEFAULT 100,
ADD COLUMN IF NOT EXISTS last_daily_claim DATE;

-- Create shop_items table
CREATE TABLE IF NOT EXISTS shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('color', 'decal', 'decoration', 'effect', 'boost', 'special')),
  icon TEXT NOT NULL,
  preview_url TEXT,
  
  -- Item properties
  value TEXT, -- Color hex, decal ID, etc.
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_limited BOOLEAN DEFAULT FALSE,
  limited_stock INT,
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  -- Requirements
  min_level INT DEFAULT 0,
  required_achievement TEXT,
  
  -- Metadata
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create parker_inventory table
CREATE TABLE IF NOT EXISTS parker_inventory (
  parker_id BIGINT REFERENCES parkers(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES shop_items(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (parker_id, item_id)
);

-- Create coin_transactions table (audit trail)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  parker_id BIGINT REFERENCES parkers(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- Positive for earning, negative for spending
  balance_after INT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'daily_claim', 'achievement', 'streak_bonus', 'purchase', 
    'gift_sent', 'gift_received', 'admin', 'refund'
  )),
  reference_id TEXT, -- Achievement ID, item ID, etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parker_inventory_parker ON parker_inventory(parker_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category, is_active);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_parker ON coin_transactions(parker_id, created_at DESC);

-- Insert default shop items
INSERT INTO shop_items (id, name, description, price, category, icon, value, rarity, sort_order) VALUES
  -- Premium colors
  ('shop_color_crimson', 'Crimson Red', 'Deep crimson red paint', 50, 'color', '🎨', '#DC143C', 'rare', 100),
  ('shop_color_emerald', 'Emerald Green', 'Brilliant emerald green', 50, 'color', '🎨', '#50C878', 'rare', 101),
  ('shop_color_sapphire', 'Sapphire Blue', 'Rich sapphire blue', 50, 'color', '🎨', '#0F52BA', 'rare', 102),
  ('shop_color_amethyst', 'Amethyst Purple', 'Mystical amethyst purple', 75, 'color', '🎨', '#9966CC', 'epic', 103),
  ('shop_color_rose_gold', 'Rose Gold', 'Elegant rose gold finish', 100, 'color', '🎨', '#B76E79', 'epic', 104),
  ('shop_color_midnight', 'Midnight Blue', 'Deep midnight blue', 75, 'color', '🎨', '#191970', 'epic', 105),
  ('shop_color_chrome', 'Chrome Finish', 'Reflective chrome', 150, 'color', '🎨', '#E5E4E2', 'legendary', 106),
  ('shop_color_holographic', 'Holographic', 'Shifting holographic effect', 200, 'color', '🎨', 'holographic', 'legendary', 107),
  
  -- Premium decals
  ('shop_decal_wings', 'Angel Wings', 'Majestic angel wings', 75, 'decal', '⭐', 'wings', 'epic', 200),
  ('shop_decal_dragon', 'Dragon Emblem', 'Fierce dragon emblem', 100, 'decal', '⭐', 'dragon', 'epic', 201),
  ('shop_decal_crown', 'Royal Crown', 'Regal crown decal', 150, 'decal', '⭐', 'crown', 'legendary', 202),
  ('shop_decal_skull', 'Skull Badge', 'Edgy skull badge', 50, 'decal', '⭐', 'skull', 'rare', 203),
  ('shop_decal_checkered', 'Checkered Flag', 'Racing checkered pattern', 50, 'decal', '⭐', 'checkered', 'rare', 204),
  
  -- Decorations
  ('shop_deco_cone', 'Traffic Cone', 'Classic orange traffic cone', 25, 'decoration', '🚧', 'cone', 'common', 300),
  ('shop_deco_plant', 'Potted Plant', 'Small decorative plant', 30, 'decoration', '🪴', 'plant', 'common', 301),
  ('shop_deco_sign', 'Reserved Sign', 'Reserved parking sign', 40, 'decoration', '🪧', 'sign', 'common', 302),
  ('shop_deco_lamp', 'Street Lamp', 'Vintage street lamp', 75, 'decoration', '💡', 'lamp', 'rare', 303),
  ('shop_deco_fountain', 'Water Fountain', 'Elegant water fountain', 150, 'decoration', '⛲', 'fountain', 'epic', 304),
  ('shop_deco_statue', 'Gold Statue', 'Prestigious gold statue', 250, 'decoration', '🗿', 'statue', 'legendary', 305),
  
  -- Effects
  ('shop_effect_sparkle', 'Sparkle Trail', 'Magical sparkle effect', 100, 'effect', '✨', 'sparkle', 'epic', 400),
  ('shop_effect_smoke', 'Smoke Trail', 'Cool smoke trail', 75, 'effect', '💨', 'smoke', 'rare', 401),
  ('shop_effect_confetti', 'Confetti Burst', 'Celebration confetti', 50, 'effect', '🎉', 'confetti', 'rare', 402),
  
  -- Boosts
  ('shop_boost_2x_coins', '2x Coins (24h)', 'Double coin earnings for 24 hours', 200, 'boost', '💰', '2x_coins_24h', 'epic', 500),
  ('shop_boost_streak_freeze', 'Streak Freeze', 'Protect your streak for 3 days', 150, 'boost', '❄️', 'streak_freeze_3d', 'rare', 501),
  ('shop_boost_xp', 'XP Boost (24h)', 'Double XP for 24 hours', 150, 'boost', '⚡', 'xp_boost_24h', 'rare', 502)
ON CONFLICT (id) DO NOTHING;

-- Function to award coins
CREATE OR REPLACE FUNCTION award_coins(
  p_parker_id BIGINT,
  p_amount INT,
  p_transaction_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_balance INT, transaction_id BIGINT) AS $$
DECLARE
  v_new_balance INT;
  v_transaction_id BIGINT;
BEGIN
  -- Update parker coins
  UPDATE parkers
  SET 
    coins = coins + p_amount,
    total_coins_earned = total_coins_earned + GREATEST(p_amount, 0)
  WHERE id = p_parker_id
  RETURNING coins INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO coin_transactions (
    parker_id, amount, balance_after, transaction_type, reference_id, description
  ) VALUES (
    p_parker_id, p_amount, v_new_balance, p_transaction_type, p_reference_id, p_description
  ) RETURNING id INTO v_transaction_id;
  
  RETURN QUERY SELECT v_new_balance, v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to purchase item
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_parker_id BIGINT,
  p_item_id TEXT,
  p_quantity INT DEFAULT 1
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance INT,
  error_message TEXT
) AS $$
DECLARE
  v_item RECORD;
  v_current_coins INT;
  v_total_cost INT;
  v_new_balance INT;
  v_has_item BOOLEAN;
BEGIN
  -- Get item details
  SELECT * INTO v_item
  FROM shop_items
  WHERE id = p_item_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Item not found or unavailable';
    RETURN;
  END IF;
  
  -- Check if already owned (for non-stackable items)
  IF v_item.category IN ('color', 'decal', 'effect') THEN
    SELECT EXISTS(
      SELECT 1 FROM parker_inventory 
      WHERE parker_id = p_parker_id AND item_id = p_item_id
    ) INTO v_has_item;
    
    IF v_has_item THEN
      RETURN QUERY SELECT FALSE, 0, 'Already owned';
      RETURN;
    END IF;
  END IF;
  
  -- Calculate cost
  v_total_cost := v_item.price * p_quantity;
  
  -- Get current coins
  SELECT coins INTO v_current_coins
  FROM parkers
  WHERE id = p_parker_id;
  
  -- Check if enough coins
  IF v_current_coins < v_total_cost THEN
    RETURN QUERY SELECT FALSE, v_current_coins, 'Insufficient coins';
    RETURN;
  END IF;
  
  -- Deduct coins
  SELECT new_balance INTO v_new_balance
  FROM award_coins(
    p_parker_id,
    -v_total_cost,
    'purchase',
    p_item_id,
    'Purchased ' || v_item.name
  );
  
  -- Add to inventory
  INSERT INTO parker_inventory (parker_id, item_id, quantity)
  VALUES (p_parker_id, p_item_id, p_quantity)
  ON CONFLICT (parker_id, item_id)
  DO UPDATE SET quantity = parker_inventory.quantity + p_quantity;
  
  RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to claim daily free coins
CREATE OR REPLACE FUNCTION claim_daily_coins(p_parker_id BIGINT)
RETURNS TABLE(
  success BOOLEAN,
  coins_awarded INT,
  new_balance INT,
  next_claim_date DATE
) AS $$
DECLARE
  v_last_claim DATE;
  v_today DATE := CURRENT_DATE;
  v_coins_to_award INT := 50; -- Base daily amount
  v_current_streak INT;
  v_bonus INT := 0;
  v_new_balance INT;
BEGIN
  -- Get last claim date and streak
  SELECT last_daily_claim, current_streak INTO v_last_claim, v_current_streak
  FROM parkers
  WHERE id = p_parker_id;
  
  -- Check if already claimed today
  IF v_last_claim = v_today THEN
    RETURN QUERY SELECT FALSE, 0, 0, v_today + INTERVAL '1 day';
    RETURN;
  END IF;
  
  -- Streak bonus (5 coins per day of streak, max 100)
  v_bonus := LEAST(v_current_streak * 5, 100);
  v_coins_to_award := v_coins_to_award + v_bonus;
  
  -- Award coins
  SELECT new_balance INTO v_new_balance
  FROM award_coins(
    p_parker_id,
    v_coins_to_award,
    'daily_claim',
    NULL,
    'Daily coins + ' || v_bonus || ' streak bonus'
  );
  
  -- Update last claim date
  UPDATE parkers
  SET last_daily_claim = v_today
  WHERE id = p_parker_id;
  
  RETURN QUERY SELECT TRUE, v_coins_to_award, v_new_balance, v_today + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to gift coins to another user
CREATE OR REPLACE FUNCTION gift_coins(
  p_sender_id BIGINT,
  p_receiver_id BIGINT,
  p_amount INT
)
RETURNS TABLE(
  success BOOLEAN,
  sender_balance INT,
  error_message TEXT
) AS $$
DECLARE
  v_sender_coins INT;
  v_sender_balance INT;
  v_receiver_balance INT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 OR p_amount > 1000 THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid amount (1-1000)';
    RETURN;
  END IF;
  
  -- Check sender has enough coins
  SELECT coins INTO v_sender_coins
  FROM parkers
  WHERE id = p_sender_id;
  
  IF v_sender_coins < p_amount THEN
    RETURN QUERY SELECT FALSE, v_sender_coins, 'Insufficient coins';
    RETURN;
  END IF;
  
  -- Deduct from sender
  SELECT new_balance INTO v_sender_balance
  FROM award_coins(
    p_sender_id,
    -p_amount,
    'gift_sent',
    p_receiver_id::TEXT,
    'Gift to user ' || p_receiver_id
  );
  
  -- Add to receiver
  SELECT new_balance INTO v_receiver_balance
  FROM award_coins(
    p_receiver_id,
    p_amount,
    'gift_received',
    p_sender_id::TEXT,
    'Gift from user ' || p_sender_id
  );
  
  RETURN QUERY SELECT TRUE, v_sender_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award coins on achievement unlock
CREATE OR REPLACE FUNCTION award_coins_on_achievement()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement RECORD;
  v_coin_reward INT;
BEGIN
  -- Get achievement tier
  SELECT tier INTO v_achievement
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  -- Calculate coin reward based on tier
  v_coin_reward := CASE v_achievement.tier
    WHEN 'bronze' THEN 10
    WHEN 'silver' THEN 25
    WHEN 'gold' THEN 50
    WHEN 'diamond' THEN 100
    ELSE 10
  END;
  
  -- Award coins
  PERFORM award_coins(
    NEW.parker_id,
    v_coin_reward,
    'achievement',
    NEW.achievement_id,
    'Achievement: ' || NEW.achievement_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_coins_on_achievement ON parker_achievements;
CREATE TRIGGER trigger_award_coins_on_achievement
  AFTER INSERT ON parker_achievements
  FOR EACH ROW
  EXECUTE FUNCTION award_coins_on_achievement();

-- Trigger to award coins on check-in
CREATE OR REPLACE FUNCTION award_coins_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_coin_reward INT := 10; -- Base check-in reward
  v_streak_bonus INT;
BEGIN
  -- Only award if check-in date changed
  IF NEW.last_checkin_date IS DISTINCT FROM OLD.last_checkin_date THEN
    -- Streak bonus (1 coin per day, max 50)
    v_streak_bonus := LEAST(NEW.current_streak, 50);
    v_coin_reward := v_coin_reward + v_streak_bonus;
    
    -- Award coins
    PERFORM award_coins(
      NEW.id,
      v_coin_reward,
      'daily_claim',
      NULL,
      'Check-in + ' || v_streak_bonus || ' streak bonus'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_coins_on_checkin ON parkers;
CREATE TRIGGER trigger_award_coins_on_checkin
  AFTER UPDATE ON parkers
  FOR EACH ROW
  WHEN (NEW.last_checkin_date IS DISTINCT FROM OLD.last_checkin_date)
  EXECUTE FUNCTION award_coins_on_checkin();

COMMENT ON TABLE shop_items IS 'Available items in the shop';
COMMENT ON TABLE parker_inventory IS 'Items owned by each parker';
COMMENT ON TABLE coin_transactions IS 'Audit trail of all coin transactions';
COMMENT ON FUNCTION award_coins IS 'Award or deduct coins from a parker';
COMMENT ON FUNCTION purchase_shop_item IS 'Purchase an item from the shop';
COMMENT ON FUNCTION claim_daily_coins IS 'Claim daily free coins with streak bonus';
COMMENT ON FUNCTION gift_coins IS 'Gift coins to another user';
