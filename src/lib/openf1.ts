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
