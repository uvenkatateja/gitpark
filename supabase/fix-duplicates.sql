-- ============================================================
-- Fix Duplicate GitHub Logins in Parkers Table
-- ============================================================

-- 1. Find duplicates (case-insensitive)
SELECT 
    LOWER(github_login) as login_lower,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM parkers
GROUP BY LOWER(github_login)
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Keep only the FIRST occurrence of each duplicate (lowest ID)
-- Delete all other duplicates
WITH duplicates AS (
    SELECT 
        id,
        github_login,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(github_login) 
            ORDER BY id ASC
        ) as rn
    FROM parkers
)
DELETE FROM parkers
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Verify no duplicates remain
SELECT 
    LOWER(github_login) as login_lower,
    COUNT(*) as count
FROM parkers
GROUP BY LOWER(github_login)
HAVING COUNT(*) > 1;

-- 4. Add case-insensitive unique constraint if not exists
-- First, make sure github_login is lowercase
UPDATE parkers SET github_login = LOWER(github_login);

-- Drop old constraint if exists
ALTER TABLE parkers DROP CONSTRAINT IF EXISTS parkers_github_login_key;

-- Add new case-insensitive unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS parkers_github_login_lower_unique 
ON parkers (LOWER(github_login));

-- 5. Recalculate ranks after cleanup
SELECT recalculate_ranks();

-- 6. Show final count
SELECT COUNT(*) as total_parkers FROM parkers;
