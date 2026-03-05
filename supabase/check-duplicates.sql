-- Check for duplicate github_login entries in the parkers table
-- This should return 0 rows if there are no duplicates

SELECT 
    github_login,
    COUNT(*) as count,
    array_agg(id) as ids,
    array_agg(created_at) as created_dates
FROM parkers
GROUP BY LOWER(github_login)
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- If you find duplicates, you can delete them with:
-- DELETE FROM parkers WHERE id IN (SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(github_login) ORDER BY id) as rn
--     FROM parkers
-- ) t WHERE rn > 1);
