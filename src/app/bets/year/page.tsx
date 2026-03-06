'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Crown,
    UserX,
    Medal,
    AlertTriangle,
    Construction,
    Skull,
    Crosshair,
    Award,
    CheckCircle,
    Lock,
    ChevronDown,
    Search,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { ALL_DRIVERS, TEAMS, CALENDAR } from '@/lib/f1-data';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

interface BetCategory {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    type: 'driver' | 'constructor' | 'race';
    points: number;
}

const YEAR_BET_CATEGORIES: BetCategory[] = [
    { id: 'driver_champion', label: 'Driver Champion', description: 'Who will win the WDC?', icon: <Crown size={18} />, type: 'driver', points: 250 },
    { id: 'driver_p2', label: 'Driver Runner-up', description: 'Who finishes P2 in WDC?', icon: <Medal size={18} />, type: 'driver', points: 150 },
    { id: 'driver_p3', label: 'Driver P3', description: 'Who finishes P3 in WDC?', icon: <Medal size={18} />, type: 'driver', points: 100 },
    { id: 'constructor_champion', label: 'Constructors Champion', description: 'Which team wins the WCC?', icon: <Trophy size={18} />, type: 'constructor', points: 200 },
    { id: 'last_constructor', label: 'Last Place Constructor', description: 'Which team finishes last?', icon: <AlertTriangle size={18} />, type: 'constructor', points: 100 },
    { id: 'fewest_finishers', label: 'Race with Fewest Finishers', description: 'Which race sees the most retirements?', icon: <Skull size={18} />, type: 'race', points: 100 },
    { id: 'most_dnfs', label: 'Most DNFs Driver', description: 'Which driver retires the most?', icon: <AlertTriangle size={18} />, type: 'driver', points: 100 },
    { id: 'first_replaced', label: 'First Driver Replaced', description: 'Which driver loses their seat first?', icon: <UserX size={18} />, type: 'driver', points: 150 },
    { id: 'most_poles', label: 'Most Pole Positions', description: 'Who takes the most poles?', icon: <Crosshair size={18} />, type: 'driver', points: 100 },
    { id: 'most_podiums_no_win', label: 'Most Podiums Without Win', description: 'Most podiums but no race victory?', icon: <Award size={18} />, type: 'driver', points: 125 },
];

