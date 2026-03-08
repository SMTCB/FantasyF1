import { NextRequest, NextResponse } from 'next/server';
import { fetchQualifyingSession, fetchRaceResults, fetchDrivers } from '@/lib/openf1';
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

        // 2. Fetch results (positions) and drivers
        const [positions, driverInfo] = await Promise.all([
            fetchRaceResults(session.session_key),
            fetchDrivers(session.session_key)
        ]);

        if (!positions || positions.length === 0) {
            return NextResponse.json({
                results: [],
                status: 'Qualifying in progress or results not yet available.'
            });
        }

        // 3. Process results
        // The position endpoint gives multiple samples, we need the latest for each driver
        const latestPositions = new Map();
        positions.forEach((p: any) => {
            const current = latestPositions.get(p.driver_number);
            if (!current || new Date(p.date) > new Date(current.date)) {
                latestPositions.set(p.driver_number, p);
            }
        });

        // Map to final sorted list
        const grid = Array.from(latestPositions.values())
            .sort((a, b) => a.position - b.position)
            .map(pos => {
                const driver = driverInfo.find((d: any) => d.driver_number === pos.driver_number);
                return {
                    position: pos.position,
                    driverName: driver ? driver.full_name : `Driver ${pos.driver_number}`,
                    teamName: driver ? driver.team_name : 'Unknown',
                    driverNumber: pos.driver_number
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
