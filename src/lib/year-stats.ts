// ═══════════════════════════════════════════════════════════
// Year Stats Aggregation — Derived from OpenF1 Season Data
// ═══════════════════════════════════════════════════════════

import { ALL_DRIVERS } from './f1-data';

export interface ComputedYearStats {
    // Driver standings (from championship_drivers beta endpoint)
    driverChampion: string | null;
    driverP2: string | null;
    driverP3: string | null;

    // Constructor standings (from championship_teams beta endpoint)
    constructorChampion: string | null;
    lastConstructor: string | null;

    // Aggregated stats
    mostDnfsDriver: string | null;         // Comma-separated if tied
    mostDnfsTied: string[];               // All tied drivers in full
    mostDnfsCount: number;

    mostPoles: string | null;             // Comma-separated if tied
    mostPolesTied: string[];
    mostPolesCount: number;

    mostPodiumsNoWin: string | null;      // Comma-separated if tied
    mostPodiumsNoWinTied: string[];
    mostPodiumsNoWinCount: number;

    // Fields NOT computable from API
    fewestFinishersRace: null;            // Always null — manual only
    firstDriverReplaced: null;            // Always null — manual only

    // Metadata
    computedAt: string;                   // ISO timestamp
    racesAggregated: number;
    qualifyingAggregated: number;
}

/**
 * Map an OpenF1 driver_number to our canonical driver name string.
 * Uses the provided driverInfo array (from /drivers endpoint) to find the name.
 */
export function mapDriverNumber(
    driverNum: number,
    driverInfo: any[]
): string | undefined {
    const dInfo = driverInfo.find((d: any) => d.driver_number === driverNum);
    if (!dInfo) return undefined;

    const lastName = (dInfo.name_acronym || '').toLowerCase();
    const fallbackLastName = dInfo.full_name?.split(' ').pop()?.toLowerCase() || '';

    const match = ALL_DRIVERS.find((d) => {
        const normalized = d.name.toLowerCase();
        return (
            (lastName && normalized.includes(lastName)) ||
            (fallbackLastName && normalized.includes(fallbackLastName))
        );
    });
    return match?.name;
}

/**
 * Given flat arrays of all race and qualifying session_results for the year,
 * compute season-long stats needed for year bet scoring.
 *
 * @param raceResults  - Array from fetchAllSeasonResults(year, 'Race')
 * @param qualResults  - Array from fetchAllSeasonResults(year, 'Qualifying')
 * @param driverInfo   - Array from fetchDrivers (any recent session to get current driver list)
 * @param champDrivers - Array from fetchChampionshipDrivers(year)
 * @param champTeams   - Array from fetchChampionshipTeams(year)
 */
