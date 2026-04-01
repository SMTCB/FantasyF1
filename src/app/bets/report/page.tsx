'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ChevronDown,
    ChevronRight,
    Trophy,
    Medal,
    AlertTriangle,
    Crown,
    Skull,
    UserX,
    Crosshair,
    Award,
    Lock,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { CALENDAR, getNextRace, ALL_DRIVERS, TEAMS, RACE_BET_SCORING, YEAR_BET_SCORING } from '@/lib/f1-data';
import { isBetLocked } from '@/lib/openf1';

const YEAR_BET_CATEGORIES = [
    { id: 'driver_champion', label: 'Driver Champion', icon: <Crown size={14} />, type: 'driver', dbKey: 'driver_champion', scoreKey: 'DRIVER_CHAMPION' },
    { id: 'driver_p2', label: 'Driver Runner-up', icon: <Medal size={14} />, type: 'driver', dbKey: 'driver_p2', scoreKey: 'DRIVER_P2' },
    { id: 'driver_p3', label: 'Driver P3', icon: <Medal size={14} />, type: 'driver', dbKey: 'driver_p3', scoreKey: 'DRIVER_P3' },
    { id: 'constructor_champion', label: 'Constructors Champion', icon: <Trophy size={14} />, type: 'driver', dbKey: 'constructor_champion', scoreKey: 'CONSTRUCTOR_CHAMPION' },
    { id: 'last_constructor', label: 'Last Place Constructor', icon: <AlertTriangle size={14} />, type: 'driver', dbKey: 'last_constructor', scoreKey: 'LAST_CONSTRUCTOR' },
    { id: 'fewest_finishers', label: 'Race w/ Fewest Finishers', icon: <Skull size={14} />, type: 'driver', dbKey: 'fewest_finishers_race', scoreKey: 'FEWEST_FINISHERS_RACE' },
    { id: 'most_dnfs', label: 'Most DNFs Driver', icon: <AlertTriangle size={14} />, type: 'driver', dbKey: 'most_dnfs_driver', scoreKey: 'MOST_DNFS_DRIVER' },
    { id: 'first_replaced', label: 'First Driver Replaced', icon: <UserX size={14} />, type: 'driver', dbKey: 'first_driver_replaced', scoreKey: 'FIRST_DRIVER_REPLACED' },
    { id: 'most_poles', label: 'Most Poles', icon: <Crosshair size={14} />, type: 'driver', dbKey: 'most_poles', scoreKey: 'MOST_POLES' },
    { id: 'most_podiums_no_win', label: 'Most Podiums w/o Win', icon: <Award size={14} />, type: 'driver', dbKey: 'most_podiums_no_win', scoreKey: 'MOST_PODIUMS_NO_WIN' },
];

