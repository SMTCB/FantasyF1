// ═══════════════════════════════════════════════════════════
// OpenF1 API Client — Race Session Data & Locking Logic
// ═══════════════════════════════════════════════════════════

const OPENF1_BASE = 'https://api.openf1.org/v1';

export interface SessionInfo {
    session_key: number;
    session_name: string;
    session_type: string;
    date_start: string;
    date_end: string;
    gmt_offset: string;
    circuit_short_name: string;
    country_name: string;
    year: number;
}

/**
 * Fetch the Race session for a given meeting (round).
 */
export async function fetchRaceSession(year: number, countryName: string): Promise<SessionInfo | null> {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/sessions?year=${year}&country_name=${encodeURIComponent(countryName)}&session_type=Race`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const data: SessionInfo[] = await res.json();
        return data[0] || null;
    } catch {
        return null;
    }
}

/**
 * Fetch the Qualifying session for a given meeting (round).
 */
export async function fetchQualifyingSession(year: number, countryName: string): Promise<SessionInfo | null> {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/sessions?year=${year}&country_name=${encodeURIComponent(countryName)}&session_type=Qualifying`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const data: SessionInfo[] = await res.json();
        return data[0] || null;
    } catch {
        return null;
    }
}

/**
 * Check if bets are locked for a given session.
 * Bets lock 5 minutes before `date_start` of the Race session.
 */
export function isBetLocked(sessionStart: string): boolean {
    const lockTime = new Date(sessionStart);
    lockTime.setMinutes(lockTime.getMinutes() - 5);
    return new Date() >= lockTime;
}

/**
 * Get the lock time (5 min before session start)
 */
export function getLockTime(sessionStart: string): Date {
    const lockTime = new Date(sessionStart);
    lockTime.setMinutes(lockTime.getMinutes() - 5);
    return lockTime;
}

/**
 * Fetch race results (positions) for a given session
 */
export async function fetchRaceResults(sessionKey: number) {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/position?session_key=${sessionKey}`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

/**
 * Fetch driver info for a session
 */
export async function fetchDrivers(sessionKey: number) {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/drivers?session_key=${sessionKey}`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}
/**
 * Fetch official session classification (final positions, DNF status, etc.)
 */
export async function fetchSessionResult(sessionKey: number) {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/session_result?session_key=${sessionKey}`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

/**
 * Fetch championship driver standings (Beta endpoint)
 */
export async function fetchChampionshipDrivers(year: number) {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/championship_drivers?year=${year}`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

/**
 * Fetch championship team standings (Beta endpoint)
 */
export async function fetchChampionshipTeams(year: number) {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/championship_teams?year=${year}`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

/**
 * Fetch all session results for every race (or qualifying) session in a year.
 * Returns a flat array of [{ session_key, session_type, results[] }] objects.
 */
export async function fetchAllSeasonResults(year: number, sessionType: 'Race' | 'Qualifying') {
    try {
        // 1. Get all sessions of the requested type for the year
        const sessionsRes = await fetch(
            `${OPENF1_BASE}/sessions?year=${year}&session_type=${sessionType}`,
            { next: { revalidate: 300 } }
        );
        if (!sessionsRes.ok) return [];
        const sessions: SessionInfo[] = await sessionsRes.json();

        if (!sessions || sessions.length === 0) return [];

        // 2. Fetch session_result for each session in parallel
        const allResults = await Promise.all(
            sessions.map(async (sess) => {
                try {
                    const res = await fetch(
                        `${OPENF1_BASE}/session_result?session_key=${sess.session_key}`,
                        { next: { revalidate: 300 } }
                    );
                    if (!res.ok) return [];
                    const data = await res.json();
                    return data as any[];
                } catch {
                    return [];
                }
            })
        );

        // Flatten into a single array, tagging each record with the session_key
        return allResults.flat();
    } catch {
        return [];
    }
}
