// ═══════════════════════════════════════════════════════════
// F1 PADDOCK FANTASY — 2026 Season Data Constants
// ═══════════════════════════════════════════════════════════

export interface Team {
    name: string;
    shortName: string;
    drivers: string[];
    color: string;
    cssClass: string;
}

export interface Race {
    round: number;
    gp: string;
    date: string;
    circuit: string;
    isSaturday: boolean;
    specialCategory: {
        question: string;
        type: 'driver' | 'team' | 'options';
        options?: string[];
    };
}

export interface Driver {
    name: string;
    team: string;
    teamColor: string;
    teamCssClass: string;
}

export const SEASON = 2026;

// Define the 18 unique special categories
const SPECIAL_CATEGORIES = [
    { question: "Sprint race winner", type: "driver" as const },
    { question: "Team with fastest pit stop", type: "team" as const },
    { question: "Fastest lap", type: "driver" as const },
    { question: "Driver of the day", type: "driver" as const },
    { question: "Time between 1st and 2nd place", type: "options" as const, options: ["0 to 1s", "1 to 5s", "5 to 10s", "more than 10s"] },
    { question: "First team to make a pit stop", type: "team" as const },
    { question: "Number of safety car entries", type: "options" as const, options: ["0", "1 to 3", "3 to 5", "more than 5"] },
    { question: "Number of pit stops by the 1st place finisher", type: "options" as const, options: ["0", "1", "2", "3", "4+"] },
    { question: "Driver who will lead the race at the end of the 1st lap", type: "driver" as const },
    { question: "Driver who finishes in a position with the most places recovered", type: "driver" as const },
    { question: "Driver with the most seats lost (excluding DNF)", type: "driver" as const },
    { question: "Number of DNFs", type: "options" as const, options: ["0", "1 to 3", "4 to 5", "more than 5"] },
    { question: "Driver who will receive penalties during the race", type: "driver" as const },
    { question: "Team with the greatest seat distance between drivers (excluding DNF)", type: "team" as const },
    { question: "Team with the fewest combined points", type: "team" as const },
    { question: "Team with the slowest pit stop", type: "team" as const },
    { question: "Last place finisher (excluding DNF)", type: "driver" as const },
    { question: "First retirement", type: "driver" as const },
];

// Combine the 18 unique with 6 duplicates to reach 24 races (randomly repeating some)
const RACE_CATEGORIES = [
    ...SPECIAL_CATEGORIES,
    SPECIAL_CATEGORIES[2], // Fastest lap
    SPECIAL_CATEGORIES[3], // Driver of the day
    SPECIAL_CATEGORIES[6], // Number of safety car entries
    SPECIAL_CATEGORIES[11], // Number of DNFs
    SPECIAL_CATEGORIES[1], // Team with fastest pit stop
    SPECIAL_CATEGORIES[0]  // Sprint race winner (assigned to another sprint race)
];

// Shuffle array for random assignment (deterministic shuffle for consistency)
const shuffledCategories = [
    RACE_CATEGORIES[7], RACE_CATEGORIES[12], RACE_CATEGORIES[2], RACE_CATEGORIES[18], RACE_CATEGORIES[16], RACE_CATEGORIES[8],
    RACE_CATEGORIES[3], RACE_CATEGORIES[10], RACE_CATEGORIES[15], RACE_CATEGORIES[4], RACE_CATEGORIES[19], RACE_CATEGORIES[6],
    RACE_CATEGORIES[11], RACE_CATEGORIES[1], RACE_CATEGORIES[21], RACE_CATEGORIES[14], RACE_CATEGORIES[9], RACE_CATEGORIES[22],
    RACE_CATEGORIES[5], RACE_CATEGORIES[20], RACE_CATEGORIES[17], RACE_CATEGORIES[13], RACE_CATEGORIES[23], RACE_CATEGORIES[0]
];

