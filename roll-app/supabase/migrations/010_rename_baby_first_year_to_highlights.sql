-- Migration: Rename baby_first_year magazine template to highlights
-- References: 007_magazines.sql template CHECK constraint
--
-- This migration:
--   1. Migrates any existing rows with template='baby_first_year' to 'highlights'
--   2. Drops the old inline CHECK constraint on magazines.template
--   3. Adds a new CHECK constraint with the updated allowed values
--
-- Rollback (manual):
--   UPDATE magazines SET template = 'baby_first_year' WHERE template = 'highlights';
--   ALTER TABLE magazines DROP CONSTRAINT magazines_template_check;
--   ALTER TABLE magazines ADD CONSTRAINT magazines_template_check
--     CHECK (template IN ('monthly', 'quarterly', 'annual', 'baby_first_year', 'vacation', 'custom'));

BEGIN;

-- Step 1: Migrate existing rows from baby_first_year → highlights
UPDATE magazines
   SET template = 'highlights',
       updated_at = now()
 WHERE template = 'baby_first_year';

-- Step 2: Drop the existing inline CHECK constraint on template.
-- PostgreSQL auto-names inline CHECK constraints as <table>_<column>_check.
-- The constraint from 007_magazines.sql is: magazines_template_check
ALTER TABLE magazines DROP CONSTRAINT IF EXISTS magazines_template_check;

-- Step 3: Add the updated constraint with 'highlights' replacing 'baby_first_year'
ALTER TABLE magazines ADD CONSTRAINT magazines_template_check
  CHECK (template IN ('monthly', 'quarterly', 'annual', 'highlights', 'vacation', 'custom'));

COMMIT;
