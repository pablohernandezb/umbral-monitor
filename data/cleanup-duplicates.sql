-- Cleanup Script: Remove Duplicate Rows
-- Run this in your Supabase SQL Editor to remove duplicate entries
-- This keeps the oldest entry (lowest ID) and removes newer duplicates

-- ============================================================
-- 1. Remove duplicate news_feed entries
-- ============================================================
DELETE FROM news_feed a USING news_feed b
WHERE a.id > b.id
  AND a.headline = b.headline
  AND a.source = b.source
  AND a.published_at = b.published_at;

-- ============================================================
-- 2. Remove duplicate events_deed entries
-- ============================================================
DELETE FROM events_deed a USING events_deed b
WHERE a.id > b.id
  AND a.year = b.year
  AND a.type = b.type
  AND a.description_en = b.description_en;

-- ============================================================
-- 3. Remove duplicate reading_room entries
-- ============================================================
DELETE FROM reading_room a USING reading_room b
WHERE a.id > b.id
  AND a.title = b.title
  AND a.author = b.author
  AND a.year = b.year;

-- ============================================================
-- 4. Verify row counts after cleanup
-- ============================================================
SELECT
  'news_feed' as table_name,
  COUNT(*) as total_rows
FROM news_feed
UNION ALL
SELECT 'events_deed', COUNT(*) FROM events_deed
UNION ALL
SELECT 'reading_room', COUNT(*) FROM reading_room
UNION ALL
SELECT 'political_prisoners', COUNT(*) FROM political_prisoners
UNION ALL
SELECT 'prisoners_by_organization', COUNT(*) FROM prisoners_by_organization;

-- Expected counts (from mock data):
-- news_feed: ~5-10 rows
-- events_deed: ~50-100 rows
-- reading_room: ~10-20 rows
-- political_prisoners: 1 row
-- prisoners_by_organization: 5 rows