export const TEAMS: Team[] = [
    { name: "Oracle Red Bull Racing", shortName: "Red Bull", drivers: ["Max Verstappen", "Isack Hadjar"], color: "#3671C6", cssClass: "team-redbull" },
    { name: "Mercedes-AMG Petronas", shortName: "Mercedes", drivers: ["George Russell", "Kimi Antonelli"], color: "#27F4D2", cssClass: "team-mercedes" },
    { name: "Scuderia Ferrari HP", shortName: "Ferrari", drivers: ["Charles Leclerc", "Lewis Hamilton"], color: "#E8002D", cssClass: "team-ferrari" },
    { name: "McLaren Mastercard", shortName: "McLaren", drivers: ["Lando Norris", "Oscar Piastri"], color: "#FF8000", cssClass: "team-mclaren" },
    { name: "Aston Martin Aramco", shortName: "Aston Martin", drivers: ["Fernando Alonso", "Lance Stroll"], color: "#229971", cssClass: "team-aston" },
    { name: "Alpine BWT", shortName: "Alpine", drivers: ["Pierre Gasly", "Franco Colapinto"], color: "#FF87BC", cssClass: "team-alpine" },
    { name: "Williams Atlassian", shortName: "Williams", drivers: ["Alex Albon", "Carlos Sainz Jr."], color: "#64C4FF", cssClass: "team-williams" },
    { name: "TGR Haas F1 Team", shortName: "Haas", drivers: ["Esteban Ocon", "Oliver Bearman"], color: "#B6BABD", cssClass: "team-haas" },
    { name: "Racing Bulls (VCARB)", shortName: "Racing Bulls", drivers: ["Liam Lawson", "Arvid Lindblad"], color: "#6692FF", cssClass: "team-rb" },
    { name: "Audi Revolut F1 Team", shortName: "Audi", drivers: ["Nico Hülkenberg", "Gabriel Bortoleto"], color: "#C0C0C0", cssClass: "team-audi" },
    { name: "Cadillac Formula 1", shortName: "Cadillac", drivers: ["Sergio Pérez", "Valtteri Bottas"], color: "#FFD700", cssClass: "team-cadillac" },
];

