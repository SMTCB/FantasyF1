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
import { isBetLocked } from '@/lib/openf1';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RaceBetsIndexPage() {
    const nextRace = getNextRace();
    const [manualUnlocks, setManualUnlocks] = useState<Record<number, boolean>>({});
    const [autoLocks, setAutoLocks] = useState<Record<number, boolean>>({});
    const supabase = createClient();

    useEffect(() => {
        const fetchUnlocks = async () => {
            const { data } = await supabase.from('races').select('round, is_manual_unlock, session_start');
            if (data) {
                const unlocks: Record<number, boolean> = {};
                const autoL: Record<number, boolean> = {};
                data.forEach(r => {
                    unlocks[r.round] = r.is_manual_unlock || false;
                    autoL[r.round] = r.session_start ? isBetLocked(r.session_start) : false;
                });
                setManualUnlocks(unlocks);
                setAutoLocks(autoL);
            }
        };
        fetchUnlocks();
    }, [supabase]);

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
            <div className="px-5 pt-4 space-y-3">
                {CALENDAR.map((race) => {
                    const isPast = nextRace && race.round < nextRace.round;
                    const isNext = nextRace && race.round === nextRace.round;
                    const isFuture = nextRace ? race.round > nextRace.round : false;

                    const isNaturallyLocked = isPast || (isNext && autoLocks[race.round]);
                    const isLocked = isNaturallyLocked && !manualUnlocks[race.round];
                    const isPending = isFuture && !manualUnlocks[race.round];
                    const isActive = manualUnlocks[race.round] || (isNext && !autoLocks[race.round]);

                    return (
                        <Link
                            key={race.round}
                            href={`/bets/race/${race.round}`}
                            className={`block glass-card overflow-hidden group transition-all ${!isActive ? 'opacity-60 pointer-events-none grayscale' : 'hover:border-[var(--color-f1-red)]/30'
                                }`}
                        >
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-12 h-12 rounded-lg bg-[var(--color-carbon-800)] flex flex-col items-center justify-center border border-[var(--color-carbon-700)]">
                                    <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">RD</span>
                                    <span className="font-bold text-lg leading-none">{race.round}</span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-sm group-hover:text-[var(--color-f1-red)] transition-colors">
                                        {race.gp}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-[var(--color-carbon-400)]">{race.circuit}</span>
                                        <span className="w-1 h-1 rounded-full bg-[var(--color-carbon-600)]" />
                                        <span className="text-[10px] text-[var(--color-carbon-400)]">
                                            {new Date(race.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1.5">
                                    {isActive ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase tracking-wider">
                                            Open
                                        </span>
                                    ) : isLocked ? (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20 uppercase tracking-wider">
                                            Locked
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--color-carbon-700)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-600)] uppercase tracking-wider">
                                            Locked
                                        </span>
                                    )}
                                    <ChevronRight size={14} className="text-[var(--color-carbon-600)]" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <BottomNav />
        </main>
    );
}
