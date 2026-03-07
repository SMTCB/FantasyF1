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
    EyeOff
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { CALENDAR, getNextRace, ALL_DRIVERS, TEAMS, RACE_BET_SCORING } from '@/lib/f1-data';
import { isBetLocked } from '@/lib/openf1';

// Same structure as in page.tsx for year bets
const YEAR_BET_CATEGORIES = [
    { id: 'driver_champion', label: 'Driver Champion', icon: <Crown size={14} />, type: 'driver', dbKey: 'driver_champion' },
    { id: 'driver_p2', label: 'Driver Runner-up', icon: <Medal size={14} />, type: 'driver', dbKey: 'driver_p2' },
    { id: 'driver_p3', label: 'Driver P3', icon: <Medal size={14} />, type: 'driver', dbKey: 'driver_p3' },
    { id: 'constructor_champion', label: 'Constructors Champion', icon: <Trophy size={14} />, type: 'constructor', dbKey: 'constructor_champion' },
    { id: 'last_constructor', label: 'Last Place Constructor', icon: <AlertTriangle size={14} />, type: 'constructor', dbKey: 'last_constructor' },
    { id: 'fewest_finishers', label: 'Race w/ Fewest Finishers', icon: <Skull size={14} />, type: 'race', dbKey: 'fewest_finishers_race' },
    { id: 'most_dnfs', label: 'Most DNFs Driver', icon: <AlertTriangle size={14} />, type: 'driver', dbKey: 'most_dnfs_driver' },
    { id: 'first_replaced', label: 'First Driver Replaced', icon: <UserX size={14} />, type: 'driver', dbKey: 'first_driver_replaced' },
    { id: 'most_poles', label: 'Most Poles', icon: <Crosshair size={14} />, type: 'driver', dbKey: 'most_poles' },
    { id: 'most_podiums_no_win', label: 'Most Podiums w/o Win', icon: <Award size={14} />, type: 'driver', dbKey: 'most_podiums_no_win' },
];

export default function BetsReportPage() {
    const [tab, setTab] = useState<'year' | 'race'>('year');

    // Status
    const [loading, setLoading] = useState(true);
    const [usersMap, setUsersMap] = useState<Record<string, { displayName: string, avatar: string }>>({});

    // Year Bets State
    const [isYearLocked, setIsYearLocked] = useState(false);
    const [yearBets, setYearBets] = useState<any[]>([]);
    const [expandedYearUser, setExpandedYearUser] = useState<string | null>(null);

    // Race Bets State
    const [selectedRound, setSelectedRound] = useState<number>(0);
    const [raceLockStatus, setRaceLockStatus] = useState<Record<number, boolean>>({});
    const [raceBets, setRaceBets] = useState<any[]>([]);
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

                // 2. Fetch Year Bets Status
                const { data: lockData } = await supabase
                    .from('year_results')
                    .select('is_bets_locked')
                    .eq('season', 2026)
                    .single();

                const yearLocked = lockData ? lockData.is_bets_locked : false;
                setIsYearLocked(yearLocked);

                // 3. If year bets are locked, fetch them
                if (yearLocked) {
                    const { data: yBets } = await supabase.from('bets_year').select('*');
                    if (yBets) setYearBets(yBets);
                }

                // 4. Fetch Race Statuses (which races are locked)
                const { data: racesData } = await supabase.from('races').select('round, session_start, is_manual_unlock');
                const lockMap: Record<number, boolean> = {};
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

                        if (locked && r.round > latestClosedRound) {
                            latestClosedRound = r.round;
                        }
                    });
                }
                setRaceLockStatus(lockMap);
                setSelectedRound(latestClosedRound);

                // 5. Fetch ALL race bets
                const { data: rBets } = await supabase.from('bets_race').select('*');
                if (rBets) setRaceBets(rBets);

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
            <div className="space-y-3 mt-4">
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
                                            {YEAR_BET_CATEGORIES.map(cat => (
                                                <div key={cat.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-[var(--color-carbon-800)]/50 last:border-0">
                                                    <span className="text-[var(--color-carbon-400)] w-5 flex justify-center">{cat.icon}</span>
                                                    <span className="text-[var(--color-carbon-400)] w-32 truncate">{cat.label}:</span>
                                                    <span className="font-semibold text-white truncate">{bet[cat.dbKey] || '—'}</span>
                                                </div>
                                            ))}
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
                        const isSelected = selectedRound === race.round;

                        return (
                            <button
                                key={race.round}
                                onClick={() => setSelectedRound(race.round)}
                                className={`
                                    flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all snap-start whitespace-nowrap
                                    ${isSelected
                                        ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/30'
                                        : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-700)]'
                                    }
                                    ${!locked && !isSelected ? 'opacity-60' : ''}
                                `}
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                R{String(race.round).padStart(2, '0')}
                                {locked ? ' 🔒' : ''}
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

                                return (
                                    <div key={bet.user_id} className="glass-card p-4">
                                        <div className="flex items-center gap-3 mb-3 border-b border-[var(--color-carbon-700)] pb-3">
                                            <div className="w-6 h-6 rounded-full bg-[var(--color-carbon-700)] flex items-center justify-center text-xs">
                                                {user.avatar}
                                            </div>
                                            <div className="font-semibold text-sm">{user.displayName}</div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {[
                                                { label: 'P1', val: bet.p1, icon: <Trophy size={12} className="text-[var(--color-warning)]" /> },
                                                { label: 'P2', val: bet.p2, icon: <Medal size={12} className="text-[var(--color-carbon-300)]" /> },
                                                { label: 'P3', val: bet.p3, icon: <Medal size={12} className="text-[var(--color-carbon-500)]" /> },
                                            ].map(p => (
                                                <div key={p.label} className="telemetry-border p-2 text-center bg-[var(--color-carbon-800)]/30">
                                                    <div className="data-readout text-[8px] flex justify-center gap-1 mb-1 items-center">
                                                        {p.icon} {p.label}
                                                    </div>
                                                    <div className="text-[11px] font-semibold truncate leading-tight h-4" title={p.val}>
                                                        {p.val || '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 border-t border-[var(--color-carbon-800)] pt-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--color-carbon-400)] flex items-center gap-1.5">
                                                    <AlertTriangle size={12} /> DNF
                                                </span>
                                                <span className="font-semibold text-right max-w-[150px] truncate">{bet.dnf_driver || '—'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--color-carbon-400)] flex items-center gap-1.5">
                                                    <Users size={12} /> Team (Pts)
                                                </span>
                                                <span className="font-semibold text-right max-w-[150px] truncate">{bet.team_most_points || '—'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs mt-1">
                                                <span className="text-[var(--color-carbon-400)] flex items-start gap-1.5 w-full">
                                                    <Crown size={12} className="mt-0.5 flex-shrink-0" />
                                                    <div className="truncate pr-2">
                                                        <span className="block truncate max-w-[180px]" title={raceInfo.specialCategory.question}>{raceInfo.specialCategory.question}</span>
                                                    </div>
                                                </span>
                                                <span className="font-semibold text-[var(--color-success)] text-right max-w-[100px] truncate flex-shrink-0">
                                                    {bet.special_category_answer || '—'}
                                                </span>
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
    }

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

            {/* Content */}
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