export const CALENDAR: Race[] = [
    { round: 1, gp: "Australian GP", date: "2026-03-08", circuit: "Albert Park", isSaturday: false, specialCategory: shuffledCategories[0] },
    { round: 2, gp: "Chinese GP", date: "2026-03-15", circuit: "Shanghai International", isSaturday: false, specialCategory: shuffledCategories[1] },
    { round: 3, gp: "Japanese GP", date: "2026-03-29", circuit: "Suzuka", isSaturday: false, specialCategory: shuffledCategories[2] },
    { round: 4, gp: "Bahrain GP", date: "2026-04-12", circuit: "Sakhir", isSaturday: false, specialCategory: shuffledCategories[3] },
    { round: 5, gp: "Saudi Arabian GP", date: "2026-04-19", circuit: "Jeddah Street", isSaturday: false, specialCategory: shuffledCategories[4] },
    { round: 6, gp: "Miami GP", date: "2026-05-03", circuit: "Miami Gardens", isSaturday: false, specialCategory: shuffledCategories[5] },
    { round: 7, gp: "Canadian GP", date: "2026-05-24", circuit: "Montreal", isSaturday: false, specialCategory: shuffledCategories[6] },
    { round: 8, gp: "Monaco GP", date: "2026-06-07", circuit: "Monte Carlo", isSaturday: false, specialCategory: shuffledCategories[7] },
    { round: 9, gp: "Barcelona-Catalunya GP", date: "2026-06-14", circuit: "Catalunya", isSaturday: false, specialCategory: shuffledCategories[8] },
    { round: 10, gp: "Austrian GP", date: "2026-06-28", circuit: "Red Bull Ring", isSaturday: false, specialCategory: shuffledCategories[9] },
    { round: 11, gp: "British GP", date: "2026-07-05", circuit: "Silverstone", isSaturday: false, specialCategory: shuffledCategories[10] },
    { round: 12, gp: "Belgian GP", date: "2026-07-19", circuit: "Spa-Francorchamps", isSaturday: false, specialCategory: shuffledCategories[11] },
    { round: 13, gp: "Hungarian GP", date: "2026-07-26", circuit: "Hungaroring", isSaturday: false, specialCategory: shuffledCategories[12] },
    { round: 14, gp: "Dutch GP", date: "2026-08-23", circuit: "Zandvoort", isSaturday: false, specialCategory: shuffledCategories[13] },
    { round: 15, gp: "Italian GP", date: "2026-09-06", circuit: "Monza", isSaturday: false, specialCategory: shuffledCategories[14] },
    { round: 16, gp: "Spanish GP (Madrid)", date: "2026-09-13", circuit: "Madrid (Debut)", isSaturday: false, specialCategory: shuffledCategories[15] },
    { round: 17, gp: "Azerbaijan GP", date: "2026-09-26", circuit: "Baku (Saturday)", isSaturday: true, specialCategory: shuffledCategories[16] },
    { round: 18, gp: "Singapore GP", date: "2026-10-11", circuit: "Marina Bay", isSaturday: false, specialCategory: shuffledCategories[17] },
    { round: 19, gp: "United States GP", date: "2026-10-25", circuit: "COTA", isSaturday: false, specialCategory: shuffledCategories[18] },
    { round: 20, gp: "Mexico City GP", date: "2026-11-01", circuit: "Hermanos Rodríguez", isSaturday: false, specialCategory: shuffledCategories[19] },
    { round: 21, gp: "São Paulo GP", date: "2026-11-08", circuit: "Interlagos", isSaturday: false, specialCategory: shuffledCategories[20] },
    { round: 22, gp: "Las Vegas GP", date: "2026-11-21", circuit: "Las Vegas (Saturday)", isSaturday: true, specialCategory: shuffledCategories[21] },
    { round: 23, gp: "Qatar GP", date: "2026-11-29", circuit: "Lusail", isSaturday: false, specialCategory: shuffledCategories[22] },
    { round: 24, gp: "Abu Dhabi GP", date: "2026-12-06", circuit: "Yas Marina", isSaturday: false, specialCategory: shuffledCategories[23] },
];

// Flatten all drivers with their team info
export const ALL_DRIVERS: Driver[] = TEAMS.flatMap(team =>
    team.drivers.map(d => ({
        name: d,
        team: team.shortName,
        teamColor: team.color,
        teamCssClass: team.cssClass,
    }))
);

// Get team slug for CSS from team name
export function getTeamCssClass(teamName: string): string {
    const team = TEAMS.find(t => t.name === teamName || t.shortName === teamName);
    return team?.cssClass ?? '';
}

export function getDriverTeam(driverName: string): Team | undefined {
    return TEAMS.find(t => t.drivers.includes(driverName));
}

export function getRaceByRound(round: number): Race | undefined {
    return CALENDAR.find(r => r.round === round);
}

export function getNextRace(): Race | undefined {
    const now = new Date();
    return CALENDAR.find(r => new Date(r.date) >= now);
}

// Scoring constants
export const YEAR_BET_SCORING = {
    DRIVER_CHAMPION: 250,
    DRIVER_P2: 150,
    DRIVER_P3: 100,
    CONSTRUCTOR_CHAMPION: 200,
    LAST_CONSTRUCTOR: 100,
    FEWEST_FINISHERS_RACE: 100,
    MOST_DNFS_DRIVER: 100,
    FIRST_DRIVER_REPLACED: 150,
    MOST_POLES: 100,
    MOST_PODIUMS_NO_WIN: 125,
} as const;

export const RACE_BET_SCORING = {
    EXACT_P1: 25,
    EXACT_P2: 18,
    EXACT_P3: 15,
    ALL_PODIUM_BONUS: 25,
    DRIVER_ON_PODIUM_WRONG_SPOT: 5,
    SPECIAL_CATEGORY: 15,
    TEAM_MOST_POINTS: 10,
    DNF: 10,
    ALL_CORRECT_BONUS: 40,
} as const;
