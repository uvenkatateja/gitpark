-- Fix achievements function to not reference non-existent repos table
-- The repos data is stored in the top_repos JSONB column in parkers table

CREATE OR REPLACE FUNCTION check_and_award_achievements(p_parker_id BIGINT)
RETURNS TABLE(achievement_id TEXT, newly_unlocked BOOLEAN) AS $$
DECLARE
  v_parker RECORD;
  v_achievement RECORD;
  v_exists BOOLEAN;
BEGIN
  -- Get parker stats (repos are in top_repos JSONB column, not a separate table)
  SELECT 
    p.id,
    COALESCE(p.total_checkins, 0) as total_checkins,
    COALESCE(p.current_streak, 0) as current_streak,
    COALESCE((SELECT COUNT(*) FROM parker_kudos WHERE giver_id = p.id), 0) as kudos_given,
    COALESCE(p.kudos_count, 0) as kudos_received,
    COALESCE(p.public_repos, 0) as repo_count,
    COALESCE(p.total_stars, 0) as total_stars,
    CASE 
      WHEN p.primary_language IS NOT NULL THEN 1
      ELSE 0
    END as language_count
  INTO v_parker
  FROM parkers p
  WHERE p.id = p_parker_id;

  -- If parker not found, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;

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
        VALUES (p_parker_id, v_achievement.id, FALSE)
        ON CONFLICT DO NOTHING;
        
        achievement_id := v_achievement.id;
        newly_unlocked := TRUE;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_award_achievements IS 'Checks parker stats and awards any newly earned achievements (fixed to use parkers table only)';