export default function BetsReportPage() {
    const [tab, setTab] = useState<'year' | 'race'>('year');

    // Status
    const [loading, setLoading] = useState(true);
    const [usersMap, setUsersMap] = useState<Record<string, { displayName: string, avatar: string }>>({});

    // Year Bets State
    const [isYearLocked, setIsYearLocked] = useState(false);
    const [yearResults, setYearResults] = useState<any>(null);
    const [yearBets, setYearBets] = useState<any[]>([]);
    const [expandedYearUser, setExpandedYearUser] = useState<string | null>(null);

    // Race Bets State
    const [selectedRound, setSelectedRound] = useState<number>(0);
    const [raceLockStatus, setRaceLockStatus] = useState<Record<number, boolean>>({});
    const [raceScoredStatus, setRaceScoredStatus] = useState<Record<number, boolean>>({});
    const [raceBets, setRaceBets] = useState<any[]>([]);
    const [raceScores, setRaceScores] = useState<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Users
                const { data: userData } = await supabase.from('leaderboard').select('user_id, display_name, avatar_emoji');
                const userMapObj: Record<string, { displayName: string, avatar: string }> = {};
                if (userData) {
                    userData.forEach(u => {
                        userMapObj[u.user_id] = {
                            displayName: u.display_name,
                            avatar: u.avatar_emoji || '🏎️'
                        };
                    });
                }
                setUsersMap(userMapObj);

                // 2. Fetch Year Bets Status & Projections
                const { data: yData } = await supabase
                    .from('year_results')
                    .select('*')
                    .eq('season', 2026)
                    .single();

                if (yData) {
                    setIsYearLocked(yData.is_bets_locked);
                    setYearResults(yData);
                } else {
                    setIsYearLocked(false);
                }

                // 3. If year bets are locked, fetch them
                if (yData?.is_bets_locked) {
                    const { data: yBets } = await supabase.from('bets_year').select('*');
                    if (yBets) setYearBets(yBets);
                }

                // 4. Fetch Race Statuses (locked & scored)
                const { data: racesData } = await supabase.from('races').select('round, session_start, is_manual_unlock, is_scored');
                const lockMap: Record<number, boolean> = {};
                const scoreMap: Record<number, boolean> = {};
                let latestClosedRound = 1;

                if (racesData) {
                    const nextRace = getNextRace();

                    racesData.forEach(r => {
                        const raceInfo = CALENDAR.find(c => c.round === r.round);
                        if (!raceInfo) return;

                        const isNext = nextRace && raceInfo.round === nextRace.round;
                        const autoLocked = r.session_start ? isBetLocked(r.session_start) : false;

                        const isNaturallyLocked = !isNext || autoLocked;
                        const locked = r.is_manual_unlock ? false : isNaturallyLocked;

                        lockMap[r.round] = locked;
                        scoreMap[r.round] = r.is_scored;

                        if (locked && r.round > latestClosedRound) {
                            latestClosedRound = r.round;
                        }
                    });
                }
                setRaceLockStatus(lockMap);
                setRaceScoredStatus(scoreMap);
                setSelectedRound(latestClosedRound);

                // 5. Fetch ALL race bets
                const { data: rBets } = await supabase.from('bets_race').select('*');
                if (rBets) setRaceBets(rBets);

                // 6. Fetch scores for all races
                const { data: sData } = await supabase.from('scores').select('user_id, round, podium_p1_pts, podium_p2_pts, podium_p3_pts, dnf_pts, team_pts, special_pts, total_points').eq('score_type', 'race');
                if (sData) setRaceScores(sData);

            } catch (err) {
                console.error("Error fetching report data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [supabase]);

    const renderYearBets = () => {
        if (!isYearLocked) {
            return (
                <div className="telemetry-border p-8 text-center mt-4">
                    <EyeOff size={32} className="text-[var(--color-carbon-500)] mx-auto mb-3" />
                    <p className="data-readout text-sm text-[var(--color-carbon-300)]">YEAR BETS OPEN</p>
                    <p className="text-xs text-[var(--color-carbon-400)] mt-2">
                        Year bets are currently open. Other players' predictions are hidden to prevent copying.
                        They will be revealed once the betting window closes before the first race.
                    </p>
                </div>
            );
        }

        if (yearBets.length === 0) {
            return (
                <div className="telemetry-border p-8 text-center mt-4">
                    <p className="data-readout text-sm text-[var(--color-carbon-400)]">NO YEAR BETS FOUND</p>
                </div>
            );
        }

        return (
            <div className="space-y-3 mt-4 mb-4">
                <div className="flex flex-wrap items-center gap-4 px-3 py-2.5 mb-2 bg-[var(--color-carbon-900)] rounded-lg text-[9px] font-mono tracking-wider border border-[var(--color-carbon-800)]">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[var(--color-carbon-500)] rounded-sm"></div> PENDING</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[var(--color-warning)] rounded-sm shadow-[0_0_4px_var(--color-warning)]"></div> PRELIM CORRECT</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[var(--color-success)] rounded-sm shadow-[0_0_4px_var(--color-success)]"></div> FINAL CORRECT</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[var(--color-danger)] rounded-sm shadow-[0_0_4px_var(--color-danger)]"></div> INCORRECT</div>
                </div>

                {yearBets.map((bet) => {
                    const user = usersMap[bet.user_id] || { displayName: 'Unknown Racer', avatar: '🏁' };
                    const isExpanded = expandedYearUser === bet.user_id;

                    return (
                        <div key={bet.user_id} className="glass-card overflow-hidden">
                            <button
                                onClick={() => setExpandedYearUser(isExpanded ? null : bet.user_id)}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--color-carbon-800)]/40 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-[var(--color-carbon-700)] border border-[var(--color-carbon-600)] flex items-center justify-center text-sm flex-shrink-0">
                                    {user.avatar}
                                </div>
                                <div className="flex-1 font-semibold text-sm">{user.displayName}</div>
                                <ChevronDown
                                    size={16}
                                    className={`text-[var(--color-carbon-400)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-[var(--color-carbon-900)]/50"
                                    >
                                        <div className="p-4 pt-1 border-t border-[var(--color-carbon-800)] grid grid-cols-1 gap-1.5">
                                            {YEAR_BET_CATEGORIES.map(cat => {
                                                const adminVal = yearResults ? yearResults[cat.dbKey] : null;
                                                const betVal = bet[cat.dbKey];
                                                
                                                let stateColor = "text-[var(--color-carbon-400)]";
                                                let bgState = "transparent";
                                                let valColor = "text-white";

                                                if (adminVal && betVal) {
                                                    // use includes for tying gracefully (e.g. "Piastri, Norris".includes("Lando Norris"))
                                                    if (adminVal.includes(betVal)) {
                                                        const isFinal = yearResults.is_final;
                                                        stateColor = isFinal ? "text-[var(--color-success)]" : "text-[var(--color-warning)]";
                                                        valColor = "text-white font-bold";
                                                        bgState = isFinal ? "bg-[var(--color-success)]/10" : "bg-[var(--color-warning)]/10 border-l border-[var(--color-warning)]/30";
                                                    } else {
                                                        stateColor = "text-[var(--color-danger)]";
                                                        valColor = stateColor;
                                                        bgState = "bg-[var(--color-danger)]/5";
                                                    }
                                                }

                                                return (
                                                    <div key={cat.id} className={`flex items-center gap-2 text-xs py-1.5 px-2 -mx-2 rounded-sm transition-colors ${bgState}`}>
                                                        <span className={`${stateColor} w-5 flex justify-center`}>{cat.icon}</span>
                                                        <span className={`${stateColor} w-32 truncate`}>{cat.label}:</span>
                                                        <span className={`font-semibold ${valColor} truncate flex-1`}>{betVal || '—'}</span>
                                                        {adminVal && betVal && adminVal.includes(betVal) && (
                                                            <span className="text-[10px] font-mono text-white/90 ml-2 font-bold">
                                                                +{YEAR_BET_SCORING[cat.scoreKey as keyof typeof YEAR_BET_SCORING]}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRaceBets = () => {
        const isLocked = raceLockStatus[selectedRound];
        const raceInfo = CALENDAR.find(r => r.round === selectedRound);

        if (!raceInfo) return null;

        return (
            <div className="mt-4">
                {/* Round Selector */}
                <div className="flex overflow-x-auto pb-4 -mx-5 px-5 gap-2 snap-x hide-scrollbar">
                    {CALENDAR.map(race => {
                        const locked = raceLockStatus[race.round];
                        const isScored = raceScoredStatus[race.round];
                        const isSelected = selectedRound === race.round;

                        return (
                            <button
                                key={race.round}
                                onClick={() => setSelectedRound(race.round)}
                                className={`
                                    flex flex-col items-center justify-center flex-shrink-0 px-4 py-2 rounded-lg transition-all snap-start min-w-[64px]
                                    ${isSelected
                                        ? 'bg-[var(--color-f1-red)]/15 border-2 border-[var(--color-f1-red)]/50'
                                        : isScored
                                            ? 'bg-[var(--color-success)]/5 text-[var(--color-success)] border border-[var(--color-success)]/20'
                                            : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-700)]'
                                    }
                                    ${!locked && !isSelected && !isScored ? 'opacity-60' : ''}
                                `}
                            >
                                <div className={`text-xs font-bold uppercase tracking-wider font-mono ${isSelected ? 'text-[var(--color-f1-red)]' : ''}`}>
                                     R{String(race.round).padStart(2, '0')}
                                </div>
                                <div className="mt-0.5 flex items-center justify-center h-4">
                                    {isScored ? (
                                        <CheckCircle2 size={12} className={isSelected ? 'text-[var(--color-f1-red)]' : 'text-[var(--color-success)]'} />
                                    ) : locked ? (
                                        <Lock size={10} className={isSelected ? 'text-[var(--color-f1-red)]/60' : 'text-[var(--color-carbon-500)]'} />
                                    ) : (
                                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-[var(--color-f1-red)]' : 'bg-[var(--color-carbon-500)]'}`}></span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mb-4">
                    <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        R{String(raceInfo.round).padStart(2, '0')} · {raceInfo.gp}
                    </h2>
                    <p className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                        {isLocked ? 'BETS LOCKED AND VISIBLE' : 'BETS OPEN (HIDDEN)'}
                    </p>
                </div>

                {!isLocked ? (
                    <div className="telemetry-border p-8 text-center">
                        <EyeOff size={32} className="text-[var(--color-carbon-500)] mx-auto mb-3" />
                        <p className="data-readout text-sm text-[var(--color-carbon-300)]">RACE BETS OPEN</p>
                        <p className="text-xs text-[var(--color-carbon-400)] mt-2">
                            Bets for this race are currently open. Other players' predictions are hidden to prevent copying.
                            They will be revealed once the session starts.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(() => {
                            const betsForRace = raceBets.filter(b => b.round === selectedRound);

                            if (betsForRace.length === 0) {
                                return (
                                    <div className="telemetry-border p-8 text-center mt-4">
                                        <p className="data-readout text-sm text-[var(--color-carbon-400)]">NO BETS FOUND FOR THIS RACE</p>
                                    </div>
                                );
                            }

                            return betsForRace.map(bet => {
                                const user = usersMap[bet.user_id] || { displayName: 'Unknown Racer', avatar: '🏁' };
                                const scoreEntry = raceScores.find(s => s.user_id === bet.user_id && s.round === selectedRound);
                                const isScored = !!scoreEntry;

                                const getPointsColor = (pts: number | undefined) => {
                                    if (!isScored) return '';
                                    return (pts && pts > 0) ? 'text-[var(--color-success)] glow-green' : 'text-[var(--color-danger)]';
                                };
                                const getPointsIndicator = (pts: number | undefined) => {
                                    if (!isScored) return null;
                                    return (
                                        <div className={`text-[9px] mt-0.5 ${(pts && pts > 0) ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                            {pts} pts
                                        </div>
                                    );
                                };

                                return (
                                    <div key={bet.user_id} className={`glass-card p-4 ${isScored ? 'border-l-4 border-l-[var(--color-carbon-700)]' : ''}`}>
                                        <div className="flex items-center gap-3 mb-3 border-b border-[var(--color-carbon-700)] pb-3">
                                            <div className="w-6 h-6 rounded-full bg-[var(--color-carbon-700)] flex items-center justify-center text-xs">
                                                {user.avatar}
                                            </div>
                                            <div className="font-semibold text-sm">{user.displayName}</div>
                                            {isScored && (
                                                <div className="ml-auto font-mono text-xs font-bold text-[var(--color-success)]">
                                                    {scoreEntry.total_points} PTS
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {[
                                                { label: 'P1', val: bet.p1, icon: <Trophy size={12} className="text-[var(--color-warning)]" />, pts: scoreEntry?.podium_p1_pts },
                                                { label: 'P2', val: bet.p2, icon: <Medal size={12} className="text-[var(--color-carbon-300)]" />, pts: scoreEntry?.podium_p2_pts },
                                                { label: 'P3', val: bet.p3, icon: <Medal size={12} className="text-[var(--color-carbon-500)]" />, pts: scoreEntry?.podium_p3_pts },
                                            ].map(p => (
                                                <div key={p.label} className={`telemetry-border p-2 text-center bg-[var(--color-carbon-800)]/30 ${isScored && p.pts > 0 ? 'border border-[var(--color-success)]/40' : (isScored ? 'border border-[var(--color-danger)]/40' : '')}`}>
                                                    <div className="data-readout text-[8px] flex justify-center gap-1 mb-1 items-center">
                                                        {p.icon} {p.label}
                                                    </div>
                                                    <div className={`text-[11px] font-semibold truncate leading-tight ${getPointsColor(p.pts)}`} title={p.val}>
                                                        {p.val || '—'}
                                                    </div>
                                                    {getPointsIndicator(p.pts)}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 border-t border-[var(--color-carbon-800)] pt-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--color-carbon-400)] flex items-center gap-1.5">
                                                    <AlertTriangle size={12} /> DNF Driver
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold text-right max-w-[130px] truncate ${getPointsColor(scoreEntry?.dnf_pts)}`}>{bet.dnf_driver || '—'}</span>
                                                    {isScored && <span className={`text-[10px] w-8 text-right ${(scoreEntry?.dnf_pts > 0) ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{scoreEntry.dnf_pts}pts</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--color-carbon-400)] flex items-center gap-1.5">
                                                    <Users size={12} /> Team (Pts)
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold text-right max-w-[130px] truncate ${getPointsColor(scoreEntry?.team_pts)}`}>{bet.team_most_points || '—'}</span>
                                                    {isScored && <span className={`text-[10px] w-8 text-right ${(scoreEntry?.team_pts > 0) ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{scoreEntry.team_pts}pts</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mt-1">
                                                <span className="text-[var(--color-carbon-400)] flex items-start gap-1.5 w-full">
                                                    <Crown size={12} className="mt-0.5 flex-shrink-0" />
                                                    <div className="truncate pr-2">
                                                        <span className="block truncate max-w-[180px]" title={raceInfo.specialCategory.question}>{raceInfo.specialCategory.question}</span>
                                                    </div>
                                                </span>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`font-semibold text-right max-w-[100px] truncate ${getPointsColor(scoreEntry?.special_pts) || 'text-[var(--color-success)]'}`}>
                                                        {bet.special_category_answer || '—'}
                                                    </span>
                                                    {isScored && <span className={`text-[10px] w-8 text-right ${(scoreEntry?.special_pts > 0) ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{scoreEntry.special_pts}pts</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="min-h-screen pb-24">
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
                            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                Bets Report
                            </h1>
                            <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                                PUBLIC PLAYER PREDICTIONS
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-5 pt-4">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => setTab('year')}
                        className={`
                            flex-1 py-2.5 px-4 rounded-lg text-sm font-medium uppercase tracking-wider transition-all
                            ${tab === 'year'
                                ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/30'
                                : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-700)]'
                            }
                        `}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                    >
                        🏆 Year Bets
                    </button>
                    <button
                        onClick={() => setTab('race')}
                        className={`
                            flex-1 py-2.5 px-4 rounded-lg text-sm font-medium uppercase tracking-wider transition-all
                            ${tab === 'race'
                                ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/30'
                                : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-700)]'
                            }
                        `}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                    >
                        🏁 Race Bets
                    </button>
                </div>

                {loading ? (
                    <div className="telemetry-border p-12 flex flex-col items-center justify-center mt-4">
                        <div className="w-6 h-6 border-2 border-[var(--color-f1-red)]/30 border-t-[var(--color-f1-red)] rounded-full animate-spin mb-3" />
                        <span className="data-readout text-[10px] text-[var(--color-carbon-400)] uppercase">Loading Reports...</span>
                    </div>
                ) : (
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {tab === 'year' ? renderYearBets() : renderRaceBets()}
                    </motion.div>
                )}
            </div>

            <BottomNav />
        </main>
    );
}
