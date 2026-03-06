'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flag,
    ChevronRight,
    MapPin,
    Calendar,
    Lock,
    Unlock,
    ChevronLeft,
    ChevronDown,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { CALENDAR, getNextRace } from '@/lib/f1-data';
import Link from 'next/link';

export default function RaceBetsIndexPage() {
    const now = new Date();
    const nextRace = getNextRace();

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
                    <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        Race Bets
                    </h1>
                    <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                        SELECT A RACE TO PLACE YOUR BETS
                    </span>
                </div>
            </header>

            {/* Race List */}
            <div className="px-5 pt-4 space-y-2">
                {CALENDAR.map((race, idx) => {
                    const raceDate = new Date(race.date);
                    const isPast = raceDate < now;
                    const isNext = nextRace?.round === race.round;

                    return (
                        <motion.div
                            key={race.round}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <Link
                                href={`/bets/race/${race.round}`}
                                className={`
                  glass-card flex items-center gap-3 p-4 transition-all
                  ${isNext ? 'border-[var(--color-f1-red)]/40' : ''}
                  ${isPast ? 'opacity-50' : ''}
                `}
                            >
                                {/* Round Badge */}
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm"
                                    style={{
                                        background: isNext
                                            ? 'linear-gradient(135deg, var(--color-f1-red), #c20500)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: isNext ? 'white' : 'var(--color-carbon-300)',
                                    }}
                                >
                                    R{String(race.round).padStart(2, '0')}
                                </div>

                                {/* Race Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                        {race.gp}
                                        {race.isSaturday && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)] font-mono uppercase tracking-wider">
                                                SAT
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-carbon-400)] mt-0.5">
                                        <MapPin size={10} />
                                        <span>{race.circuit}</span>
                                        <span className="text-[var(--color-carbon-600)]">•</span>
                                        <span>{raceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {isPast ? (
                                        <span className="data-readout text-[9px] text-[var(--color-carbon-500)]">CLOSED</span>
                                    ) : isNext ? (
                                        <span className="lock-indicator open">
                                            <Unlock size={10} />
                                            OPEN
                                        </span>
                                    ) : (
                                        <span className="data-readout text-[9px] text-[var(--color-carbon-500)]">UPCOMING</span>
                                    )}
                                    <ChevronRight size={16} className="text-[var(--color-carbon-500)]" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            <BottomNav />
        </main>
    );
}
