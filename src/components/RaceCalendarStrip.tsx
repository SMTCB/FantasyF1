'use client';

import { motion } from 'framer-motion';
import { CALENDAR, type Race } from '@/lib/f1-data';
import { Flag, MapPin, Calendar, ChevronRight, Lock, Unlock } from 'lucide-react';
import Link from 'next/link';

export default function RaceCalendarStrip() {
    const now = new Date();
    const nextRaceIdx = CALENDAR.findIndex(r => new Date(r.date) >= now);

    return (
        <div className="mb-6">
            <h3
                className="text-lg font-bold tracking-tight mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                Race Calendar
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {CALENDAR.map((race, idx) => {
                    const isPast = new Date(race.date) < now;
                    const isNext = idx === nextRaceIdx;
                    const raceDate = new Date(race.date);

                    return (
                        <motion.div
                            key={race.round}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <Link
                                href={`/bets/race/${race.round}`}
                                className={`
                  block min-w-[140px] p-3 rounded-lg border transition-all
                  ${isNext
                                        ? 'border-[var(--color-f1-red)]/50 bg-[var(--color-f1-red)]/5'
                                        : isPast
                                            ? 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/50 opacity-60'
                                            : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/30 hover:border-[var(--color-carbon-500)]'
                                    }
                `}
                            >
                                <div className="data-readout text-[9px] mb-1.5 flex items-center gap-1">
                                    <span>R{String(race.round).padStart(2, '0')}</span>
                                    {race.isSaturday && (
                                        <span className="text-[var(--color-warning)]">SAT</span>
                                    )}
                                </div>
                                <div className="font-semibold text-xs mb-1 truncate">
                                    {race.gp.replace(' GP', '')}
                                </div>
                                <div className="text-[10px] text-[var(--color-carbon-400)]">
                                    {raceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </div>
                                {isNext && (
                                    <div className="mt-2 text-[9px] font-mono font-medium text-[var(--color-f1-red)] uppercase tracking-wider flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-f1-red)] animate-pulse" />
                                        Next
                                    </div>
                                )}
                                {isPast && (
                                    <div className="mt-2 text-[9px] font-mono text-[var(--color-carbon-500)] uppercase tracking-wider">
                                        Completed
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
