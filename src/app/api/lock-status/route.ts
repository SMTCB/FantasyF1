// API route for checking bet lock status
import { NextRequest, NextResponse } from 'next/server';
import { fetchRaceSession, isBetLocked, getLockTime } from '@/lib/openf1';
import { CALENDAR, ROUND_TO_COUNTRY } from '@/lib/f1-data';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
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

    // 1. First, check our internal DB record (where sync_race_times.js populated data)
    const { data: dbRace } = await supabase
        .from('races')
        .select('session_start')
        .eq('round', round)
        .single();

    let sessionStart = dbRace?.session_start;

    // 2. Fallback to OpenF1 API directly if DB is missing time.
    //    Pass the calendar date so that countries hosting multiple GPs
    //    (Spain, United States) resolve to the correct session.
    if (!sessionStart) {
        const session = await fetchRaceSession(2026, country, race.date);
        if (session) {
            sessionStart = session.date_start;
        }
    }

    if (sessionStart) {
        const locked = isBetLocked(sessionStart);
        const lockTime = getLockTime(sessionStart);

        return NextResponse.json({
            round,
            gp: race.gp,
            locked,
            lockTime: lockTime.toISOString(),
            sessionStart: sessionStart,
            isSaturday: race.isSaturday,
            source: dbRace?.session_start ? 'database' : 'openf1',
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
