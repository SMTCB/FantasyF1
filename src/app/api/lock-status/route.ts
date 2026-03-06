// API route for checking bet lock status
import { NextRequest, NextResponse } from 'next/server';
import { fetchRaceSession, isBetLocked, getLockTime } from '@/lib/openf1';
import { CALENDAR } from '@/lib/f1-data';

// Country name mapping for OpenF1 API
const ROUND_TO_COUNTRY: Record<number, string> = {
    1: 'Australia', 2: 'China', 3: 'Japan', 4: 'Bahrain',
    5: 'Saudi Arabia', 6: 'United States', 7: 'Canada', 8: 'Monaco',
    9: 'Spain', 10: 'Austria', 11: 'Great Britain', 12: 'Belgium',
    13: 'Hungary', 14: 'Netherlands', 15: 'Italy', 16: 'Spain',
    17: 'Azerbaijan', 18: 'Singapore', 19: 'United States', 20: 'Mexico',
    21: 'Brazil', 22: 'United States', 23: 'Qatar', 24: 'United Arab Emirates',
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const round = Number(searchParams.get('round'));

    if (!round || round < 1 || round > 24) {
        return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    const race = CALENDAR.find(r => r.round === round);
    if (!race) {
        return NextResponse.json({ error: 'Race not found' }, { status: 404 });
    }

    const country = ROUND_TO_COUNTRY[round];

    // Try to fetch actual session data from OpenF1
    const session = await fetchRaceSession(2026, country);

    if (session) {
        const locked = isBetLocked(session.date_start);
        const lockTime = getLockTime(session.date_start);

        return NextResponse.json({
            round,
            gp: race.gp,
            locked,
            lockTime: lockTime.toISOString(),
            sessionStart: session.date_start,
            isSaturday: race.isSaturday,
            source: 'openf1',
        });
    }

    // Fallback: use calendar data with estimated race time
    // Sunday races: 14:00 UTC, Saturday races: 18:00 UTC (approximate)
    const raceTime = race.isSaturday ? 'T18:00:00Z' : 'T14:00:00Z';
    const estimatedStart = race.date + raceTime;
    const locked = isBetLocked(estimatedStart);
    const lockTime = getLockTime(estimatedStart);

    return NextResponse.json({
        round,
        gp: race.gp,
        locked,
        lockTime: lockTime.toISOString(),
        sessionStart: estimatedStart,
        isSaturday: race.isSaturday,
        source: 'fallback',
    });
}
