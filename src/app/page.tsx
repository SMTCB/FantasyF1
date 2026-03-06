'use client';

import BottomNav from '@/components/BottomNav';
import NextRaceHero from '@/components/NextRaceHero';
import Leaderboard from '@/components/Leaderboard';
import RaceCalendarStrip from '@/components/RaceCalendarStrip';
import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';

// Mock leaderboard data — will be replaced with Supabase queries
const MOCK_ENTRIES = [
    { userId: '1', displayName: 'Speed Demon', totalPoints: 0, avatarEmoji: '🏎️' },
    { userId: '2', displayName: 'Pit Stop Pro', totalPoints: 0, avatarEmoji: '🔧' },
    { userId: '3', displayName: 'DRS Master', totalPoints: 0, avatarEmoji: '💨' },
    { userId: '4', displayName: 'Grid Walker', totalPoints: 0, avatarEmoji: '🚦' },
    { userId: '5', displayName: 'Tyre Whisperer', totalPoints: 0, avatarEmoji: '🛞' },
];

export default function DashboardPage() {
    return (
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40">
                <div
                    className="px-5 py-4"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 100%)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-f1-red), #c20500)',
                                }}
                            >
                                <Gauge size={16} className="text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-base font-bold tracking-tight leading-tight"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    PADDOCK
                                </h1>
                                <span className="data-readout text-[9px] text-[var(--color-carbon-400)]">
                                    FANTASY F1 · 2026
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="telemetry-border px-3 py-1.5">
                                <span className="data-readout text-[10px]">
                                    SYS ONLINE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="px-5 pt-5">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <NextRaceHero />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <RaceCalendarStrip />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <Leaderboard entries={MOCK_ENTRIES} />
                </motion.div>
            </div>

            <BottomNav />
        </main>
    );
}
