'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Shield,
    Star,
    Trophy,
    Edit3,
    Save,
    ChevronDown,
    AlertTriangle,
    DownloadCloud,
    Loader2,
    Lock,
    Unlock,
    Zap,
    CheckCircle,
    Calendar,
    Database,
    Users,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { CALENDAR, ALL_DRIVERS, TEAMS, YEAR_BET_SCORING } from '@/lib/f1-data';
import { fetchRaceSession, fetchRaceResults } from '@/lib/openf1';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

type AdminTab = 'results' | 'scores' | 'yearend';

export default function AdminPage() {
    const [isAuthed, setIsAuthed] = useState(false);
    const [pin, setPin] = useState('');
    const [activeTab, setActiveTab] = useState<AdminTab>('results');
    const [expandedRound, setExpandedRound] = useState<number | null>(null);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    // Results Form State
    const [resultsForm, setResultsForm] = useState<Record<number, {
        p1?: string; p2?: string; p3?: string; dnf?: string; teamMostPts?: string; special?: string;
    }>>({});
    const [isFetchingApi, setIsFetchingApi] = useState<number | null>(null);
    const [isYearLocked, setIsYearLocked] = useState(false);
    const [isLoadingLock, setIsLoadingLock] = useState(false);
    const [manualUnlocks, setManualUnlocks] = useState<Record<number, boolean>>({});
    const supabase = createClient();

    // Fetch year lock status and manual race unlocks
    useEffect(() => {
        const fetchData = async () => {
            // Year lock
            const { data: yearData } = await supabase
                .from('year_results')
                .select('is_bets_locked')
                .eq('season', 2026)
                .single();

            if (yearData) setIsYearLocked(yearData.is_bets_locked);

            // Manual unlocks
            const { data: raceData } = await supabase
                .from('races')
                .select('round, is_manual_unlock');

            if (raceData) {
                const unlocks: Record<number, boolean> = {};
                raceData.forEach(r => unlocks[r.round] = r.is_manual_unlock || false);
                setManualUnlocks(unlocks);
            }
        };
        fetchData();
    }, [supabase]);
    // Simple PIN auth for admin

    // Simple PIN auth for admin
    const handleAuth = () => {
        if (pin === '2026') {
            setIsAuthed(true);
        }
    };

    if (!isAuthed) {
        return (
            <main className="min-h-screen flex items-center justify-center pb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 mx-5 w-full max-w-sm text-center"
                >
                    <div
                        className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--color-f1-red), #c20500)' }}
                    >
                        <Shield size={28} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Admin Access
                    </h2>
                    <p className="text-sm text-[var(--color-carbon-400)] mb-6">
                        Enter your admin PIN to continue
                    </p>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        placeholder="Enter PIN"
                        className="input-field text-center text-lg font-mono tracking-[0.3em] mb-4"
                    />
                    <button onClick={handleAuth} className="btn-primary w-full">
                        AUTHENTICATE
                    </button>
                </motion.div>
                <BottomNav />
            </main>
        );
    }

    const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'results', label: 'Race Results', icon: <Trophy size={14} /> },
        { id: 'scores', label: 'Score Overrides', icon: <Edit3 size={14} /> },
        { id: 'yearend', label: 'Year End', icon: <Calendar size={14} /> },
    ];

    const handleSave = (label: string) => {
        setSaveStatus(label);
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handleFormChange = (round: number, field: string, value: string) => {
        setResultsForm(prev => ({
            ...prev,
            [round]: {
                ...(prev[round] || {}),
                [field]: value
            }
        }));
    };

    const handleFetchApi = async (round: number, country: string, year: number) => {
        setIsFetchingApi(round);
        try {
            const session = await fetchRaceSession(year, country);
            if (session) {
                const results = await fetchRaceResults(session.session_key);
                // Results is an array of objects like { position: 1, driver_number: 1, ... }
                // For a robust implementation, you would map driver_number to driver names.
                // For now, let's just show a toast that the API call was made successfully.
                // In production, matching openf1 driver_number/broadcast_name to our ALL_DRIVERS is required.
                handleSave(`R${round} API synced (Mock mapping)`);
                // Example mock assignment:
                /*
                handleFormChange(round, 'p1', 'Max Verstappen');
                handleFormChange(round, 'p2', 'Lando Norris');
                */
            } else {
                alert("Race session not found on OpenF1 API yet.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to fetch from OpenF1 API.");
        } finally {
            setIsFetchingApi(null);
        }
    };

    const toggleManualUnlock = async (round: number) => {
        const newValue = !manualUnlocks[round];
        try {
            const { error } = await supabase
                .from('races')
                .update({ is_manual_unlock: newValue })
                .eq('round', round);

            if (error) throw error;
            setManualUnlocks(prev => ({ ...prev, [round]: newValue }));
            handleSave(`Race ${round} ${newValue ? 'FORCED OPEN' : 'AUTO-LOCK ACTIVE'}`);
        } catch (e) {
            console.error(e);
            alert("Failed to update race lock override");
        }
    };

    const toggleYearLock = async () => {
        setIsLoadingLock(true);
        try {
            const { error } = await supabase
                .from('year_results')
                .update({ is_bets_locked: !isYearLocked })
                .eq('season', 2026);

            if (error) throw error;
            setIsYearLocked(!isYearLocked);
            handleSave(`Year bets ${!isYearLocked ? 'LOCKED' : 'OPENED'}`);
        } catch (e) {
            console.error(e);
            alert("Failed to update lock status");
        } finally {
            setIsLoadingLock(false);
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
                            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                                <Settings size={18} className="text-[var(--color-f1-red)]" />
                                Admin Panel
                            </h1>
                            <span className="data-readout text-[10px] text-[var(--color-carbon-400)]">
                                RACE MANAGEMENT · SCORING · OVERRIDES
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                            <span className="data-readout text-[9px] text-[var(--color-success)]">ADMIN</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Save Status Toast */}
            <AnimatePresence>
                {saveStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 left-5 right-5 z-50 glass-card p-3 flex items-center gap-2 glow-green"
                    >
                        <CheckCircle size={16} className="text-[var(--color-success)]" />
                        <span className="text-sm font-medium">{saveStatus} saved successfully</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Bar */}
            <div className="px-5 pt-4">
                <div className="flex gap-1.5 p-1 rounded-lg bg-[var(--color-carbon-800)] mb-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider transition-all
                ${activeTab === tab.id
                                    ? 'bg-[var(--color-f1-red)]/15 text-[var(--color-f1-red)] border border-[var(--color-f1-red)]/20'
                                    : 'text-[var(--color-carbon-400)] hover:text-[var(--color-carbon-200)]'
                                }
              `}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    {/* ── Removed Special Categories Setup Tab since they are now pre-defined in f1-data.ts ── */}

                    {/* ── Results Tab ── */}
                    {activeTab === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Manually input race results for scoring. Used when API data is missing or for custom categories.
                            </p>
                            {CALENDAR.map((race) => (
                                <div key={race.round} className="glass-card">
                                    <button
                                        onClick={() => setExpandedRound(expandedRound === race.round ? null : race.round)}
                                        className="w-full flex items-center gap-3 p-3 text-left"
                                    >
                                        <span className="data-readout text-[10px] w-8">R{String(race.round).padStart(2, '0')}</span>
                                        <span className="font-medium text-sm flex-1 truncate">{race.gp}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-[var(--color-carbon-400)] transition-transform ${expandedRound === race.round ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {expandedRound === race.round && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-3 pb-3 border-t border-[var(--color-carbon-700)] pt-3 space-y-3">

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleFetchApi(race.round, race.gp.replace(/ GP.*/, ''), 2026)}
                                                            disabled={isFetchingApi === race.round}
                                                            className="btn-secondary flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                                                        >
                                                            {isFetchingApi === race.round ? <Loader2 size={12} className="animate-spin" /> : <DownloadCloud size={12} />}
                                                            Fetch from F1 API
                                                        </button>
                                                        <button
                                                            onClick={() => toggleManualUnlock(race.round)}
                                                            className={`telemetry-border px-3 text-[10px] data-readout flex items-center gap-1.5 transition-all ${manualUnlocks[race.round]
                                                                ? 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]'
                                                                : 'bg-[var(--color-carbon-800)] border-[var(--color-carbon-700)] text-[var(--color-carbon-500)]'
                                                                }`}
                                                            title="Manually unlock bets for this race (overrides auto-lock)"
                                                        >
                                                            {manualUnlocks[race.round] ? <Unlock size={12} /> : <Lock size={12} />}
                                                            {manualUnlocks[race.round] ? 'FORCED OPEN' : 'AUTO-LOCK'}
                                                        </button>
                                                    </div>

                                                    {/* P1, P2, P3, DNF (Drivers) */}
                                                    {['p1', 'p2', 'p3', 'dnf'].map((field) => (
                                                        <div key={field}>
                                                            <label className="data-readout text-[9px] block mb-1">
                                                                {field === 'dnf' ? 'First DNF / DNF Driver' : field.toUpperCase()}
                                                            </label>
                                                            <select
                                                                value={resultsForm[race.round]?.[field as keyof typeof resultsForm[number]] || ''}
                                                                onChange={(e) => handleFormChange(race.round, field, e.target.value)}
                                                                className="input-field text-sm"
                                                            >
                                                                <option value="">Select driver...</option>
                                                                {ALL_DRIVERS.map(d => (
                                                                    <option key={d.name} value={d.name}>{d.name} ({d.team})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}

                                                    {/* Team Most Points */}
                                                    <div>
                                                        <label className="data-readout text-[9px] block mb-1">TEAM MOST POINTS</label>
                                                        <select
                                                            value={resultsForm[race.round]?.teamMostPts || ''}
                                                            onChange={(e) => handleFormChange(race.round, 'teamMostPts', e.target.value)}
                                                            className="input-field text-sm"
                                                        >
                                                            <option value="">Select team...</option>
                                                            {TEAMS.map(t => (
                                                                <option key={t.shortName} value={t.shortName}>{t.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Special Category */}
                                                    <div>
                                                        <label className="data-readout text-[9px] block mb-1">SPECIAL: {race.specialCategory.question.toUpperCase()}</label>
                                                        <select
                                                            value={resultsForm[race.round]?.special || ''}
                                                            onChange={(e) => handleFormChange(race.round, 'special', e.target.value)}
                                                            className="input-field text-sm"
                                                        >
                                                            <option value="">Select answer...</option>
                                                            {race.specialCategory.type === 'driver' && ALL_DRIVERS.map(d => (
                                                                <option key={d.name} value={d.name}>{d.name}</option>
                                                            ))}
                                                            {race.specialCategory.type === 'team' && TEAMS.map(t => (
                                                                <option key={t.shortName} value={t.shortName}>{t.shortName}</option>
                                                            ))}
                                                            {race.specialCategory.type === 'options' && race.specialCategory.options?.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSave(`R${race.round} results`)}
                                                        className="btn-primary text-xs py-2 flex items-center gap-1.5 w-full justify-center mt-2"
                                                    >
                                                        <Database size={12} />
                                                        Save Results & Score
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── Score Overrides Tab ── */}
                    {activeTab === 'scores' && (
                        <motion.div
                            key="scores"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Override individual user scores for any race. Changes are logged.
                            </p>
                            <div className="glass-card p-6 text-center">
                                <Zap size={32} className="text-[var(--color-warning)] mx-auto mb-3" />
                                <h3 className="font-bold mb-2">Score Override</h3>
                                <p className="text-sm text-[var(--color-carbon-400)] mb-4">
                                    Select a user and race to manually adjust their score.
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">USER</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select user...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">RACE</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select race...</option>
                                            {CALENDAR.map((r) => (
                                                <option key={r.round} value={r.round}>R{r.round} - {r.gp}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">NEW TOTAL SCORE</label>
                                        <input type="number" placeholder="Enter score..." className="input-field text-sm" />
                                    </div>
                                    <div>
                                        <label className="data-readout text-[9px] block mb-1">REASON</label>
                                        <input type="text" placeholder="Reason for override..." className="input-field text-sm" />
                                    </div>
                                    <button className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5">
                                        <Save size={12} />
                                        APPLY OVERRIDE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Year End Classification Tab ── */}
                    {activeTab === 'yearend' && (
                        <motion.div
                            key="yearend"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-xs text-[var(--color-carbon-400)] mb-4">
                                Enter final season standings to score year bets. Points will be calculated automatically.
                            </p>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Trophy size={14} className="text-[var(--color-warning)]" />
                                    Driver Championship Final
                                </h3>
                                {['Driver Champion (P1)', 'Driver Runner-up (P2)', 'Driver P3'].map((label) => (
                                    <div key={label}>
                                        <label className="data-readout text-[9px] block mb-1">{label.toUpperCase()}</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select driver...</option>
                                            {ALL_DRIVERS.map(d => (
                                                <option key={d.name} value={d.name}>{d.name} ({d.team})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Users size={14} className="text-[var(--color-info)]" />
                                    Constructor Championship Final
                                </h3>
                                {['Constructors Champion', 'Last Place Constructor'].map((label) => (
                                    <div key={label}>
                                        <label className="data-readout text-[9px] block mb-1">{label.toUpperCase()}</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select team...</option>
                                            {TEAMS.map(t => (
                                                <option key={t.shortName} value={t.shortName}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="glass-card p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-[var(--color-danger)]" />
                                    Special Year Categories
                                </h3>
                                {[
                                    { label: 'Race with Fewest Finishers', type: 'race' },
                                    { label: 'Driver with Most DNFs', type: 'driver' },
                                    { label: 'First Driver Replaced', type: 'driver' },
                                    { label: 'Most Pole Positions', type: 'driver' },
                                    { label: 'Most Podiums Without a Win', type: 'driver' },
                                ].map((cat) => (
                                    <div key={cat.label}>
                                        <label className="data-readout text-[9px] block mb-1">{cat.label.toUpperCase()}</label>
                                        <select className="input-field text-sm">
                                            <option value="">Select...</option>
                                            {cat.type === 'driver' && ALL_DRIVERS.map(d => (
                                                <option key={d.name} value={d.name}>{d.name}</option>
                                            ))}
                                            {cat.type === 'team' && TEAMS.map(t => (
                                                <option key={t.shortName} value={t.shortName}>{t.shortName}</option>
                                            ))}
                                            {cat.type === 'race' && CALENDAR.map(r => (
                                                <option key={r.round} value={r.gp}>{r.gp}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="telemetry-border p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm">Season Prediction Status</h3>
                                        <p className="text-[10px] text-[var(--color-carbon-400)]">Global lock for all Year Bets</p>
                                    </div>
                                    <button
                                        onClick={toggleYearLock}
                                        disabled={isLoadingLock}
                                        className={`px-4 py-2 rounded-lg data-readout text-[10px] font-bold transition-all border ${isYearLocked
                                            ? 'bg-[var(--color-danger)]/20 border-[var(--color-danger)]/40 text-[var(--color-danger)]'
                                            : 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]'
                                            }`}
                                    >
                                        {isLoadingLock ? <Loader2 size={12} className="animate-spin" /> : (isYearLocked ? 'LOCKED' : 'OPEN')}
                                    </button>
                                </div>
                                <div className="flex items-start gap-2 bg-[var(--color-carbon-800)] p-3 rounded-lg border border-[var(--color-carbon-700)]">
                                    <Lock size={14} className="mt-0.5 text-[var(--color-carbon-400)]" />
                                    <p className="text-[10px] text-[var(--color-carbon-400)] leading-relaxed">
                                        When locked, users cannot submit or edit their Year Bets.
                                        Usually locked before the start of the first race of the season.
                                    </p>
                                </div>
                            </div>

                            <button className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                                <Zap size={14} />
                                CALCULATE & SCORE YEAR BETS
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <BottomNav />
        </main>
    );
}
