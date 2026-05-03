import { NextRequest, NextResponse } from 'next/server';
import { fetchRaceSession, fetchSessionResult, fetchDrivers } from '@/lib/openf1';
import { ROUND_TO_COUNTRY, CALENDAR } from '@/lib/f1-data';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const round = Number(searchParams.get('round'));
    const noCache = { headers: { 'Cache-Control': 'no-store' } };

    if (!round || round < 1 || round > 24) {
        return NextResponse.json({ error: 'Invalid round number' }, { status: 400, ...noCache });
    }

    const country = ROUND_TO_COUNTRY[round];
    if (!country) {
        return NextResponse.json({ error: 'Country mapping not found' }, { status: 404, ...noCache });
    }

    const race = CALENDAR.find(r => r.round === round);

    try {
        // 1. Get Race Session Key — pass race date for multi-GP country disambiguation
        const session = await fetchRaceSession(2026, country, race?.date);
        if (!session) {
            return NextResponse.json({ results: [], status: 'Session not found for 2026 yet.' }, noCache);
        }

        // 2. Fetch official session results and driver info
        const [classification, driverInfo] = await Promise.all([
            fetchSessionResult(session.session_key),
            fetchDrivers(session.session_key)
        ]);

        if (!classification || classification.length === 0) {
            return NextResponse.json({ results: [], status: 'Race in progress or results not yet available.' }, noCache);
        }

        // 3. Process results - Sort by position
        const grid = [...classification]
            .sort((a, b) => (a.position || 99) - (b.position || 99))
            .map(res => {
                const driver = driverInfo.find((d: any) => d.driver_number === res.driver_number);
                return {
                    position: res.position,
                    driverName: driver ? driver.full_name : `Driver ${res.driver_number}`,
                    teamName: driver ? driver.team_name : 'Unknown',
                    driverNumber: res.driver_number,
                    dnf: res.dnf === true
                };
            });

        return NextResponse.json({ results: grid, status: 'Success' }, noCache);

    } catch (error) {
        console.error('Race results fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, ...noCache });
    }
}
