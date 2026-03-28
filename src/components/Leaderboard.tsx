'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    totalPoints: number;
    racePoints?: number;
    yearPoints?: number;
    previousPosition?: number;
    avatarEmoji?: string;
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
    // Determine Real Rank (by race points strictly)
    const realSorted = [...entries].sort((a, b) => {
        const raceDiff = (b.racePoints || 0) - (a.racePoints || 0);
        if (raceDiff !== 0) return raceDiff;
        return (b.yearPoints || 0) - (a.yearPoints || 0);
    });

    const entriesWithRanks = realSorted.map((e, idx) => ({ ...e, realRank: idx + 1 }));

    // Determine Prelim Rank (by total points which includes year bets)
    const prelimSorted = [...entriesWithRanks].sort((a, b) => b.totalPoints - a.totalPoints);
    const finalEntries = prelimSorted.map((e, idx) => {
        const originalEntry = entriesWithRanks.find(o => o.userId === e.userId);
        return {
            ...e,
            realRank: originalEntry?.realRank || 0,
            prelimRank: idx + 1
        };
    });

    // We sort the display primarily via the Real Rank per user's anchor preference
    const displaySorted = [...finalEntries].sort((a, b) => a.realRank - b.realRank);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--color-carbon-700)] pb-2">
                <div>
                    <h3
                        className="text-lg font-bold tracking-tight text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Championship Standings
                    </h3>
                    <p className="data-readout text-[10px] text-[var(--color-carbon-400)] mt-0.5">
                        RANKED BY REAL POINTS (RACES)
                    </p>
                </div>
                <div className="flex bg-[var(--color-carbon-800)]/50 rounded-lg p-1 border border-[var(--color-carbon-700)]">
                     <span className="data-readout text-[9px] px-2 py-1 text-[var(--color-carbon-300)] animate-pulse">LIVE TRACKING</span>
                </div>
            </div>

            <AnimatePresence>
                {displaySorted.map((entry, idx) => {
                    const posChange = entry.previousPosition
                        ? entry.previousPosition - entry.realRank
                        : 0;

                    const isFirst = entry.realRank === 1;
                    const isPodium = entry.realRank <= 3;

                    return (
                        <motion.div
                            key={entry.userId}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                                layout: { type: 'spring', stiffness: 400, damping: 30 },
                                delay: idx * 0.05,
                            }}
                            className={`glass-card flex flex-col gap-2 p-3 group transition-colors relative overflow-hidden ${isFirst ? 'border-[var(--color-f1-red)]/30 bg-[var(--color-f1-red)]/5' : 'hover:border-[var(--color-carbon-500)]'}`}
                        >
                            {/* Top row: Positioning and Names */}
                            <div className="flex items-center gap-3 w-full">
                                {/* Position Badge */}
                                <div
                                    className={`position-badge shadow-sm ${entry.realRank === 1
                                        ? 'p1 shadow-[var(--color-f1-red)]/40'
                                        : entry.realRank === 2
                                            ? 'p2'
                                            : entry.realRank === 3
                                                ? 'p3'
                                                : ''
                                        }`}
                                    style={
                                        entry.realRank > 3
                                            ? {
                                                background: 'rgba(255,255,255,0.04)',
                                                color: 'var(--color-carbon-300)',
                                            }
                                            : undefined
                                    }
                                >
                                    {entry.realRank}
                                </div>

                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner ${isPodium ? 'bg-[var(--color-carbon-800)] border border-[var(--color-carbon-600)]' : 'bg-[var(--color-carbon-800)]'}`}>
                                    {entry.avatarEmoji || '🏎️'}
                                </div>

                                {/* Name & Projected Rank */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="font-bold text-[15px] truncate text-white tracking-tight flex items-center gap-2">
                                        {entry.displayName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="data-readout text-[9px] text-[var(--color-carbon-400)] flex items-center gap-1">
                                            <span>PROJ RANK:</span> 
                                            <span className={`px-1 rounded-sm ${entry.prelimRank < entry.realRank ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : entry.prelimRank > entry.realRank ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-300)]'}`}>
                                                P{entry.prelimRank}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Trend */}
                                <div className="flex items-center gap-1 bg-[var(--color-carbon-800)]/80 p-1.5 rounded-md border border-[var(--color-carbon-700)]">
                                    {posChange > 0 && <TrendingUp size={14} className="text-[var(--color-success)]" />}
                                    {posChange < 0 && <TrendingDown size={14} className="text-[var(--color-danger)]" />}
                                    {posChange === 0 && <Minus size={14} className="text-[var(--color-carbon-500)]" />}
                                </div>
                            </div>

                            {/* Bottom row: Expanded Points Breakdowns */}
                            <div className="mt-1 pt-2 border-t border-[var(--color-carbon-800)] flex items-center justify-between gap-2 overflow-x-auto scroller-hide pb-0.5">
                                {/* Real Points */}
                                <div className="flex flex-col items-center min-w-[70px] bg-[var(--color-carbon-800)]/40 rounded-md py-1 border border-[var(--color-carbon-700)]">
                                     <span className="data-readout text-[8px] text-[var(--color-carbon-400)] mb-0.5">REAL (RACES)</span>
                                     <span className="font-mono text-sm font-bold text-white">{entry.racePoints ?? 0}</span>
                                </div>

                                {/* Operator */}
                                <span className="text-[var(--color-carbon-500)] font-mono text-xs">+</span>

                                {/* Preliminary Points */}
                                <div className={`flex flex-col items-center min-w-[70px] rounded-md py-1 border ${entry.yearPoints && entry.yearPoints > 0 ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30' : 'bg-[var(--color-carbon-800)]/40 border-[var(--color-carbon-700)]'}`}>
                                    <span className={`data-readout text-[8px] mb-0.5 ${entry.yearPoints && entry.yearPoints > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-carbon-500)]'}`}>PRELIM (YEAR)</span>
                                    <span className={`font-mono text-sm font-bold ${entry.yearPoints && entry.yearPoints > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-carbon-500)]'}`}>{entry.yearPoints ?? 0}</span>
                                </div>

                                {/* Operator */}
                                <span className="text-[var(--color-carbon-500)] font-mono text-xs">=</span>

                                {/* Total Points */}
                                <div className={`flex flex-col items-center min-w-[70px] rounded-md py-1 border ${isFirst ? 'bg-[var(--color-f1-red)]/10 border-[var(--color-f1-red)]/40' : 'bg-white/5 border-white/10'}`}>
                                     <span className={`data-readout text-[8px] mb-0.5 ${isFirst ? 'text-[var(--color-f1-red)]' : 'text-[var(--color-carbon-300)]'}`}>TOTAL OVRL</span>
                                     <span className={`font-mono text-sm font-bold ${isFirst ? 'text-[var(--color-f1-red)] drop-shadow-[0_0_2px_rgba(255,0,0,0.5)]' : 'text-white'}`}>{entry.totalPoints ?? 0}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {entries.length === 0 && (
                <div className="telemetry-border p-8 text-center mt-6">
                    <p className="data-readout text-sm">NO STANDINGS DATA</p>
                    <p className="text-xs text-[var(--color-carbon-400)] mt-2">
                        Awaiting initial race results...
                    </p>
                </div>
            )}
        </div>
    );
}
