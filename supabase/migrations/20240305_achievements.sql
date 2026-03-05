-- Achievement System Migration
-- Creates tables for achievements and parker achievements

-- Achievements table (master list of all achievements)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('parking', 'repos', 'stars', 'streak', 'social', 'language')),
  requirement_value INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parker achievements (tracks which achievements each user has unlocked)
CREATE TABLE IF NOT EXISTS parker_achievements (
  parker_id BIGINT REFERENCES parkers(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  seen BOOLEAN DEFAULT FALSE,
  progress INTEGER DEFAULT 0,
  PRIMARY KEY (parker_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parker_achievements_parker ON parker_achievements(parker_id);
CREATE INDEX IF NOT EXISTS idx_parker_achievements_unseen ON parker_achievements(parker_id, seen) WHERE seen = FALSE;
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category, tier);

-- Insert achievement definitions
INSERT INTO achievements (id, name, description, tier, icon, category, requirement_value, sort_order) VALUES
  -- Parking achievements
  ('first_park', 'First Park', 'Welcome to Repo-Ridez! Your journey begins.', 'bronze', '🚗', 'parking', 1, 1),
  ('regular_parker', 'Regular Parker', 'Checked in 7 times', 'bronze', '🅿️', 'parking', 7, 2),
  ('dedicated_parker', 'Dedicated Parker', 'Checked in 30 times', 'silver', '🏅', 'parking', 30, 3),
  ('parking_legend', 'Parking Legend', 'Checked in 100 times', 'gold', '👑', 'parking', 100, 4),
  ('parking_master', 'Parking Master', 'Checked in 365 times', 'diamond', '💎', 'parking', 365, 5),

  -- Repo achievements
  ('repo_starter', 'Repo Starter', 'Own 5 repositories', 'bronze', '📦', 'repos', 5, 10),
  ('repo_collector', 'Repo Collector', 'Own 10 repositories', 'bronze', '📚', 'repos', 10, 11),
  ('repo_enthusiast', 'Repo Enthusiast', 'Own 25 repositories', 'silver', '🎯', 'repos', 25, 12),
  ('repo_hoarder', 'Repo Hoarder', 'Own 50 repositories', 'gold', '🏆', 'repos', 50, 13),
  ('repo_empire', 'Repo Empire', 'Own 100 repositories', 'diamond', '🌟', 'repos', 100, 14),

  -- Star achievements
  ('first_star', 'First Star', 'Earned your first star', 'bronze', '⭐', 'stars', 1, 20),
  ('rising_star', 'Rising Star', 'Earned 100 stars', 'bronze', '🌠', 'stars', 100, 21),
  ('star_gazer', 'Star Gazer', 'Earned 500 stars', 'silver', '✨', 'stars', 500, 22),
  ('star_power', 'Star Power', 'Earned 1,000 stars', 'gold', '💫', 'stars', 1000, 23),
  ('supernova', 'Supernova', 'Earned 5,000 stars', 'diamond', '🌟', 'stars', 5000, 24),

  -- Streak achievements
  ('streak_starter', 'Streak Starter', 'Maintained a 3-day streak', 'bronze', '🔥', 'streak', 3, 30),
  ('consistent_parker', 'Consistent Parker', 'Maintained a 7-day streak', 'bronze', '📅', 'streak', 7, 31),
  ('dedicated_streaker', 'Dedicated Streaker', 'Maintained a 30-day streak', 'silver', '⚡', 'streak', 30, 32),
  ('unstoppable', 'Unstoppable', 'Maintained a 100-day streak', 'gold', '🚀', 'streak', 100, 33),
  ('eternal_parker', 'Eternal Parker', 'Maintained a 365-day streak', 'diamond', '♾️', 'streak', 365, 34),

  -- Social achievements
  ('friendly_parker', 'Friendly Parker', 'Gave 10 kudos', 'bronze', '👋', 'social', 10, 40),
  ('social_butterfly', 'Social Butterfly', 'Gave 50 kudos', 'silver', '🦋', 'social', 50, 41),
  ('community_champion', 'Community Champion', 'Gave 100 kudos', 'gold', '🏅', 'social', 100, 42),
  ('popular_spot', 'Popular Spot', 'Received 10 kudos', 'bronze', '💝', 'social', 10, 43),
  ('crowd_favorite', 'Crowd Favorite', 'Received 50 kudos', 'silver', '🎉', 'social', 50, 44),
  ('legendary_parker', 'Legendary Parker', 'Received 100 kudos', 'gold', '🌟', 'social', 100, 45),

  -- Language achievements
  ('polyglot_beginner', 'Polyglot Beginner', 'Used 3 different languages', 'bronze', '🗣️', 'language', 3, 50),
  ('language_explorer', 'Language Explorer', 'Used 5 different languages', 'bronze', '🌍', 'language', 5, 51),
  ('language_master', 'Language Master', 'Used 10 different languages', 'silver', '🎓', 'language', 10, 52),
  ('polyglot_expert', 'Polyglot Expert', 'Used 15 different languages', 'gold', '🧠', 'language', 15, 53),
  ('language_god', 'Language God', 'Used 20 different languages', 'diamond', '🔮', 'language', 20, 54)
ON CONFLICT (id) DO NOTHING;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_parker_id BIGINT)
RETURNS TABLE(achievement_id TEXT, newly_unlocked BOOLEAN) AS $$
DECLARE
  v_parker RECORD;
  v_achievement RECORD;
  v_exists BOOLEAN;
BEGIN
  -- Get parker stats
  SELECT 
    p.id,
    p.total_checkins,
    p.current_streak,
    p.kudos_given,
    p.kudos_received,
    COUNT(DISTINCT r.id) as repo_count,
    COALESCE(SUM(r.stars), 0) as total_stars,
    COUNT(DISTINCT r.language) FILTER (WHERE r.language IS NOT NULL) as language_count
  INTO v_parker
  FROM parkers p
  LEFT JOIN repos r ON r.parker_id = p.id
  WHERE p.id = p_parker_id
  GROUP BY p.id, p.total_checkins, p.current_streak, p.kudos_given, p.kudos_received;

  -- Check each achievement
  FOR v_achievement IN SELECT * FROM achievements ORDER BY sort_order LOOP
    v_exists := EXISTS(
      SELECT 1 FROM parker_achievements 
      WHERE parker_id = p_parker_id AND achievement_id = v_achievement.id
    );

    -- Check if achievement should be awarded
    IF NOT v_exists THEN
      IF (v_achievement.category = 'parking' AND v_parker.total_checkins >= v_achievement.requirement_value) OR
         (v_achievement.category = 'repos' AND v_parker.repo_count >= v_achievement.requirement_value) OR
         (v_achievement.category = 'stars' AND v_parker.total_stars >= v_achievement.requirement_value) OR
         (v_achievement.category = 'streak' AND v_parker.current_streak >= v_achievement.requirement_value) OR
         (v_achievement.category = 'social' AND v_achievement.id LIKE '%gave%' AND v_parker.kudos_given >= v_achievement.requirement_value) OR
         (v_achievement.category = 'social' AND v_achievement.id LIKE '%received%' AND v_parker.kudos_received >= v_achievement.requirement_value) OR
         (v_achievement.category = 'language' AND v_parker.language_count >= v_achievement.requirement_value)
      THEN
        INSERT INTO parker_achievements (parker_id, achievement_id, seen)
        VALUES (p_parker_id, v_achievement.id, FALSE);
        
        achievement_id := v_achievement.id;
        newly_unlocked := TRUE;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE achievements IS 'Master list of all available achievements';
COMMENT ON TABLE parker_achievements IS 'Tracks which achievements each parker has unlocked';
COMMENT ON FUNCTION check_and_award_achievements IS 'Checks parker stats and awards any newly earned achievements';
