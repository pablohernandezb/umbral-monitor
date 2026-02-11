-- Migration: Add Bilingual Support to Reading Room
-- This adds Spanish fields and renames existing fields to English variants

-- Add new Spanish columns
ALTER TABLE reading_room
  ADD COLUMN title_es TEXT,
  ADD COLUMN description_es TEXT,
  ADD COLUMN tags_es TEXT[];

-- Rename existing columns to English variants
ALTER TABLE reading_room
  RENAME COLUMN title TO title_en;

ALTER TABLE reading_room
  RENAME COLUMN description TO description_en;

ALTER TABLE reading_room
  RENAME COLUMN tags TO tags_en;

-- Set title_en and description_en as NOT NULL (since they were before)
ALTER TABLE reading_room
  ALTER COLUMN title_en SET NOT NULL,
  ALTER COLUMN description_en SET NOT NULL;

-- Verify the new schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reading_room'
ORDER BY ordinal_position;
