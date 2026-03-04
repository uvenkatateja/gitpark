-- ============================================================
-- Repo Ridez — Supabase Master Database Schema
-- Version: 3.1 (Social Update)
-- ============================================================

-- ─── 1. Core Citizens Table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS parkers (
  id            BIGSERIAL PRIMARY KEY,
  github_login  TEXT NOT NULL UNIQUE,
  github_id     BIGINT,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  public_repos  INT DEFAULT 0,
  total_stars   INT DEFAULT 0,
  total_forks   INT DEFAULT 0,
  primary_language TEXT,
  top_repos     JSONB NOT NULL DEFAULT '[]'::jsonb,
  rank          INT,
  claimed       BOOLEAN DEFAULT FALSE,
  claimed_by    UUID REFERENCES auth.users(id),
  claimed_at    TIMESTAMPTZ,
  visit_count   INT DEFAULT 0,
  kudos_count   INT DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  fetched_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parkers_login ON parkers (github_login);
CREATE INDEX IF NOT EXISTS idx_parkers_stars ON parkers (total_stars DESC);
CREATE INDEX IF NOT EXISTS idx_parkers_rank ON parkers (rank);
CREATE INDEX IF NOT EXISTS idx_parkers_claimed ON parkers (claimed) WHERE claimed = true;

-- ─── 2. Social & Interactions ────────────────────────────────
-- Track daily kudos (likes) between citizens
CREATE TABLE IF NOT EXISTS parker_kudos (
  giver_id      BIGINT NOT NULL REFERENCES parkers(id) ON DELETE CASCADE,
  target_id     BIGINT NOT NULL REFERENCES parkers(id) ON DELETE CASCADE,
  given_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (giver_id, target_id, given_date)
);

-- Track profile visits
CREATE TABLE IF NOT EXISTS visits (
  id              BIGSERIAL PRIMARY KEY,
  visitor_id      BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  target_id       BIGINT REFERENCES parkers(id) ON DELETE CASCADE NOT NULL,
  visitor_ip_hash TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Infrastructure & Logs ────────────────────────────────
-- Activity feed for the live ticker
CREATE TABLE IF NOT EXISTS activity_feed (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  TEXT NOT NULL, -- 'parked', 'claimed', 'visited', 'starred'
  actor_id    BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  target_id   BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting (10 new profile lookups per hour per user)
CREATE TABLE IF NOT EXISTS search_requests (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  github_login TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global counters placeholder (Singleton)
CREATE TABLE IF NOT EXISTS district_stats (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_parkers   INT NOT NULL DEFAULT 0,
  total_stars     BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO district_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ─── 4. Row Level Security (RLS) ─────────────────────────────
ALTER TABLE parkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read parkers" ON parkers FOR SELECT USING (true);
CREATE POLICY "Auth users insert" ON parkers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Claimed update" ON parkers FOR UPDATE USING (auth.uid() IS NOT NULL AND (claimed_by = auth.uid() OR claimed = false));

ALTER TABLE search_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Search limit self" ON search_requests FOR ALL USING (user_id = auth.uid());

ALTER TABLE parker_kudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read kudos" ON parker_kudos FOR SELECT USING (true);
CREATE POLICY "Citizens give kudos" ON parker_kudos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feed" ON activity_feed FOR SELECT USING (true);
CREATE POLICY "Feed event logging" ON activity_feed FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE district_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stats" ON district_stats FOR SELECT USING (true);

-- ─── 5. Automation Functions ─────────────────────────────────
-- Atomic kudos increment
CREATE OR REPLACE FUNCTION increment_kudos_count(target_p_id BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE parkers SET kudos_count = kudos_count + 1 WHERE id = target_p_id;
END;
$$;

-- Global rank recalculation & District Stats update
CREATE OR REPLACE FUNCTION recalculate_ranks()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Refresh ranks based on stars
  WITH ranked AS (
    SELECT id, row_number() OVER (ORDER BY total_stars DESC, github_login ASC) AS new_rank
    FROM parkers
  )
  UPDATE parkers p SET rank = r.new_rank FROM ranked r WHERE p.id = r.id;

  -- 2. Update global singleton stats
  UPDATE district_stats
  SET total_parkers = (SELECT count(*) FROM parkers),
      total_stars   = (SELECT coalesce(sum(total_stars), 0) FROM parkers),
      updated_at    = now()
  WHERE id = 1;
END;
$$;

-- ─── 6. Realtime ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