function DriverSelector({
    selected,
    onSelect,
    exclude,
}: {
    selected: string | null;
    onSelect: (name: string) => void;
    exclude?: string[];
}) {
    const [search, setSearch] = useState('');
    const filtered = ALL_DRIVERS.filter(
        d =>
            d.name.toLowerCase().includes(search.toLowerCase()) &&
            !(exclude || []).includes(d.name)
    );

    return (
        <div className="mt-3">
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
            <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {filtered.map((driver) => (
                    <motion.button
                        key={driver.name}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSelect(driver.name)}
                        className={`
              flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left text-sm
              ${selected === driver.name
                                ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10'
                                : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 hover:border-[var(--color-carbon-500)]'
                            }
            `}
                    >
                        <div
                            className="w-2 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: driver.teamColor }}
                        />
                        <div className="min-w-0">
                            <div className="font-medium text-xs truncate">{driver.name}</div>
                            <div className="data-readout text-[9px]">{driver.team}</div>
                        </div>
                        {selected === driver.name && (
                            <CheckCircle size={14} className="text-[var(--color-f1-red)] ml-auto flex-shrink-0" />
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function ConstructorSelector({
    selected,
    onSelect,
}: {
    selected: string | null;
    onSelect: (name: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-2 mt-3 max-h-[320px] overflow-y-auto pr-1">
            {TEAMS.map((team) => (
                <motion.button
                    key={team.name}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(team.shortName)}
                    className={`
            flex items-center gap-3 p-3 rounded-lg border transition-all text-left
            ${selected === team.shortName
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
                        <div className="font-semibold text-sm truncate">{team.shortName}</div>
                        <div className="data-readout text-[9px]">{team.drivers.join(' · ')}</div>
                    </div>
                    {selected === team.shortName && (
                        <CheckCircle size={16} className="text-[var(--color-f1-red)] flex-shrink-0" />
                    )}
                </motion.button>
            ))}
        </div>
    );
}

function RaceSelector({
    selected,
    onSelect,
}: {
    selected: string | null;
    onSelect: (gp: string) => void;
}) {
    return (
        <div className="grid grid-cols-2 gap-2 mt-3 max-h-[320px] overflow-y-auto pr-1">
            {CALENDAR.map((race) => (
                <motion.button
                    key={race.round}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onSelect(race.gp)}
                    className={`
            p-2.5 rounded-lg border transition-all text-left text-sm
            ${selected === race.gp
                            ? 'border-[var(--color-f1-red)]/60 bg-[var(--color-f1-red)]/10'
                            : 'border-[var(--color-carbon-700)] bg-[var(--color-carbon-800)]/40 hover:border-[var(--color-carbon-500)]'
                        }
          `}
                >
                    <div className="data-readout text-[9px] mb-1">R{String(race.round).padStart(2, '0')}</div>
                    <div className="font-medium text-xs truncate">{race.gp.replace(' GP', '')}</div>
                    <div className="data-readout text-[9px] mt-0.5">
                        {new Date(race.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    {selected === race.gp && (
                        <CheckCircle size={12} className="text-[var(--color-f1-red)] mt-1" />
                    )}
                </motion.button>
            ))}
        </div>
    );
}

export default function YearBetsPage() {
    const [bets, setBets] = useState<Record<string, string>>({});
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkLock = async () => {
            const { data, error } = await supabase
                .from('year_results')
                .select('is_bets_locked')
                .eq('season', 2026)
                .single();

            if (!error && data) {
                setIsLocked(data.is_bets_locked);
            }
            setLoading(false);
        };
        checkLock();
    }, [supabase]);

    const totalCategories = YEAR_BET_CATEGORIES.length;
    const filledCategories = Object.keys(bets).length;
    const allFilled = filledCategories === totalCategories;

    const handleSubmit = async () => {
        if (!allFilled || isLocked) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('bets_year')
            .upsert({
                user_id: user.id,
                driver_champion: bets['driver_champion'],
                driver_p2: bets['driver_p2'],
                driver_p3: bets['driver_p3'],
                constructor_champion: bets['constructor_champion'],
                last_constructor: bets['last_constructor'],
                fewest_finishers_race: bets['fewest_finishers'],
                most_dnfs_driver: bets['most_dnfs'],
                first_driver_replaced: bets['first_replaced'],
                most_poles: bets['most_poles'],
                most_podiums_no_win: bets['most_podiums_no_win'],
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error(error);
            alert("Failed to save year bets. Please try again.");
        } else {
            setSubmitted(true);
        }
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
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                Year Bets
                            </h1>
                            <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                                {isLocked ? 'SEASON PREDICTIONS LOCKED' : '2026 SEASON PREDICTIONS · LOCK BEFORE R1'}
                            </span>
                        </div>
                        <div className="telemetry-border px-3 py-1.5">
                            <span className="data-readout text-[10px] text-[var(--color-success)]">
                                {filledCategories}/{totalCategories}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress bar */}
            <div className="px-5 pt-4">
                <div className="h-1 bg-[var(--color-carbon-700)] rounded-full overflow-hidden mb-5">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: allFilled
                                ? 'linear-gradient(90deg, var(--color-success), #4caf50)'
                                : 'linear-gradient(90deg, var(--color-f1-red), var(--color-f1-red-glow))',
                        }}
                        animate={{ width: `${(filledCategories / totalCategories) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Bet Categories */}
            <div className="px-5 space-y-3">
                <AnimatePresence>
                    {YEAR_BET_CATEGORIES.map((cat, idx) => {
                        const isOpen = openCategory === cat.id;
                        const selection = bets[cat.id];

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="glass-card overflow-hidden"
                            >
                                {/* Category Header */}
                                <button
                                    onClick={() => {
                                        if (isLocked) return;
                                        setOpenCategory(isOpen ? null : cat.id);
                                    }}
                                    className={`w-full flex items-center gap-3 p-4 text-left ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: selection
                                                ? 'rgba(0, 230, 118, 0.15)'
                                                : 'rgba(225, 6, 0, 0.1)',
                                            color: selection
                                                ? 'var(--color-success)'
                                                : 'var(--color-f1-red)',
                                        }}
                                    >
                                        {selection ? <CheckCircle size={18} /> : cat.icon}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm">{cat.label}</div>
                                        <div className="text-xs text-[var(--color-carbon-400)] truncate">
                                            {selection || cat.description}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="score-pill text-[10px]">{cat.points}pts</span>
                                        <ChevronDown
                                            size={16}
                                            className={`text-[var(--color-carbon-400)] transition-transform ${isOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </div>
                                </button>

                                {/* Expanded Selector */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 border-t border-[var(--color-carbon-700)]">
                                                {cat.type === 'driver' && (
                                                    <DriverSelector
                                                        selected={selection || null}
                                                        onSelect={(name) => {
                                                            setBets({ ...bets, [cat.id]: name });
                                                            setOpenCategory(null);
                                                        }}
                                                    />
                                                )}
                                                {cat.type === 'constructor' && (
                                                    <ConstructorSelector
                                                        selected={selection || null}
                                                        onSelect={(name) => {
                                                            setBets({ ...bets, [cat.id]: name });
                                                            setOpenCategory(null);
                                                        }}
                                                    />
                                                )}
                                                {cat.type === 'race' && (
                                                    <RaceSelector
                                                        selected={selection || null}
                                                        onSelect={(gp) => {
                                                            setBets({ ...bets, [cat.id]: gp });
                                                            setOpenCategory(null);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4 pb-6"
                >
                    {submitted ? (
                        <div className="glass-card p-6 text-center glow-green">
                            <CheckCircle size={32} className="text-[var(--color-success)] mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-1">Bets Locked In!</h3>
                            <p className="text-sm text-[var(--color-carbon-300)]">
                                Your year predictions have been submitted. Good luck!
                            </p>
                        </div>
                    ) : isLocked ? (
                        <div className="glass-card p-6 text-center border-[var(--color-danger)]/30">
                            <Lock size={32} className="text-[var(--color-danger)] mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-1">Submissions Closed</h3>
                            <p className="text-sm text-[var(--color-carbon-400)]">
                                The season has started and year bets are now locked.
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!allFilled}
                            className={`btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 ${!allFilled ? 'opacity-50 grayscale' : ''}`}
                        >
                            <Lock size={14} />
                            SUBMIT YEAR BETS ({filledCategories}/{totalCategories})
                        </button>
                    )}
                </motion.div>
            </div>

            <BottomNav />
        </main>
    );
}
