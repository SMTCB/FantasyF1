-- ═══════════════════════════════════════════════════════════
-- F1 PADDOCK FANTASY LEAGUE — Migration 003
-- Hardened RLS policies for global and race-specific locking
-- ═══════════════════════════════════════════════════════════

-- 1. Redefine YEAR BETS update policy to check global lock
DROP POLICY IF EXISTS "Users can update own year bets" ON bets_year;
CREATE POLICY "Users can update own year bets" ON bets_year
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM year_results 
      WHERE season = 2026 AND is_bets_locked = true
    )
  );

-- 2. Redefine RACE BETS update policy to check auto-lock or manual override
DROP POLICY IF EXISTS "Users can update own race bets" ON bets_race;
CREATE POLICY "Users can update own race bets" ON bets_race
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM races r
        WHERE r.round = bets_race.round
        AND (
          r.is_manual_unlock = true OR
          r.session_start > NOW() OR
          r.session_start IS NULL
        )
      )
    )
  );

-- 3. Redefine Insert policies as well for consistency
DROP POLICY IF EXISTS "Users can insert own year bets" ON bets_year;
CREATE POLICY "Users can insert own year bets" ON bets_year
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM year_results 
      WHERE season = 2026 AND is_bets_locked = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own race bets" ON bets_race;
CREATE POLICY "Users can insert own race bets" ON bets_race
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM races r
        WHERE r.round = round
        AND (
          r.is_manual_unlock = true OR
          r.session_start > NOW() OR
          r.session_start IS NULL
        )
      )
    )
  );
