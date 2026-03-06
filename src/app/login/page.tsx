'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { display_name: displayName },
                    },
                });
                if (error) throw error;
                setSuccess('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-5">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-f1-red), #c20500)',
                            boxShadow: '0 8px 32px rgba(225, 6, 0, 0.3)',
                        }}
                    >
                        <Gauge size={28} className="text-white" />
                    </motion.div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        PADDOCK
                    </h1>
                    <p className="data-readout text-[10px] mt-1 text-[var(--color-carbon-400)]">
                        FANTASY F1 LEAGUE · 2026 SEASON
                    </p>
                </div>

                {/* Auth Card */}
                <div className="glass-card p-6">
                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                            >
                                <label className="data-readout text-[9px] block mb-1.5">DISPLAY NAME</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your racing alias"
                                    className="input-field"
                                    required
                                />
                            </motion.div>
                        )}

                        <div>
                            <label className="data-readout text-[9px] block mb-1.5">EMAIL</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-carbon-400)]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="input-field pl-9"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="data-readout text-[9px] block mb-1.5">PASSWORD</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-carbon-400)]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field pl-9"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg p-3"
                            >
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-lg p-3"
                            >
                                {success}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isSignUp ? (
                                <>
                                    <UserPlus size={14} />
                                    CREATE ACCOUNT
                                </>
                            ) : (
                                <>
                                    <LogIn size={14} />
                                    SIGN IN
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-xs text-[var(--color-carbon-400)] hover:text-[var(--color-carbon-200)] transition-colors"
                        >
                            {isSignUp
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="data-readout text-[9px] text-[var(--color-carbon-500)]">
                        PRIVATE LEAGUE · INVITE ONLY
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
