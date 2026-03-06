-- ═══════════════════════════════════════════════════════════
-- F1 PADDOCK FANTASY LEAGUE — Migration 002
-- Add locking and manual override columns
-- ═══════════════════════════════════════════════════════════

-- 1. Add manual unlock override to races
ALTER TABLE races ADD COLUMN IF NOT EXISTS is_manual_unlock BOOLEAN DEFAULT FALSE;

-- 2. Add bet locking for year results
ALTER TABLE year_results ADD COLUMN IF NOT EXISTS is_bets_locked BOOLEAN DEFAULT FALSE;

-- 3. Initialize the 2026 year_results row if it doesn't exist
INSERT INTO year_results (season, is_bets_locked)
VALUES (2026, false)
ON CONFLICT (season) DO NOTHING;
