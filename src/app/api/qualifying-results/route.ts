import { NextRequest, NextResponse } from 'next/server';
import { fetchQualifyingSession, fetchSessionResult, fetchDrivers } from '@/lib/openf1';
import { ROUND_TO_COUNTRY } from '@/lib/f1-data';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const round = Number(searchParams.get('round'));

    if (!round || round < 1 || round > 24) {
        return NextResponse.json({ error: 'Invalid round number' }, { status: 400 });
    }

    const country = ROUND_TO_COUNTRY[round];
    if (!country) {
        return NextResponse.json({ error: 'Country mapping not found' }, { status: 404 });
    }

    try {
        // 1. Get Qualifying Session Key
        const session = await fetchQualifyingSession(2026, country);
        if (!session) {
            return NextResponse.json({
                results: [],
                status: 'Session not found for 2026 yet.'
            });
        }

        // 2. Fetch official session results and driver info
        const [classification, driverInfo] = await Promise.all([
            fetchSessionResult(session.session_key),
            fetchDrivers(session.session_key)
        ]);

        if (!classification || classification.length === 0) {
            return NextResponse.json({
                results: [],
                status: 'Qualifying in progress or results not yet available.'
            });
        }

        // 3. Process results - Sort by position
        const grid = [...classification]
            .sort((a, b) => a.position - b.position)
            .map(res => {
                const driver = driverInfo.find((d: any) => d.driver_number === res.driver_number);
                return {
                    position: res.position,
                    driverName: driver ? driver.full_name : `Driver ${res.driver_number}`,
                    teamName: driver ? driver.team_name : 'Unknown',
                    driverNumber: res.driver_number
                };
            });

        return NextResponse.json({
            results: grid,
            status: 'Success'
        });

    } catch (error) {
        console.error('Qualifying fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
