'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Flag,
    MapPin,
    Lock,
    CheckCircle,
    Search,
    Trophy,
    Medal,
    Star,
    Zap,
    AlertTriangle,
    Users,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { getRaceByRound, ALL_DRIVERS, TEAMS, RACE_BET_SCORING, getNextRace } from '@/lib/f1-data';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { isBetLocked } from '@/lib/openf1';

function DriverCard({
    driver,
    isSelected,
    onSelect,
    position,
}: {
    driver: (typeof ALL_DRIVERS)[0];
    isSelected: boolean;
    onSelect: () => void;
    position?: string;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onSelect}
            className={`
        flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left w-full
        ${isSelected
                    ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10'
                    : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 hover:border-[var(--color-carbon-500)]'
                }
      `}
        >
            <div
                className="w-2 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: driver.teamColor }}
            />
            <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{driver.name}</div>
                <div className="data-readout text-[9px]">{driver.team}</div>
            </div>
            {isSelected && position && (
                <span className="text-xs font-mono font-bold text-[var(--color-f1-red)]">{position}</span>
            )}
            {isSelected && <CheckCircle size={14} className="text-[var(--color-f1-red)] flex-shrink-0" />}
        </motion.button>
    );
}

export default function RaceBetPage() {
    const params = useParams();
    const router = useRouter();
    const round = Number(params.round);
    const race = getRaceByRound(round);

    const [p1, setP1] = useState<string | null>(null);
    const [p2, setP2] = useState<string | null>(null);
    const [p3, setP3] = useState<string | null>(null);
    const [dnf, setDnf] = useState<string | null>(null);
    const [teamMostPts, setTeamMostPts] = useState<string | null>(null);
    const [specialBet, setSpecialBet] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState<'podium' | 'extras'>('podium');
    const [submitted, setSubmitted] = useState(false);
    const [isLockForced, setIsLockForced] = useState(false);
    const [isRaceLocked, setIsRaceLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchBetData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch existing bet
            const { data: bet } = await supabase
                .from('bets_race')
                .select('*')
                .eq('user_id', user.id)
                .eq('round', round)
                .single();

            if (bet) {
                setP1(bet.p1);
                setP2(bet.p2);
                setP3(bet.p3);
                setDnf(bet.dnf_driver);
                setTeamMostPts(bet.team_most_points);
                setSpecialBet(bet.special_category_answer);
                setSubmitted(true);
            }

            // 2. Fetch race lock status & manual override
            const { data: raceData } = await supabase
                .from('races')
                .select('session_start, is_manual_unlock')
                .eq('round', round)
                .single();

            if (raceData) {
                const nextRace = getNextRace();
                const isNext = nextRace && race?.round === nextRace.round;
                const autoLocked = raceData.session_start ? isBetLocked(raceData.session_start) : false;

                // A race is locked IF:
                // 1. It is NOT the current upcoming race (isNext is false)
                // 2. OR it is the current race but has automatically closed (autoLocked is true)
                // UNLESS: The admin has manually forced it open (is_manual_unlock is true)
                const isNaturallyLocked = !isNext || autoLocked;
                const locked = raceData.is_manual_unlock ? false : isNaturallyLocked;

                setIsRaceLocked(locked);
                setIsLockForced(raceData.is_manual_unlock);
            }
            setLoading(false);
        };
        fetchBetData();
    }, [round, supabase]);

    if (!race) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="data-readout text-lg">RACE NOT FOUND</p>
                    <Link href="/bets/race" className="btn-secondary mt-4 inline-block">
                        Back to Calendar
                    </Link>
                </div>
                <BottomNav />
            </main>
        );
    }

    const raceDate = new Date(race.date);
    const isPast = raceDate < new Date();

    const filteredDrivers = ALL_DRIVERS.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedPodium = [p1, p2, p3].filter(Boolean);
    const allBetsFilled = p1 && p2 && p3 && dnf && teamMostPts && specialBet;

    const handleSubmit = async () => {
        if (!allBetsFilled || isRaceLocked) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('bets_race')
            .upsert({
                user_id: user.id,
                round: round,
                p1,
                p2,
                p3,
                dnf_driver: dnf,
                team_most_points: teamMostPts,
                special_category_answer: specialBet,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, round'
            });

        if (error) {
            console.error(error);
            alert("Failed to save bets. Please try again.");
        } else {
            setSubmitted(true);
        }
    };

    return (
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40">
                <div
                    className="px-5 py-3"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.85) 100%)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => router.back()} className="text-[var(--color-carbon-400)]">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                R{String(race.round).padStart(2, '0')} · {race.gp}
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--color-carbon-400)]">
                                <MapPin size={10} />
                                <span>{race.circuit}</span>
                                <span>·</span>
                                <span>{raceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                        {isRaceLocked ? (
                            <span className="lock-indicator locked"><Lock size={10} /> LOCKED</span>
                        ) : isLockForced ? (
                            <span className="lock-indicator open text-[var(--color-success)] border-[var(--color-success)]/40"><Zap size={10} /> FORCED OPEN</span>
                        ) : (
                            <span className="lock-indicator open"><Flag size={10} /> OPEN</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Choices Area */}
            <div className={`px-5 pt-4 ${submitted ? 'opacity-70' : ''}`}>
                {!submitted && !isRaceLocked && (
                    <div className="flex gap-2 mb-5">
                        {(['podium', 'extras'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSection(tab)}
                                className={`
                  flex-1 py-2.5 px-4 rounded-lg text-sm font-medium uppercase tracking-wider transition-all
                  ${activeSection === tab
                                        ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/30'
                                        : 'bg-[var(--color-carbon-800)] text-[var(--color-carbon-400)] border border-[var(--color-carbon-700)]'
                                    }
                `}
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                            >
                                {tab === 'podium' ? '🏆 Podium' : '⚡ Extras'}
                            </button>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeSection === 'podium' && (
                        <motion.div
                            key="podium"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {/* Podium Selection Status */}
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {[
                                    { label: 'P1', value: p1, pts: RACE_BET_SCORING.EXACT_P1, icon: <Trophy size={14} /> },
                                    { label: 'P2', value: p2, pts: RACE_BET_SCORING.EXACT_P2, icon: <Medal size={14} /> },
                                    { label: 'P3', value: p3, pts: RACE_BET_SCORING.EXACT_P3, icon: <Medal size={14} /> },
                                ].map((pos) => (
                                    <div
                                        key={pos.label}
                                        className={`telemetry-border p-3 text-center ${pos.value ? 'border-[var(--color-success)]/30' : ''}`}
                                    >
                                        <div className="data-readout text-[9px] mb-1 flex items-center justify-center gap-1">
                                            {pos.icon}
                                            {pos.label}
                                        </div>
                                        <div className="text-xs font-semibold truncate">
                                            {pos.value || '—'}
                                        </div>
                                        <div className="data-readout text-[8px] mt-1 text-[var(--color-success)]">{pos.pts}pts</div>
                                    </div>
                                ))}
                            </div>

                            {p1 && p2 && p3 && (
                                <div className="glass-card p-3 mb-4 text-center text-xs text-[var(--color-success)]">
                                    🎯 All 3 correct = <strong>+{RACE_BET_SCORING.ALL_PODIUM_BONUS}pts bonus!</strong>
                                </div>
                            )}

                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-carbon-400)]" />
                                <input
                                    type="text"
                                    placeholder="Search driver..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input-field pl-9 text-sm"
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {filteredDrivers.map((driver) => {
                                    const isP1 = p1 === driver.name;
                                    const isP2 = p2 === driver.name;
                                    const isP3 = p3 === driver.name;
                                    const isSelected = isP1 || isP2 || isP3;

                                    return (
                                        <DriverCard
                                            key={driver.name}
                                            driver={driver}
                                            isSelected={isSelected}
                                            position={isP1 ? 'P1' : isP2 ? 'P2' : isP3 ? 'P3' : undefined}
                                            onSelect={() => {
                                                // Cycle through positions: first click = P1, second = P2, etc.
                                                if (isP1) { setP1(null); return; }
                                                if (isP2) { setP2(null); return; }
                                                if (isP3) { setP3(null); return; }
                                                if (!p1) { setP1(driver.name); return; }
                                                if (!p2) { setP2(driver.name); return; }
                                                if (!p3) { setP3(driver.name); return; }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'extras' && (
                        <motion.div
                            key="extras"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-5"
                        >
                            {/* DNF Prediction */}
                            <div>
                                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-[var(--color-warning)]" />
                                    DNF Prediction
                                    <span className="score-pill text-[9px] ml-auto">{RACE_BET_SCORING.DNF}pts</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                                    {ALL_DRIVERS.map((driver) => (
                                        <DriverCard
                                            key={driver.name}
                                            driver={driver}
                                            isSelected={dnf === driver.name}
                                            onSelect={() => setDnf(dnf === driver.name ? null : driver.name)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Team Most Points */}
                            <div>
                                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                    <Users size={14} className="text-[var(--color-info)]" />
                                    Team with Most Points
                                    <span className="score-pill text-[9px] ml-auto">{RACE_BET_SCORING.TEAM_MOST_POINTS}pts</span>
                                </h3>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                    {TEAMS.map((team) => (
                                        <motion.button
                                            key={team.shortName}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => setTeamMostPts(teamMostPts === team.shortName ? null : team.shortName)}
                                            className={`
                          flex items-center gap-3 p-3 rounded-lg border transition-all text-left w-full
                          ${teamMostPts === team.shortName
                                                    ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10'
                                                    : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 hover:border-[var(--color-carbon-500)]'
                                                }
                        `}
                                        >
                                            <div
                                                className="w-3 h-8 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: team.color }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm">{team.shortName}</div>
                                                <div className="data-readout text-[9px]">{team.drivers.join(' · ')}</div>
                                            </div>
                                            {teamMostPts === team.shortName && (
                                                <CheckCircle size={16} className="text-[var(--color-f1-red)]" />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Special Category */}
                            <div>
                                <h3 className="font-semibold text-sm mb-2 flex items-start gap-2">
                                    <Star size={14} className="text-[var(--color-warning)] mt-1 flex-shrink-0" />
                                    <div>
                                        {race.specialCategory.question}
                                        <div className="data-readout text-[9px] mt-1 text-[var(--color-carbon-400)]">SPECIAL CATEGORY</div>
                                    </div>
                                    <span className="score-pill text-[9px] ml-auto">{RACE_BET_SCORING.SPECIAL_CATEGORY}pts</span>
                                </h3>

                                {race.specialCategory.type === 'driver' && (
                                    <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
                                        {ALL_DRIVERS.map((driver) => (
                                            <DriverCard
                                                key={driver.name}
                                                driver={driver}
                                                isSelected={specialBet === driver.name}
                                                onSelect={() => setSpecialBet(specialBet === driver.name ? null : driver.name)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {race.specialCategory.type === 'team' && (
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                        {TEAMS.map((team) => (
                                            <motion.button
                                                key={team.shortName}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setSpecialBet(specialBet === team.shortName ? null : team.shortName)}
                                                className={`
                                                        flex items-center gap-3 p-3 rounded-lg border transition-all text-left w-full
                                                        ${specialBet === team.shortName
                                                        ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10'
                                                        : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 hover:border-[var(--color-carbon-500)]'
                                                    }
                                                    `}
                                            >
                                                <div className="w-3 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm">{team.shortName}</div>
                                                </div>
                                                {specialBet === team.shortName && (
                                                    <CheckCircle size={16} className="text-[var(--color-f1-red)]" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                {race.specialCategory.type === 'options' && race.specialCategory.options && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {race.specialCategory.options.map((opt) => (
                                            <motion.button
                                                key={opt}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setSpecialBet(specialBet === opt ? null : opt)}
                                                className={`
                                                        p-4 rounded-lg border transition-all font-semibold text-center
                                                        ${specialBet === opt
                                                        ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10 text-white'
                                                        : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 text-[var(--color-carbon-300)] hover:border-[var(--color-carbon-500)]'
                                                    }
                                                    `}
                                            >
                                                {opt}
                                                {specialBet === opt && (
                                                    <div className="flex justify-center mt-2">
                                                        <CheckCircle size={16} className="text-[var(--color-f1-red)]" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit / Status Area */}
            <div className="pt-6 pb-4">
                {submitted ? (
                    <div className="glass-card p-6 text-center glow-green">
                        <CheckCircle size={32} className="text-[var(--color-success)] mx-auto mb-3" />
                        <h3 className="font-bold text-lg mb-1">Bets Locked In!</h3>
                        <p className="text-sm text-[var(--color-carbon-300)] mb-4">
                            Your race predictions for {race.gp} are stored.
                        </p>
                        {!isRaceLocked && (
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    // Optional: automatically switch to podium if extras were open
                                    setActiveSection('podium');
                                }}
                                className="btn-secondary w-full py-2 text-xs font-bold mt-2"
                            >
                                RE-UNLOCK BETS FOR EDITING
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            onClick={handleSubmit}
                            disabled={!allBetsFilled || isRaceLocked}
                            className={`btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 ${isRaceLocked ? 'opacity-50 grayscale' : ''}`}
                        >
                            {isRaceLocked ? <Lock size={14} /> : <Zap size={14} />}
                            {isRaceLocked ? 'BETS LOCKED' : 'LOCK IN RACE BETS'}
                        </button>
                        {!allBetsFilled && (
                            <p className="text-center text-[10px] text-[var(--color-carbon-400)] mt-2 font-mono">
                                FILL ALL CATEGORIES TO SUBMIT
                            </p>
                        )}
                    </>
                )}
            </div>

            <BottomNav />
        </main >
    );
}
