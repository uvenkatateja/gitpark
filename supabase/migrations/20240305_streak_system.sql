-- Streak System Migration
-- Adds streak tracking columns and functions

-- Add streak columns to parkers table
ALTER TABLE parkers 
ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
ADD COLUMN IF NOT EXISTS total_checkins INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_frozen_until DATE;

-- Create index for efficient streak queries
CREATE INDEX IF NOT EXISTS idx_parkers_last_checkin ON parkers(last_checkin_date);
CREATE INDEX IF NOT EXISTS idx_parkers_current_streak ON parkers(current_streak DESC);

-- Function to handle daily check-in
CREATE OR REPLACE FUNCTION handle_daily_checkin(p_parker_id BIGINT)
RETURNS TABLE(
  success BOOLEAN,
  current_streak INT,
  longest_streak INT,
  is_new_record BOOLEAN,
  checkin_count INT,
  streak_broken BOOLEAN,
  was_frozen BOOLEAN
) AS $$
DECLARE
  v_last_checkin DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_total_checkins INT;
  v_streak_frozen_until DATE;
  v_today DATE := CURRENT_DATE;
  v_is_new_record BOOLEAN := FALSE;
  v_streak_broken BOOLEAN := FALSE;
  v_was_frozen BOOLEAN := FALSE;
BEGIN
  -- Get current parker data
  SELECT 
    last_checkin_date,
    parkers.current_streak,
    parkers.longest_streak,
    parkers.total_checkins,
    parkers.streak_frozen_until
  INTO 
    v_last_checkin,
    v_current_streak,
    v_longest_streak,
    v_total_checkins,
    v_streak_frozen_until
  FROM parkers
  WHERE id = p_parker_id;

  -- Check if already checked in today
  IF v_last_checkin = v_today THEN
    RETURN QUERY SELECT 
      FALSE, 
      v_current_streak, 
      v_longest_streak, 
      FALSE, 
      v_total_checkins,
      FALSE,
      FALSE;
    RETURN;
  END IF;

  -- Check if streak was frozen
  IF v_streak_frozen_until IS NOT NULL AND v_streak_frozen_until >= v_today THEN
    v_was_frozen := TRUE;
  END IF;

  -- Calculate new streak
  IF v_last_checkin IS NULL THEN
    -- First check-in ever
    v_current_streak := 1;
  ELSIF v_last_checkin = v_today - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_was_frozen THEN
    -- Streak was frozen, maintain it
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken - reset to 1
    v_current_streak := 1;
    v_streak_broken := TRUE;
  END IF;

  -- Update longest streak if needed
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
    v_is_new_record := TRUE;
  END IF;

  -- Increment total check-ins
  v_total_checkins := COALESCE(v_total_checkins, 0) + 1;

  -- Update parker record
  UPDATE parkers
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_checkin_date = v_today,
    total_checkins = v_total_checkins,
    updated_at = NOW()
  WHERE id = p_parker_id;

  -- Return results
  RETURN QUERY SELECT 
    TRUE,
    v_current_streak,
    v_longest_streak,
    v_is_new_record,
    v_total_checkins,
    v_streak_broken,
    v_was_frozen;
END;
$$ LANGUAGE plpgsql;

-- Function to freeze streak (premium feature or achievement reward)
CREATE OR REPLACE FUNCTION freeze_streak(p_parker_id BIGINT, p_days INT DEFAULT 1)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE parkers
  SET streak_frozen_until = CURRENT_DATE + (p_days || ' days')::INTERVAL
  WHERE id = p_parker_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get streak leaderboard
CREATE OR REPLACE FUNCTION get_streak_leaderboard(p_limit INT DEFAULT 10)
RETURNS TABLE(
  parker_id BIGINT,
  github_login TEXT,
  avatar_url TEXT,
  current_streak INT,
  longest_streak INT,
  total_checkins INT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.github_login,
    p.avatar_url,
    p.current_streak,
    p.longest_streak,
    p.total_checkins,
    ROW_NUMBER() OVER (ORDER BY p.current_streak DESC, p.longest_streak DESC) as rank
  FROM parkers p
  WHERE p.current_streak > 0
  ORDER BY p.current_streak DESC, p.longest_streak DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can check in today
CREATE OR REPLACE FUNCTION can_checkin_today(p_parker_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_checkin DATE;
BEGIN
  SELECT last_checkin_date INTO v_last_checkin
  FROM parkers
  WHERE id = p_parker_id;
  
  RETURN v_last_checkin IS NULL OR v_last_checkin < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check achievements after check-in
CREATE OR REPLACE FUNCTION trigger_check_achievements_after_checkin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if streak or total_checkins changed
  IF NEW.current_streak != OLD.current_streak OR NEW.total_checkins != OLD.total_checkins THEN
    PERFORM check_and_award_achievements(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_checkin_check_achievements ON parkers;
CREATE TRIGGER after_checkin_check_achievements
  AFTER UPDATE ON parkers
  FOR EACH ROW
  WHEN (NEW.last_checkin_date IS DISTINCT FROM OLD.last_checkin_date)
  EXECUTE FUNCTION trigger_check_achievements_after_checkin();

COMMENT ON FUNCTION handle_daily_checkin IS 'Handles daily check-in logic, updates streaks, and returns results';
COMMENT ON FUNCTION freeze_streak IS 'Freezes a user streak for specified days (premium feature)';
COMMENT ON FUNCTION get_streak_leaderboard IS 'Returns top users by current streak';
COMMENT ON FUNCTION can_checkin_today IS 'Checks if user can check in today';
