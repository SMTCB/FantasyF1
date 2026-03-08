'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import NextRaceHero from '@/components/NextRaceHero';
import Leaderboard from '@/components/Leaderboard';
import RaceCalendarStrip from '@/components/RaceCalendarStrip';
import { motion } from 'framer-motion';
import { Gauge, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { type LeaderboardEntry } from '@/components/Leaderboard';

// No more mock entries — fetching from Supabase leaderboard view!

export default function DashboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userProfile, setUserProfile] = useState<{ username: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Extract username from email alias
            const displayUsername = user.email?.split('@')[0] || 'Racer';
            setUserProfile({ username: displayUsername });
        };

        const fetchLeaderboard = async () => {
            try {
                const { data, error } = await supabase
                    .from('leaderboard')
                    .select('*')
                    .order('total_points', { ascending: false });

                if (error) throw error;

                // Map DB view fields to matching prop names
                const mappedEntries: LeaderboardEntry[] = (data || []).map(row => ({
                    userId: row.user_id,
                    displayName: row.display_name,
                    totalPoints: row.total_points,
                    racePoints: row.race_points || 0,
                    yearPoints: row.year_points || 0,
                    avatarEmoji: row.avatar_emoji || '🏎️'
                }));

                setEntries(mappedEntries);
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
        fetchLeaderboard();
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
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

                        <div className="flex items-center gap-3">
                            {userProfile && (
                                <div className="flex flex-col items-end">
                                    <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">ACTIVE USER</span>
                                    <span className="text-xs font-bold text-[var(--color-f1-red)] uppercase tracking-wider">
                                        {userProfile.username}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="telemetry-border px-3 py-1.5 hover:bg-[var(--color-f1-red)]/10 transition-colors"
                            >
                                <span className="data-readout text-[8px] text-[var(--color-carbon-300)]">
                                    SIGNOUT
                                </span>
                            </button>
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
                    {loading ? (
                        <div className="telemetry-border p-12 flex flex-col items-center justify-center">
                            <div className="w-6 h-6 border-2 border-[var(--color-f1-red)]/30 border-t-[var(--color-f1-red)] rounded-full animate-spin mb-3" />
                            <span className="data-readout text-[10px] text-[var(--color-carbon-400)] uppercase">Synchronizing Standings...</span>
                        </div>
                    ) : (
                        <Leaderboard entries={entries} />
                    )}
                </motion.div>
            </div>

            <BottomNav />
        </main>
    );
}
