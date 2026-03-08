'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Shield,
    Star,
    Trophy,
    Edit3,
    Save,
    ChevronDown,
    AlertTriangle,
    DownloadCloud,
    Loader2,
    Lock,
    Unlock,
    Zap,
    CheckCircle,
    Calendar,
    Database,
    Users,
    TrendingUp,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { CALENDAR, ALL_DRIVERS, TEAMS, YEAR_BET_SCORING, ROUND_TO_COUNTRY } from '@/lib/f1-data';
import {
    fetchRaceSession, fetchSessionResult, fetchDrivers,
    fetchChampionshipDrivers, fetchChampionshipTeams, fetchAllSeasonResults
} from '@/lib/openf1';
import { computeYearStats, type ComputedYearStats } from '@/lib/year-stats';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useCallback } from 'react';
import { scoreRaceBet, scoreYearBet, type RaceBet, type RaceResult, type YearBet, type YearResult } from '@/lib/scoring';

type AdminTab = 'results' | 'scores' | 'yearend';

export default function AdminPage() {
    const [isAuthed, setIsAuthed] = useState(false);
    const [pin, setPin] = useState('');
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<AdminTab>('results');
    const [expandedRound, setExpandedRound] = useState<number | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // Results Form State
    const [resultsForm, setResultsForm] = useState<Record<number, {
        p1?: string; p2?: string; p3?: string; dnf?: string[]; teamMostPts?: string; special?: string;
    }>>({});
    const [isFetchingApi, setIsFetchingApi] = useState<number | null>(null);
    const [isYearLocked, setIsYearLocked] = useState(false);
    const [isLoadingLock, setIsLoadingLock] = useState(false);
    const [manualUnlocks, setManualUnlocks] = useState<Record<number, boolean>>({});

    // Year results form state
    const [yearResultsForm, setYearResultsForm] = useState<Partial<YearResult>>({});
    // Preliminary year stats state (computed from API)
    const [prelimYearStats, setPrelimYearStats] = useState<ComputedYearStats | null>(null);
    // Track which round last triggered a year stats computation
    const [prelimRound, setPrelimRound] = useState<number | null>(null);

    const supabase = createClient();

    // Fetch year lock status and manual race unlocks
    useEffect(() => {
        const fetchData = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const username = user.email?.split('@')[0].toLowerCase();
                setCurrentUser(username || null);
                setIsAuthorized(username === 'segismundob');
            } else {
                setIsAuthorized(false);
            }

            // Year lock
            const { data: yearData } = await supabase
                .from('year_results')
                .select('is_bets_locked')
                .eq('season', 2026)
                .single();

            if (yearData) setIsYearLocked(yearData.is_bets_locked);

            // Manual unlocks
            const { data: raceData } = await supabase
                .from('races')
                .select('round, is_manual_unlock');

            if (raceData) {
                const unlocks: Record<number, boolean> = {};
                raceData.forEach(r => unlocks[r.round] = r.is_manual_unlock || false);
                setManualUnlocks(unlocks);
            }
        };
        fetchData();
    }, [supabase]);
    // Simple PIN auth for admin

    // Simple PIN auth for admin
    const handleAuth = () => {
        if (pin === '2026') {
            setIsAuthed(true);
        }
    };

    if (isAuthorized === false) {
        return (
            <main className="min-h-screen flex items-center justify-center pb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 mx-5 w-full max-w-sm text-center border-[var(--color-danger)]/30"
                >
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[var(--color-danger)]/20">
                        <Shield size={28} className="text-[var(--color-danger)]" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-sm text-[var(--color-carbon-400)]">
                        Only the lead administrator (SegismundoB) can access this telemetry panel.
                    </p>
                </motion.div>
                <BottomNav />
            </main>
        );
    }

    if (!isAuthed) {
        return (
            <main className="min-h-screen flex items-center justify-center pb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 mx-5 w-full max-w-sm text-center"
                >
                    <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--color-f1-red), #c20500)' }}
                    >
                        <Shield size={28} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Admin Access
                    </h2>
                    <p className="text-sm text-[var(--color-carbon-400)] mb-6">
                        Welcome, <strong>SegismundoB</strong>. Enter your PIN to continue.
                    </p>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        placeholder="Enter PIN"
                        className="input-field text-center text-lg font-mono tracking-[0.3em] mb-4"
                    />
                    <button onClick={handleAuth} className="btn-primary w-full">
                        AUTHENTICATE
                    </button>
                </motion.div>
                <BottomNav />
            </main>
        );
    }

    const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'results', label: 'Race Results', icon: <Trophy size={14} /> },
        { id: 'scores', label: 'Score Overrides', icon: <Edit3 size={14} /> },
        { id: 'yearend', label: 'Year End', icon: <Calendar size={14} /> },
    ];

    const handleSave = (label: string) => {
        setSaveStatus(label);
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handleFormChange = (round: number, field: string, value: string) => {
        setResultsForm(prev => ({
            ...prev,
            [round]: {
                ...(prev[round] || {}),
                [field]: value
            }
        }));
    };

    const handleDnfChange = (round: number, drivers: string[]) => {
        setResultsForm(prev => ({
            ...prev,
            [round]: {
                ...(prev[round] || {}),
                dnf: drivers
            }
        }));
    };

    const handleYearFormChange = (field: keyof YearResult, value: string) => {
        setYearResultsForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveRaceResults = async (round: number) => {
        const form = resultsForm[round];
        if (!form || !form.p1 || !form.p2 || !form.p3) {
            alert("Please fill at least the podium (P1, P2, P3)");
            return;
        }

        setSaveStatus(`R${round} Processing...`);

        try {
            // 1. Save race results to 'races' table
            const { error: raceError } = await supabase
                .from('races')
                .update({
                    result_p1: form.p1,
                    result_p2: form.p2,
                    result_p3: form.p3,
                    result_dnf_drivers: form.dnf || [],
                    result_team_most_points: form.teamMostPts,
                    special_category_answer: form.special,
                    is_scored: true
                })
                .eq('round', round);

            if (raceError) throw raceError;

            // 2. Fetch ALL bets for this round
            const { data: bets, error: betsError } = await supabase
                .from('bets_race')
                .select('*')
                .eq('round', round);

            if (betsError) throw betsError;

            const raceResult: RaceResult = {
                p1: form.p1,
                p2: form.p2,
                p3: form.p3,
                dnfDrivers: form.dnf || [],
                teamMostPoints: form.teamMostPts || '',
                specialCategoryAnswer: form.special || null
            };

            // 4. Calculate and upsert scores for each user
            const scorePromises = (bets || []).map(async (bet) => {
                const raceBet: RaceBet = {
                    p1: bet.p1,
                    p2: bet.p2,
                    p3: bet.p3,
                    dnf: bet.dnf_driver,
                    teamMostPoints: bet.team_most_points,
                    specialCategory: bet.special_category_answer
                };

                const score = scoreRaceBet(raceBet, raceResult);

                return supabase
                    .from('scores')
                    .upsert({
                        user_id: bet.user_id,
                        round: round,
                        score_type: 'race',
                        podium_p1_pts: score.podiumP1,
                        podium_p2_pts: score.podiumP2,
                        podium_p3_pts: score.podiumP3,
                        podium_bonus_pts: score.podiumBonus,
                        wrong_spot_pts: score.wrongSpotPoints,
                        dnf_pts: score.dnfPoints,
                        team_pts: score.teamPoints,
                        special_pts: score.specialPoints,
                        all_correct_bonus: score.allCorrectBonus,
                        total_points: score.total,
                        scored_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id, round, score_type'
                    });
            });

            await Promise.all(scorePromises);
            handleSave(`Race ${round} results & scores`);
        } catch (e: any) {
            console.error(e);
            alert(`Error processing scores: ${e.message}`);
        }
    };

    const handleCalculateYearScores = async () => {
        // Basic validation
        const requiredFields: (keyof YearResult)[] = [
            'driverChampion', 'driverP2', 'driverP3', 'constructorChampion',
            'lastConstructor', 'fewestFinishersRace', 'mostDnfsDriver',
            'firstDriverReplaced', 'mostPoles', 'mostPodiumsNoWin'
        ];

        for (const field of requiredFields) {
            if (!yearResultsForm[field]) {
                alert(`Missing field: ${field}`);
                return;
            }
        }

        setSaveStatus("Year-end Scoring...");

        try {
            // 1. Save year results
            const { error: yearError } = await supabase
                .from('year_results')
                .upsert({
                    season: 2026,
                    driver_champion: yearResultsForm.driverChampion,
                    driver_p2: yearResultsForm.driverP2,
                    driver_p3: yearResultsForm.driverP3,
                    constructor_champion: yearResultsForm.constructorChampion,
                    last_constructor: yearResultsForm.lastConstructor,
                    fewest_finishers_race: yearResultsForm.fewestFinishersRace,
                    most_dnfs_driver: yearResultsForm.mostDnfsDriver,
                    first_driver_replaced: yearResultsForm.firstDriverReplaced,
                    most_poles: yearResultsForm.mostPoles,
                    most_podiums_no_win: yearResultsForm.mostPodiumsNoWin,
                    is_final: true
                }, { onConflict: 'season' });

            if (yearError) throw yearError;

            // 2. Fetch all year bets
            const { data: bets, error: betsError } = await supabase
                .from('bets_year')
                .select('*');

            if (betsError) throw betsError;

            const yearResult = yearResultsForm as YearResult;

            // 3. Score each bet
            const scorePromises = (bets || []).map(async (bet) => {
                const yearBet: YearBet = {
                    driverChampion: bet.driver_champion,
                    driverP2: bet.driver_p2,
                    driverP3: bet.driver_p3,
                    constructorChampion: bet.constructor_champion,
                    lastConstructor: bet.last_constructor,
                    fewestFinishersRace: bet.fewest_finishers_race,
                    mostDnfsDriver: bet.most_dnfs_driver,
                    firstDriverReplaced: bet.first_driver_replaced,
                    mostPoles: bet.most_poles,
                    mostPodiumsNoWin: bet.most_podiums_no_win
                };

                const score = scoreYearBet(yearBet, yearResult);

                return supabase
                    .from('scores')
                    .upsert({
                        user_id: bet.user_id,
                        round: null, // Year scores have null round usually or handled by type
                        score_type: 'year',
                        year_breakdown: score.breakdown,
                        total_points: score.total,
                        scored_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id, round, score_type'
                    });
            });

            await Promise.all(scorePromises);
            handleSave("Year-end scores");
        } catch (e: any) {
            console.error(e);
            alert(`Error scoring year: ${e.message}`);
        }
    };

    const handleFetchApi = async (round: number, country: string, year: number) => {
        setIsFetchingApi(round);
        try {
            const session = await fetchRaceSession(year, country);
            if (session) {
                // Fetch race classification AND season-wide data in parallel
                const [
                    classification,
                    driverInfo,
                    raceSeasonResults,
                    qualSeasonResults,
                    champDrivers,
                    champTeams,
                ] = await Promise.all([
                    fetchSessionResult(session.session_key),
                    fetchDrivers(session.session_key),
                    fetchAllSeasonResults(year, 'Race'),
                    fetchAllSeasonResults(year, 'Qualifying'),
                    fetchChampionshipDrivers(year),
                    fetchChampionshipTeams(year),
                ]);

                if (!classification || classification.length === 0) {
                    alert("Official race results (classification) not yet available on OpenF1.");
                    return;
                }

                // Map driver number to our system driver
                const getOurDriver = (driverNum: number) => {
                    const dInfo = driverInfo.find((d: any) => d.driver_number === driverNum);
                    if (!dInfo) return undefined;
                    const lastName = (dInfo.name_acronym || dInfo.broadcast_name?.split(' ').pop() || '').toLowerCase();
                    const fallbackLastName = dInfo.full_name?.split(' ').pop()?.toLowerCase() || 'xxx';
                    return ALL_DRIVERS.find(d => {
                        const ourNormalized = d.name.toLowerCase();
                        return ourNormalized.includes(lastName) || ourNormalized.includes(fallbackLastName);
                    });
                };

                const getOurDriverName = (driverNum: number) => getOurDriver(driverNum)?.name;

                // 1. Podiums - Sort by position just in case
                const sortedResults = [...classification].sort((a: any, b: any) => a.position - b.position);

                const p1 = getOurDriverName(sortedResults.find((r: any) => r.position === 1)?.driver_number);
                const p2 = getOurDriverName(sortedResults.find((r: any) => r.position === 2)?.driver_number);
                const p3 = getOurDriverName(sortedResults.find((r: any) => r.position === 3)?.driver_number);

                if (p1) handleFormChange(round, 'p1', p1);
                if (p2) handleFormChange(round, 'p2', p2);
                if (p3) handleFormChange(round, 'p3', p3);

                // 2. Team Most Points Calculation
                // Official F1 points for top 10
                const f1Points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
                const teamScores: Record<string, number> = {};

                sortedResults.forEach((res: any) => {
                    if (res.position >= 1 && res.position <= 10) {
                        const driver = getOurDriver(res.driver_number);
                        if (driver) {
                            teamScores[driver.team] = (teamScores[driver.team] || 0) + f1Points[res.position - 1];
                        }
                    }
                });

                let bestTeam = '';
                let maxPts = -1;
                Object.entries(teamScores).forEach(([team, pts]) => {
                    if (pts > maxPts) {
                        maxPts = pts;
                        bestTeam = team;
                    }
                });
                if (bestTeam) handleFormChange(round, 'teamMostPts', bestTeam);

                // 3. DNF Detection
                // Using official 'dnf' flag from session_result
                const dnfDrivers = classification
                    .filter((res: any) => res.dnf === true)
                    .map((res: any) => getOurDriverName(res.driver_number))
                    .filter(Boolean) as string[];

                handleDnfChange(round, dnfDrivers);

                handleSave(`R${round} API synced successfully (Official Classification)`);
            } else {
                alert("Race session not found on OpenF1 API yet.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to fetch from OpenF1 API.");
        } finally {
            setIsFetchingApi(null);
        }
    };

    const toggleManualUnlock = async (round: number) => {
        const newValue = !manualUnlocks[round];
        try {
            const { error } = await supabase
                .from('races')
                .update({ is_manual_unlock: newValue })
                .eq('round', round);

            if (error) throw error;
            setManualUnlocks(prev => ({ ...prev, [round]: newValue }));
            handleSave(`Race ${round} ${newValue ? 'FORCED OPEN' : 'AUTO-LOCK ACTIVE'}`);
        } catch (e) {
            console.error(e);
            alert("Failed to update race lock override");
        }
    };

    const toggleYearLock = async () => {
        setIsLoadingLock(true);
        try {
            const { error } = await supabase
                .from('year_results')
                .update({ is_bets_locked: !isYearLocked })
                .eq('season', 2026);

            if (error) throw error;
            setIsYearLocked(!isYearLocked);
            handleSave(`Year bets ${!isYearLocked ? 'LOCKED' : 'OPENED'}`);
        } catch (e) {
            console.error(e);
            alert("Failed to update lock status");
        } finally {
            setIsLoadingLock(false);
        }
    };

    return (
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40">
                <div
                    className="px-5 py-4"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 100%)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                                <Settings size={18} className="text-[var(--color-f1-red)]" />
                                Admin Panel
                            </h1>
                            <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                                RACE MANAGEMENT · SCORING · OVERRIDES
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                            <span className="data-readout text-[9px] text-[var(--color-success)]">ADMIN</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Save Status Toast */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-5 right-5 z-50 glass-card p-3 flex items-center gap-2 glow-green"
                    >
                        <CheckCircle size={16} className="text-[var(--color-success)]" />
                        <span className="text-sm font-medium">{saveStatus} saved successfully</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Bar */}
            <div className="px-5 pt-4">
                <div className="flex gap-1.5 p-1 rounded-lg bg-[var(--color-carbon-800)] mb-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider transition-all
                ${activeTab === tab.id
                                    ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/20'
                                    : 'text-[var(--color-carbon-400)] hover:text-[var(--color-carbon-200)]'
                                }
              `}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    {/* ── Removed Special Categories Setup Tab since they are now pre-defined in f1-data.ts ── */}

                    {/* ── Results Tab ── */}
                    {activeTab === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Manually input race results for scoring. Used when API data is missing or for custom categories.
                            </p>
                            {CALENDAR.map((race) => (
                                <div key={race.round} className="glass-card">
                                    <button
                                        onClick={() => setExpandedRound(expandedRound === race.round ? null : race.round)}
                                        className="w-full flex items-center gap-3 p-3 text-left"
                                    >
                                        <span className="data-readout text-[10px] w-8">R{String(race.round).padStart(2, '0')}</span>
                                        <span className="font-medium text-sm flex-1 truncate">{race.gp}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-[var(--color-carbon-400)] transition-transform ${expandedRound === race.round ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {expandedRound === race.round && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 pb-3 border-t border-[var(--color-carbon-700)] pt-3 space-y-3">

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleFetchApi(race.round, ROUND_TO_COUNTRY[race.round], 2026)}
                                                            disabled={isFetchingApi === race.round}
                                                            className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                                                        >
                                                            {isFetchingApi === race.round ? <Loader2 size={12} className="animate-spin" /> : <DownloadCloud size={12} />}
                                                            Fetch from F1 API
                                                        </button>
                                                        <button
                                                            onClick={() => toggleManualUnlock(race.round)}
                                                            className={`telemetry-border px-3 text-[10px] data-readout flex items-center gap-1.5 transition-all ${manualUnlocks[race.round]
                                                                ? 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]'
                                                                : 'bg-[var(--color-carbon-800)] border-[var(--color-carbon-700)] text-[var(--color-carbon-500)]'
                                                                }`}
                                                            title="Manually unlock bets for this race (overrides auto-lock)"
                                                        >
                                                            {manualUnlocks[race.round] ? <Unlock size={12} /> : <Lock size={12} />}
                                                            {manualUnlocks[race.round] ? 'FORCED OPEN' : 'AUTO-LOCK'}
                                                        </button>
                                                    </div>

                                                    {/* P1, P2, P3 (Drivers) */}
                                                    {['p1', 'p2', 'p3'].map((field) => (
                                                        <div key={field}>
                                                            <label className="data-readout text-[9px] block mb-1">
                                                                {field.toUpperCase()}
                                                            </label>
                                                            <select
                                                                value={resultsForm[race.round]?.[field as keyof typeof resultsForm[number]] as string || ''}
                                                                onChange={(e) => handleFormChange(race.round, field, e.target.value)}
                                                                className="input-field text-sm"
                                                            >
                                                                <option value="">Select driver...</option>
                                                                {ALL_DRIVERS.map(d => (
                                                                    <option key={d.name} value={d.name}>{d.name} ({d.team})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}

                                                    {/* DNF Drivers */}
                                                    <div>
                                                        <label className="data-readout text-[9px] block mb-2">
                                                            DNF DRIVERS
                                                        </label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {ALL_DRIVERS.map(d => {
                                                                const isSelected = (resultsForm[race.round]?.dnf || []).includes(d.name);
                                                                return (
                                                                    <button
                                                                        key={d.name}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = resultsForm[race.round]?.dnf || [];
                                                                            if (isSelected) {
                                                                                handleDnfChange(race.round, current.filter(x => x !== d.name));
                                                                            } else {
                                                                                handleDnfChange(race.round, [...current, d.name]);
                                                                            }
                                                                        }}
                                                                        className={`text-[10px] px-2.5 py-1.5 rounded-md border transition-colors flex items-center gap-1.5 ${isSelected ? 'bg-[var(--color-danger)]/20 border-[var(--color-danger)] text-white font-bold' : 'bg-[var(--color-carbon-800)] border-[var(--color-carbon-700)] text-[var(--color-carbon-400)] hover:border-[var(--color-carbon-500)]'}`}
                                                                    >
                                                                        {d.name} <span className="opacity-50 text-[8px] font-normal">({d.team})</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Team Most Points */}
                                                    <div>
                                                        <label className="data-readout text-[9px] block mb-1">TEAM MOST POINTS</label>
                                                        <select
                                                            value={resultsForm[race.round]?.teamMostPts || ''}
                                                            onChange={(e) => handleFormChange(race.round, 'teamMostPts', e.target.value)}
                                                            className="input-field text-sm"
                                                        >
                                                            <option value="">Select team...</option>
                                                            {TEAMS.map(t => (
                                                                <option key={t.shortName} value={t.shortName}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Special Category */}
                                                    <div>
                                                        <label className="data-readout text-[9px] block mb-1">SPECIAL: {race.specialCategory.question.toUpperCase()}</label>
                                                        <select
                                                            value={resultsForm[race.round]?.special || ''}
                                                            onChange={(e) => handleFormChange(race.round, 'special', e.target.value)}
                                                            className="input-field text-sm"
                                                        >
                                                            <option value="">Select answer...</option>
                                                            {race.specialCategory.type === 'driver' && ALL_DRIVERS.map(d => (
                                                                <option key={d.name} value={d.name}>{d.name}</option>
                                                            ))}
                                                            {race.specialCategory.type === 'team' && TEAMS.map(t => (
                                                                <option key={t.shortName} value={t.shortName}>{t.shortName}</option>
                                                            ))}
                                                            {race.specialCategory.type === 'options' && race.specialCategory.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSaveRaceResults(race.round)}
                                                        className="btn-primary text-xs py-2 flex items-center gap-1.5 w-full justify-center mt-2"
                                                    >
                                                        <Database size={12} />
                                                        Save Results & Score
                                                    </button>

                                                    {/* Preliminary Year Stats Display */}
                                                    {prelimYearStats && prelimRound === race.round && (
                                                        <div className="mt-4 p-3 rounded-md bg-[var(--color-carbon-800)] border border-[var(--color-f1-red)]/20">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <TrendingUp size={14} className="text-[var(--color-f1-red)]" />
                                                                <span className="data-readout text-[10px] text-[var(--color-f1-red)]">PRELIMINARY YEAR STATS</span>
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--color-carbon-400)]">Championship P1:</span>
                                                                    <span className="font-semibold">{prelimYearStats.driverChampion || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--color-carbon-400)]">Championship P2:</span>
                                                                    <span className="font-semibold">{prelimYearStats.driverP2 || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--color-carbon-400)]">Championship P3:</span>
                                                                    <span className="font-semibold">{prelimYearStats.driverP3 || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--color-carbon-400)]">Constructor Champ:</span>
                                                                    <span className="font-semibold">{prelimYearStats.constructorChampion || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-[var(--color-carbon-400)]">Last Constructor:</span>
                                                                    <span className="font-semibold">{prelimYearStats.lastConstructor || '—'}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-1 border-t border-[var(--color-carbon-700)] mt-1">
                                                                    <span className="text-[var(--color-carbon-400)]">Most DNFs:</span>
                                                                    <span className="font-semibold text-right flex flex-col items-end">
                                                                        <span>{prelimYearStats.mostDnfsDriver || '—'} ({prelimYearStats.mostDnfsCount})</span>
                                                                        {prelimYearStats.mostDnfsTied.length > 1 && (
                                                                            <span className="text-[10px] text-[var(--color-warning)] font-normal">Tied: {prelimYearStats.mostDnfsTied.join(', ')}</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[var(--color-carbon-400)]">Most Poles:</span>
                                                                    <span className="font-semibold text-right flex flex-col items-end">
                                                                        <span>{prelimYearStats.mostPoles || '—'} ({prelimYearStats.mostPolesCount})</span>
                                                                        {prelimYearStats.mostPolesTied.length > 1 && (
                                                                            <span className="text-[10px] text-[var(--color-warning)] font-normal">Tied: {prelimYearStats.mostPolesTied.join(', ')}</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[var(--color-carbon-400)]">Most Podiums (No Win):</span>
                                                                    <span className="font-semibold text-right flex flex-col items-end">
                                                                        <span>{prelimYearStats.mostPodiumsNoWin || '—'} ({prelimYearStats.mostPodiumsNoWinCount})</span>
                                                                        {prelimYearStats.mostPodiumsNoWinTied.length > 1 && (
                                                                            <span className="text-[10px] text-[var(--color-warning)] font-normal">Tied: {prelimYearStats.mostPodiumsNoWinTied.join(', ')}</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-[9px] text-[var(--color-carbon-500)] text-right mt-2">
                                                                Aggregated {prelimYearStats.racesAggregated} race(s) & {prelimYearStats.qualifyingAggregated} qual(s)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── Score Overrides Tab ── */}
                    {activeTab === 'scores' && (
                        <motion.div
                            key="scores"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Override individual user scores for any race. Changes are logged.
                            </p>
                            <div className="glass-card p-6 text-center">
                                <Zap size={32} className="text-[var(--color-warning)] mx-auto mb-3" />
                                <h3 className="font-bold mb-2">Score Override</h3>
                                <p className="text-sm text-[var(--color-carbon-400)] mb-4">
                                    Select a user and race to manually adjust their score.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">USER</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select user...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">RACE</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select race...</option>
                                            {CALENDAR.map((r) => (
                                                <option key={r.round} value={r.round}>R{r.round} - {r.gp}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">NEW TOTAL SCORE</label>
                                        <input type="number" placeholder="Enter score..." className="input-field text-sm" />
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">REASON</label>
                                        <input type="text" placeholder="Reason for override..." className="input-field text-sm" />
                                    </div>
                                    <button className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5">
                                        <Save size={12} />
                                        APPLY OVERRIDE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Year End Classification Tab ── */}
                    {activeTab === 'yearend' && (
                        <motion.div
                            key="yearend"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Enter final season standings to score year bets. Points will be calculated automatically.
                            </p>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Trophy size={14} className="text-[var(--color-warning)]" />
                                    Driver Championship Final
                                </h3>
                                {['Driver Champion (P1)', 'Driver Runner-up (P2)', 'Driver P3'].map((label) => (
                                    <div key={label}>
                                        <label className="data-readout text-[9px] block mb-1">{label.toUpperCase()}</label>
                                        <select
                                            value={yearResultsForm[label === 'Driver Champion (P1)' ? 'driverChampion' : label === 'Driver Runner-up (P2)' ? 'driverP2' : 'driverP3'] || ''}
                                            onChange={(e) => handleYearFormChange(label === 'Driver Champion (P1)' ? 'driverChampion' : label === 'Driver Runner-up (P2)' ? 'driverP2' : 'driverP3', e.target.value)}
                                            className="input-field text-sm"
                                        >
                                            <option value="">Select driver...</option>
                                            {ALL_DRIVERS.map(d => (
                                                <option key={d.name} value={d.name}>{d.name} ({d.team})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Users size={14} className="text-[var(--color-info)]" />
                                    Constructor Championship Final
                                </h3>
                                {['Constructors Champion', 'Last Place Constructor'].map((label) => (
                                    <div key={label}>
                                        <label className="data-readout text-[9px] block mb-1">{label.toUpperCase()}</label>
                                        <select
                                            value={yearResultsForm[label === 'Constructors Champion' ? 'constructorChampion' : 'lastConstructor'] || ''}
                                            onChange={(e) => handleYearFormChange(label === 'Constructors Champion' ? 'constructorChampion' : 'lastConstructor', e.target.value)}
                                            className="input-field text-sm"
                                        >
                                            <option value="">Select team...</option>
                                            {TEAMS.map(t => (
                                                <option key={t.shortName} value={t.shortName}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-[var(--color-danger)]" />
                                    Special Year Categories
                                </h3>
                                {[
                                    { label: 'Race with Fewest Finishers', type: 'race', id: 'fewestFinishersRace' },
                                    { label: 'Driver with Most DNFs', type: 'driver', id: 'mostDnfsDriver' },
                                    { label: 'First Driver Replaced', type: 'driver', id: 'firstDriverReplaced' },
                                    { label: 'Most Pole Positions', type: 'driver', id: 'mostPoles' },
                                    { label: 'Most Podiums Without a Win', type: 'driver', id: 'mostPodiumsNoWin' },
                                ].map((cat) => (
                                    <div key={cat.id}>
                                        <label className="data-readout text-[9px] block mb-1">{cat.label.toUpperCase()}</label>
                                        <select
                                            value={yearResultsForm[cat.id as keyof YearResult] || ''}
                                            onChange={(e) => handleYearFormChange(cat.id as keyof YearResult, e.target.value)}
                                            className="input-field text-sm"
                                        >
                                            <option value="">Select...</option>
                                            {cat.type === 'driver' && ALL_DRIVERS.map(d => (
                                                <option key={d.name} value={d.name}>{d.name}</option>
                                            ))}
                                            {cat.type === 'team' && TEAMS.map(t => (
                                                <option key={t.shortName} value={t.shortName}>{t.shortName}</option>
                                            ))}
                                            {cat.type === 'race' && CALENDAR.map(r => (
                                                <option key={r.round} value={r.gp}>{r.gp}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="telemetry-border p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm">Season Prediction Status</h3>
                                        <p className="text-[10px] text-[var(--color-carbon-400)]">Global lock for all Year Bets</p>
                                    </div>
                                    <button
                                        onClick={toggleYearLock}
                                        disabled={isLoadingLock}
                                        className={`px-4 py-2 rounded-lg data-readout text-[10px] font-bold transition-all border ${isYearLocked
                                            ? 'bg-[var(--color-danger)]/20 border-[var(--color-danger)]/40 text-[var(--color-danger)]'
                                            : 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]'
                                            }`}
                                    >
                                        {isLoadingLock ? <Loader2 size={12} className="animate-spin" /> : (isYearLocked ? 'LOCKED' : 'OPEN')}
                                    </button>
                                </div>
                                <div className="flex items-start gap-2 bg-[var(--color-carbon-800)] p-3 rounded-lg border border-[var(--color-carbon-700)]">
                                    <Lock size={14} className="mt-0.5 text-[var(--color-carbon-400)]" />
                                    <p className="text-[10px] text-[var(--color-carbon-400)] leading-relaxed">
                                        When locked, users cannot submit or edit their Year Bets.
                                        Usually locked before the start of the first race of the season.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCalculateYearScores}
                                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                            >
                                <Zap size={14} />
                                CALCULATE & SCORE YEAR BETS
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </main>
    );
}