export function computeYearStats(
    raceResults: any[],
    qualResults: any[],
    driverInfo: any[],
    champDrivers: any[],
    champTeams: any[]
): ComputedYearStats {

    // ── Helper: build a sorted map of driver_number → canonical name ──
    const resolve = (num: number) => mapDriverNumber(num, driverInfo);

    // ── 1. DNF counts per driver ──
    const dnfCounts: Record<string, number> = {};
    raceResults.forEach((r: any) => {
        if (r.dnf === true) {
            const name = resolve(r.driver_number);
            if (name) dnfCounts[name] = (dnfCounts[name] || 0) + 1;
        }
    });
    const maxDnfs = Math.max(0, ...Object.values(dnfCounts));
    const dnfTied = Object.entries(dnfCounts)
        .filter(([, v]) => v === maxDnfs && maxDnfs > 0)
        .map(([k]) => k)
        .sort();
    const mostDnfsDriver = dnfTied.length > 0 ? dnfTied.join(',') : null;

    // ── 2. Pole counts per driver ──
    // In qualifying, position 1 = pole position
    const poleCounts: Record<string, number> = {};
    qualResults.forEach((r: any) => {
        if (r.position === 1) {
            const name = resolve(r.driver_number);
            if (name) poleCounts[name] = (poleCounts[name] || 0) + 1;
        }
    });
    const maxPoles = Math.max(0, ...Object.values(poleCounts));
    const polesTied = Object.entries(poleCounts)
        .filter(([, v]) => v === maxPoles && maxPoles > 0)
        .map(([k]) => k)
        .sort();
    const mostPoles = polesTied.length > 0 ? polesTied.join(',') : null;

    // ── 3. Podiums-no-win per driver ──
    // A driver qualifies only if they have zero race wins all season.
    const winsByDriver: Record<string, number> = {};
    const podiumsByDriver: Record<string, number> = {}; // pos 1, 2, 3

    raceResults.forEach((r: any) => {
        const name = resolve(r.driver_number);
        if (!name) return;
        if (r.position === 1) {
            winsByDriver[name] = (winsByDriver[name] || 0) + 1;
        }
        if (r.position >= 1 && r.position <= 3 && !r.dnf) {
            podiumsByDriver[name] = (podiumsByDriver[name] || 0) + 1;
        }
    });

    // Only consider drivers with zero wins AND at least one podium
    const noWinPodiums = Object.entries(podiumsByDriver)
        .filter(([name, count]) => !winsByDriver[name] && count > 0)
        .reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {});

    const maxNoWinPodiums = Math.max(0, ...Object.values(noWinPodiums));
    const noWinTied = Object.entries(noWinPodiums)
        .filter(([, v]) => v === maxNoWinPodiums && maxNoWinPodiums > 0)
        .map(([k]) => k)
        .sort();
    const mostPodiumsNoWin = noWinTied.length > 0 ? noWinTied.join(',') : null;

    // ── 4. Championship standings (beta) ──
    // Sort by position_current ascending
    const sortedDriverChamp = [...(champDrivers || [])].sort(
        (a: any, b: any) => (a.position_current ?? 999) - (b.position_current ?? 999)
    );

    const champDriverNames = sortedDriverChamp
        .slice(0, 3)
        .map((d: any) => resolve(d.driver_number))
        .filter(Boolean) as string[];

    const driverChampion = champDriverNames[0] ?? null;
    const driverP2 = champDriverNames[1] ?? null;
    const driverP3 = champDriverNames[2] ?? null;

    // Sort teams by position_current ascending
    const sortedTeamChamp = [...(champTeams || [])].sort(
        (a: any, b: any) => (a.position_current ?? 999) - (b.position_current ?? 999)
    );

    // Map OpenF1 team name → our shortName
    const resolveTeam = (openf1Name: string): string | null => {
        if (!openf1Name) return null;
        const lower = openf1Name.toLowerCase();
        const { TEAMS } = require('./f1-data');
        const team = (TEAMS as any[]).find(
            (t: any) =>
                t.name.toLowerCase().includes(lower) ||
                lower.includes(t.shortName.toLowerCase())
        );
        return team?.shortName ?? openf1Name;
    };

    const constructorChampion = sortedTeamChamp[0]?.team_name
        ? resolveTeam(sortedTeamChamp[0].team_name)
        : null;
    const lastConstructor = sortedTeamChamp[sortedTeamChamp.length - 1]?.team_name
        ? resolveTeam(sortedTeamChamp[sortedTeamChamp.length - 1].team_name)
        : null;

    // ── Count unique sessions (rough approximation of races aggregated) ──
    const uniqueRaceSessions = new Set(raceResults.map((r: any) => r.session_key)).size;
    const uniqueQualSessions = new Set(qualResults.map((r: any) => r.session_key)).size;

    return {
        driverChampion,
        driverP2,
        driverP3,
        constructorChampion,
        lastConstructor,
        mostDnfsDriver,
        mostDnfsTied: dnfTied,
        mostDnfsCount: maxDnfs,
        mostPoles,
        mostPolesTied: polesTied,
        mostPolesCount: maxPoles,
        mostPodiumsNoWin,
        mostPodiumsNoWinTied: noWinTied,
        mostPodiumsNoWinCount: maxNoWinPodiums,
        fewestFinishersRace: null,
        firstDriverReplaced: null,
        computedAt: new Date().toISOString(),
        racesAggregated: uniqueRaceSessions,
        qualifyingAggregated: uniqueQualSessions,
    };
}
