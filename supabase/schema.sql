-- ============================================================
-- Repo Ridez — Supabase Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Tables: parkers, activity_feed, visits
-- ============================================================

-- ─── Parkers Table ──────────────────────────────────────────
-- Every GitHub user whose repos have been "parked" in the district

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
  claimed       BOOLEAN DEFAULT FALSE,
  claimed_by    UUID REFERENCES auth.users(id),  -- Supabase auth user
  claimed_at    TIMESTAMPTZ,
  visit_count   INT DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_parkers_github_login ON parkers (github_login);
CREATE INDEX IF NOT EXISTS idx_parkers_claimed_by ON parkers (claimed_by);
CREATE INDEX IF NOT EXISTS idx_parkers_total_stars ON parkers (total_stars DESC);

-- ─── Activity Feed Table ────────────────────────────────────
-- Events: parked, claimed, visited, starred

CREATE TABLE IF NOT EXISTS activity_feed (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  TEXT NOT NULL,
  actor_id    BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  target_id   BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_created ON activity_feed (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_actor ON activity_feed (actor_id);

-- ─── Visits Table ───────────────────────────────────────────
-- Track who visited whose parking section

CREATE TABLE IF NOT EXISTS visits (
  id              BIGSERIAL PRIMARY KEY,
  visitor_id      BIGINT REFERENCES parkers(id) ON DELETE SET NULL,
  target_id       BIGINT REFERENCES parkers(id) ON DELETE CASCADE NOT NULL,
  visitor_ip_hash TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_target ON visits (target_id);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits (created_at DESC);

-- ─── Row Level Security (RLS) ───────────────────────────────
-- RLS: anon can read, authenticated can write own records

-- Parkers: anyone can read, only owner can update their own record
ALTER TABLE parkers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read parkers"
  ON parkers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert parkers"
  ON parkers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own claimed record"
  ON parkers FOR UPDATE
  USING (
    claimed_by = auth.uid()
    OR claimed = false  -- Allow claiming unclaimed records
  );

-- Activity Feed: anyone can read, authenticated can insert
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity feed"
  ON activity_feed FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert feed events"
  ON activity_feed FOR INSERT
  WITH CHECK (true);

-- Visits: anyone can read, anyone can insert (anonymous visits allowed)
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visits"
  ON visits FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert visits"
  ON visits FOR INSERT
  WITH CHECK (true);

-- ─── Realtime ───────────────────────────────────────────────
-- Enable realtime for activity feed (for live ticker)

ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- ─── Auto-cleanup old feed events (30 days) ─────────────────
-- Periodic cleanup of old feed events

CREATE OR REPLACE FUNCTION cleanup_old_feed_events()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_feed
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
