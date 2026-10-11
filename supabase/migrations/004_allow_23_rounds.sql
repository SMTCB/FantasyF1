-- ═══════════════════════════════════════════════════════════
-- Migration 004 — allow the extra Bahrain GP (calendar now has 23 rounds)
-- The live DB constraint was tighter than migration 001; make it 1..24.
-- ═══════════════════════════════════════════════════════════
ALTER TABLE races DROP CONSTRAINT IF EXISTS races_round_check;
ALTER TABLE races ADD CONSTRAINT races_round_check CHECK (round >= 1 AND round <= 24);
