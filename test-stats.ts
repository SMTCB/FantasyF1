import { computeYearStats, mapDriverNumber } from './src/lib/year-stats';

async function test() {
    const raceRes = [
        { driver_number: 63, points: 25, dnf: false, position: 1 },
        { driver_number: 1, points: 18, dnf: false, position: 2 },
        { driver_number: 14, points: 0, dnf: true, position: 999 } // Alonso
    ];
    const qualRes = [
        { driver_number: 63, position: 1 } // pole
    ];
    const drivers = [
        { driver_number: 63, name_acronym: 'RUS', full_name: 'George RUSSELL', broadcast_name: 'G RUSSELL' },
        { driver_number: 1, name_acronym: 'VER', full_name: 'Max VERSTAPPEN', broadcast_name: 'M VERSTAPPEN' },
        { driver_number: 14, name_acronym: 'ALO', full_name: 'Fernando ALONSO', broadcast_name: 'F ALONSO' }
    ];

    console.log("MAPPED DRIVERS:");
    drivers.forEach(d => console.log(d.driver_number, "=>", mapDriverNumber(d.driver_number, drivers)));

    console.log("Computing...");
    const stats = computeYearStats(raceRes, qualRes, drivers, [], []);
    console.dir(stats, { depth: null });
}
test();
