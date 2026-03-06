-- ═══════════════════════════════════════════════════════════
-- F1 PADDOCK FANTASY LEAGUE — Database Schema
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- PROFILES TABLE
-- Extended user profile linked to Supabase Auth
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🏎️',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_emoji)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    '🏎️'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- RACES TABLE
-- Stores race-specific data including special categories
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS races (
  id SERIAL PRIMARY KEY,
  round INTEGER NOT NULL UNIQUE CHECK (round >= 1 AND round <= 24),
  gp_name TEXT NOT NULL,
  circuit TEXT NOT NULL,
  race_date DATE NOT NULL,
  is_saturday BOOLEAN DEFAULT FALSE,
  session_start TIMESTAMPTZ, -- from OpenF1 or manual
  special_category_question TEXT,
  special_category_answer TEXT,
  -- Result fields
  result_p1 TEXT,
  result_p2 TEXT,
  result_p3 TEXT,
  result_dnf_drivers TEXT[], -- array of driver names who DNF'd
  result_team_most_points TEXT,
  is_scored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 2026 calendar
INSERT INTO races (round, gp_name, circuit, race_date, is_saturday) VALUES
  (1, 'Australian GP', 'Albert Park', '2026-03-08', FALSE),
  (2, 'Chinese GP', 'Shanghai International', '2026-03-15', FALSE),
  (3, 'Japanese GP', 'Suzuka', '2026-03-29', FALSE),
  (4, 'Bahrain GP', 'Sakhir', '2026-04-12', FALSE),
  (5, 'Saudi Arabian GP', 'Jeddah Street', '2026-04-19', FALSE),
  (6, 'Miami GP', 'Miami Gardens', '2026-05-03', FALSE),
  (7, 'Canadian GP', 'Montreal', '2026-05-24', FALSE),
  (8, 'Monaco GP', 'Monte Carlo', '2026-06-07', FALSE),
  (9, 'Barcelona-Catalunya GP', 'Catalunya', '2026-06-14', FALSE),
  (10, 'Austrian GP', 'Red Bull Ring', '2026-06-28', FALSE),
  (11, 'British GP', 'Silverstone', '2026-07-05', FALSE),
  (12, 'Belgian GP', 'Spa-Francorchamps', '2026-07-19', FALSE),
  (13, 'Hungarian GP', 'Hungaroring', '2026-07-26', FALSE),
  (14, 'Dutch GP', 'Zandvoort', '2026-08-23', FALSE),
  (15, 'Italian GP', 'Monza', '2026-09-06', FALSE),
  (16, 'Spanish GP (Madrid)', 'Madrid (Debut)', '2026-09-13', FALSE),
  (17, 'Azerbaijan GP', 'Baku (Saturday)', '2026-09-26', TRUE),
  (18, 'Singapore GP', 'Marina Bay', '2026-10-11', FALSE),
  (19, 'United States GP', 'COTA', '2026-10-25', FALSE),
  (20, 'Mexico City GP', 'Hermanos Rodríguez', '2026-11-01', FALSE),
  (21, 'São Paulo GP', 'Interlagos', '2026-11-08', FALSE),
  (22, 'Las Vegas GP', 'Las Vegas (Saturday)', '2026-11-21', TRUE),
  (23, 'Qatar GP', 'Lusail', '2026-11-29', FALSE),
  (24, 'Abu Dhabi GP', 'Yas Marina', '2026-12-06', FALSE)
ON CONFLICT (round) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- YEAR BETS TABLE
-- One-time season predictions per user
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bets_year (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  driver_champion TEXT,
  driver_p2 TEXT,
  driver_p3 TEXT,
  constructor_champion TEXT,
  last_constructor TEXT,
  fewest_finishers_race TEXT,
  most_dnfs_driver TEXT,
  first_driver_replaced TEXT,
  most_poles TEXT,
  most_podiums_no_win TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- one year bet per user
);

-- ═══════════════════════════════════════════════════════════
-- RACE BETS TABLE
-- Per-race predictions per user
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bets_race (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  round INTEGER REFERENCES races(round) NOT NULL,
  p1 TEXT NOT NULL,
  p2 TEXT NOT NULL,
  p3 TEXT NOT NULL,
  dnf_driver TEXT,
  team_most_points TEXT,
  special_category_answer TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, round) -- one bet per user per race
);

-- ═══════════════════════════════════════════════════════════
-- SCORES TABLE
-- Calculated scores per user per race (race + year)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  round INTEGER REFERENCES races(round),
  score_type TEXT NOT NULL CHECK (score_type IN ('race', 'year')),
  -- Race score breakdown
  podium_p1_pts INTEGER DEFAULT 0,
  podium_p2_pts INTEGER DEFAULT 0,
  podium_p3_pts INTEGER DEFAULT 0,
  podium_bonus_pts INTEGER DEFAULT 0,
  wrong_spot_pts INTEGER DEFAULT 0,
  dnf_pts INTEGER DEFAULT 0,
  team_pts INTEGER DEFAULT 0,
  special_pts INTEGER DEFAULT 0,
  all_correct_bonus INTEGER DEFAULT 0,
  -- Year score breakdown (stored as JSON for flexibility)
  year_breakdown JSONB,
  total_points INTEGER DEFAULT 0,
  is_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, round, score_type)
);

-- ═══════════════════════════════════════════════════════════
-- YEAR END RESULTS TABLE
-- Final season standings for scoring year bets
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS year_results (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL DEFAULT 2026,
  driver_champion TEXT,
  driver_p2 TEXT,
  driver_p3 TEXT,
  constructor_champion TEXT,
  last_constructor TEXT,
  fewest_finishers_race TEXT,
  most_dnfs_driver TEXT,
  first_driver_replaced TEXT,
  most_poles TEXT,
  most_podiums_no_win TEXT,
  is_final BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season)
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets_race ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_results ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, edit only their own
CREATE POLICY "Profiles are viewable by all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RACES: All users can read races, only admins can modify
CREATE POLICY "Races are viewable by all users" ON races
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify races" ON races
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- YEAR BETS: Users can read all bets (for leaderboard), edit only their own
CREATE POLICY "Year bets viewable by all" ON bets_year
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own year bets" ON bets_year
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own year bets" ON bets_year
  FOR UPDATE USING (auth.uid() = user_id AND NOT is_locked);

-- RACE BETS: Users can read all bets, edit only their own
CREATE POLICY "Race bets viewable by all" ON bets_race
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own race bets" ON bets_race
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own race bets" ON bets_race
  FOR UPDATE USING (auth.uid() = user_id AND NOT is_locked);

-- SCORES: All users can read scores
CREATE POLICY "Scores viewable by all" ON scores
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify scores" ON scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- YEAR RESULTS: All users can read, only admins can modify
CREATE POLICY "Year results viewable by all" ON year_results
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify year results" ON year_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ═══════════════════════════════════════════════════════════
-- LEADERBOARD VIEW
-- Aggregated scores for the leaderboard
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id AS user_id,
  p.display_name,
  p.avatar_emoji,
  COALESCE(SUM(s.total_points), 0) AS total_points,
  COUNT(s.id) FILTER (WHERE s.score_type = 'race') AS races_scored,
  COALESCE(SUM(s.total_points) FILTER (WHERE s.score_type = 'year'), 0) AS year_points,
  COALESCE(SUM(s.total_points) FILTER (WHERE s.score_type = 'race'), 0) AS race_points
FROM profiles p
LEFT JOIN scores s ON p.id = s.user_id
GROUP BY p.id, p.display_name, p.avatar_emoji
ORDER BY total_points DESC;
