'use client';

import { motion } from 'framer-motion';
import { Flag, Timer, MapPin } from 'lucide-react';
import { getNextRace, CALENDAR } from '@/lib/f1-data';
import { useEffect, useState } from 'react';

function getCountdown(targetDate: string) {
    const target = new Date(targetDate + 'T14:00:00Z'); // assume 14:00 UTC race start
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, mins, secs, expired: false };
}

export default function NextRaceHero() {
    const nextRace = getNextRace();
    const [countdown, setCountdown] = useState(getCountdown(nextRace?.date ?? ''));

    useEffect(() => {
        if (!nextRace) return;
        const interval = setInterval(() => {
            setCountdown(getCountdown(nextRace.date));
        }, 1000);
        return () => clearInterval(interval);
    }, [nextRace]);

    if (!nextRace) return null;

    const completedRaces = CALENDAR.filter(r => new Date(r.date) < new Date()).length;
    const totalRaces = CALENDAR.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-card p-5 mb-6"
        >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
                <div className="data-readout flex items-center gap-2">
                    <Flag size={12} className="text-[var(--color-f1-red)]" />
                    <span>Round {nextRace.round}/{totalRaces}</span>
                </div>
                <div className="data-readout flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                    <span>BETS OPEN</span>
                </div>
            </div>

            {/* Race Name */}
            <h2
                className="text-2xl font-bold mb-1 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                {nextRace.gp}
            </h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-carbon-300)] mb-5">
                <MapPin size={13} />
                <span>{nextRace.circuit}</span>
                <span className="text-[var(--color-carbon-500)]">•</span>
                <span>{new Date(nextRace.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {nextRace.isSaturday && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/20 text-[var(--color-warning)] font-mono font-medium uppercase tracking-wider">
                        SAT
                    </span>
                )}
            </div>

            {/* Countdown */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'DAYS', value: countdown.days },
                    { label: 'HRS', value: countdown.hours },
                    { label: 'MIN', value: countdown.mins },
                    { label: 'SEC', value: countdown.secs },
                ].map((unit) => (
                    <div
                        key={unit.label}
                        className="telemetry-border text-center py-3"
                    >
                        <div className="timer-display text-xl">
                            {String(unit.value).padStart(2, '0')}
                        </div>
                        <div className="data-readout text-[9px] mt-1">{unit.label}</div>
                    </div>
                ))}
            </div>

            {/* Season Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="data-readout text-[10px]">Season Progress</span>
                    <span className="data-readout text-[10px]">{completedRaces}/{totalRaces}</span>
                </div>
                <div className="h-1 bg-[var(--color-carbon-700)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, var(--color-f1-red), var(--color-f1-red-glow))',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedRaces / totalRaces) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
