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

export async function fetchRaceSession(year: number, countryName: string): Promise<SessionInfo | null> {
    try {
        const res = await fetch(
            `${OPENF1_BASE}/sessions?year=${year}&country_name=${encodeURIComponent(countryName)}&session_type=Race`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const data: SessionInfo[] = await res.json();
        return data.find((s: SessionInfo) => s.session_name === 'Race') || data[0] || null;
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
        const sessionsRes = await fetch(`${OPENF1_BASE}/sessions?year=${year}&session_type=${sessionType}`);
        if (!sessionsRes.ok) return [];
        const sessions: SessionInfo[] = await sessionsRes.json();
        
        if (!sessions || sessions.length === 0) return [];
        
        // Batch requests into small chunks (e.g. 3 at a time) to avoid 429
        const CHUNK_SIZE = 3;
        const BATCH_DELAY_MS = 300;
        const allResults: any[] = [];

        for (let i = 0; i < sessions.length; i += CHUNK_SIZE) {
            const chunk = sessions.slice(i, i + CHUNK_SIZE);
            const chunkPromises = chunk.map(async (sess) => {
                try {
                    const res = await fetch(`${OPENF1_BASE}/session_result?session_key=${sess.session_key}`);
                    if (!res.ok) return [];
                    const data = await res.json();
                    
                    if (Array.isArray(data)) {
                        return data.map((d: any) => ({ ...d, session_key: sess.session_key }));
                    } else if (data && data.error) {
                         return [];
                    }
                    return [];
                } catch {
                    return [];
                }
            });

            const resolvedChunk = await Promise.all(chunkPromises);
            allResults.push(...resolvedChunk.flat());

            if (i + CHUNK_SIZE < sessions.length) {
                await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
            }
        }

        return allResults;
    } catch {
        return [];
    }
}
