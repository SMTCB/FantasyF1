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
    const sorted = [...entries].sort((a, b) => b.totalPoints - a.totalPoints);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <h3
                    className="text-lg font-bold tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    Championship Standings
                </h3>
                <span className="data-readout text-[10px]">LIVE</span>
            </div>

            <AnimatePresence>
                {sorted.map((entry, idx) => {
                    const position = idx + 1;
                    const posChange = entry.previousPosition
                        ? entry.previousPosition - position
                        : 0;

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
                            className="glass-card flex items-center gap-3 p-3 group hover:border-[var(--color-f1-red)]/30 transition-colors"
                        >
                            {/* Position */}
                            <div
                                className={`position-badge ${position === 1
                                    ? 'p1'
                                    : position === 2
                                        ? 'p2'
                                        : position === 3
                                            ? 'p3'
                                            : ''
                                    }`}
                                style={
                                    position > 3
                                        ? {
                                            background: 'rgba(255,255,255,0.06)',
                                            color: 'var(--color-carbon-300)',
                                        }
                                        : undefined
                                }
                            >
                                {position}
                            </div>

                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-[var(--color-carbon-700)] flex items-center justify-center text-sm">
                                {entry.avatarEmoji || '🏎️'}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">
                                    {entry.displayName}
                                </div>
                                {(entry.yearPoints !== undefined && entry.yearPoints > 0) && (
                                    <div className="text-[10px] text-[var(--color-carbon-400)] mt-0.5">
                                        {(entry.racePoints ?? 0)} race + <span className="text-[var(--color-warning)] font-medium">{(entry.yearPoints ?? 0)} year*</span>
                                    </div>
                                )}
                            </div>

                            {/* Trend */}
                            <div className="flex items-center gap-1">
                                {posChange > 0 && (
                                    <TrendingUp size={14} className="text-[var(--color-success)]" />
                                )}
                                {posChange < 0 && (
                                    <TrendingDown size={14} className="text-[var(--color-danger)]" />
                                )}
                                {posChange === 0 && (
                                    <Minus size={14} className="text-[var(--color-carbon-500)]" />
                                )}
                            </div>

                            {/* Points */}
                            <div className="score-pill">{entry.totalPoints}</div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {entries.length === 0 && (
                <div className="telemetry-border p-8 text-center">
                    <p className="data-readout text-sm">NO DATA — SEASON NOT STARTED</p>
                    <p className="text-xs text-[var(--color-carbon-400)] mt-2">
                        Standings appear after the first race results are scored.
                    </p>
                </div>
            )}
        </div>
    );
}
