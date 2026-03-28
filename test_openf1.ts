import { fetchRaceSession, fetchChampionshipDrivers } from './src/lib/openf1';

async function run() {
    console.log("Fetching 2026 Australia:", await fetchRaceSession(2026, 'Australia'));
    console.log("Fetching 2026 Champ:", (await fetchChampionshipDrivers(2026)).length);
    console.log("Fetching 2024 Australia:", await fetchRaceSession(2024, 'Australia'));
    console.log("Fetching 2024 Champ:", (await fetchChampionshipDrivers(2024)).length);
}
run();
