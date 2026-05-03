-- ═══════════════════════════════════════════════════════════
-- F1 PADDOCK FANTASY LEAGUE — Migration 004
-- Fix round numbering after calendar update.
--
-- Background: Bahrain GP (round 4) and Saudi Arabian GP (round 5)
-- were cancelled for 2026. The frontend CALENDAR was updated to
-- remove them and re-index rounds (Miami becomes round 4, etc.),
-- but no DB migration was created at the time — causing Miami bets
-- to appear locked because DB round 4 still pointed to Bahrain.
--
-- This migration:
--   1. Removes Bahrain GP (old round 4) and Saudi Arabian GP (old round 5)
--   2. Shifts all remaining rounds 6-24 down by 2 (becoming 4-22)
--   3. Migrates all bets_race and scores rows accordingly
--
-- Note on round-4 bets: any bets already stored with round = 4 were
-- submitted via the frontend which already labelled round 4 as Miami GP.
-- After this migration those bets correctly reference the new round 4
-- (Miami), so they are preserved as-is.
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ── Step 1: Drop FK constraints to allow free renumbering ──────────
ALTER TABLE bets_race DROP CONSTRAINT IF EXISTS bets_race_round_fkey;
ALTER TABLE scores    DROP CONSTRAINT IF EXISTS scores_round_fkey;

-- ── Step 2: Remove Saudi Arabian GP data (round 5 – no valid bets) ─
DELETE FROM scores    WHERE round = 5;
DELETE FROM bets_race WHERE round = 5;
DELETE FROM races     WHERE round = 5;

-- ── Step 3: Remove Bahrain GP race record (round 4 – cancelled) ────
-- bets_race rows with round = 4 are kept; they are Miami bets that
-- will map correctly once Miami is renumbered to round 4 below.
DELETE FROM races WHERE round = 4;

-- ── Step 4: Shift rounds 6-24 → 4-22 (subtract 2) ─────────────────
UPDATE races     SET round = round - 2 WHERE round >= 6;
UPDATE bets_race SET round = round - 2 WHERE round >= 6 AND round <= 24;
UPDATE scores    SET round = round - 2 WHERE round IS NOT NULL AND round >= 6 AND round <= 24;

-- ── Step 5: Restore FK constraints ────────────────────────────────
ALTER TABLE bets_race ADD CONSTRAINT bets_race_round_fkey
    FOREIGN KEY (round) REFERENCES races(round);

ALTER TABLE scores ADD CONSTRAINT scores_round_fkey
    FOREIGN KEY (round) REFERENCES races(round);

COMMIT;
