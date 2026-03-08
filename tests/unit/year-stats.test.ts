import { test, expect } from '@playwright/test';
import { computeYearStats } from '../../src/lib/year-stats';

test.describe('Year Stats Computing Unit Tests', () => {

    // Helper to structure driver info
    const mockDriverInfo = [
        { driver_number: 1, name_acronym: 'VER', full_name: 'Max Verstappen' },
        { driver_number: 4, name_acronym: 'NOR', full_name: 'Lando Norris' },
        { driver_number: 16, name_acronym: 'LEC', full_name: 'Charles Leclerc' },
        { driver_number: 81, name_acronym: 'PIA', full_name: 'Oscar Piastri' },
        { driver_number: 63, name_acronym: 'RUS', full_name: 'George Russell' },
    ];

    test('Computes tie cases properly for DNFs, Poles, Podiums-No-Win', () => {
        // Race results:
        // VER: 2 wins, 0 DNFs
        // NOR: 0 wins, 1 podium (P2), 0 DNFs
        // LEC: 0 wins, 0 podiums, 2 DNFs
        // PIA: 0 wins, 1 podium (P3), 0 DNFs
        // RUS: 0 wins, 0 podiums, 2 DNFs
        const raceResults = [
            { session_key: 101, session_type: 'Race', driver_number: 1, position: 1, dnf: false },
            { session_key: 101, session_type: 'Race', driver_number: 4, position: 2, dnf: false },
            { session_key: 101, session_type: 'Race', driver_number: 16, position: 99, dnf: true },
            { session_key: 101, session_type: 'Race', driver_number: 63, position: 99, dnf: true },
            { session_key: 102, session_type: 'Race', driver_number: 1, position: 1, dnf: false },
            { session_key: 102, session_type: 'Race', driver_number: 81, position: 3, dnf: false },
            { session_key: 102, session_type: 'Race', driver_number: 16, position: 99, dnf: true },
            { session_key: 102, session_type: 'Race', driver_number: 63, position: 99, dnf: true },
        ];

        // Qualifying:
        // VER: 1 pole
        // NOR: 1 pole
        const qualResults = [
            { session_key: 201, session_type: 'Qualifying', driver_number: 1, position: 1 },
            { session_key: 202, session_type: 'Qualifying', driver_number: 4, position: 1 },
        ];

        const stats = computeYearStats(raceResults, qualResults, mockDriverInfo, [], []);

        // DNFs should be tied between Leclerc & Russell (both 2 DNFs)
        expect(stats.mostDnfsCount).toBe(2);
        expect(stats.mostDnfsTied).toContain('Charles Leclerc');
        expect(stats.mostDnfsTied).toContain('George Russell');
        expect(stats.mostDnfsDriver?.includes(',')).toBe(true); // Should be comma separated

        // Poles tied between Verstappen & Norris
        expect(stats.mostPolesCount).toBe(1);
        expect(stats.mostPolesTied).toContain('Max Verstappen');
        expect(stats.mostPolesTied).toContain('Lando Norris');

        // Podiums-no-win should be tied between Norris (1 P2) & Piastri (1 P3)
        expect(stats.mostPodiumsNoWinCount).toBe(1);
        expect(stats.mostPodiumsNoWinTied).toContain('Lando Norris');
        expect(stats.mostPodiumsNoWinTied).toContain('Oscar Piastri');
        expect(stats.mostPodiumsNoWinTied).not.toContain('Max Verstappen'); // Verstappen has wins!
    });
});
