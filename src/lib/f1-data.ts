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
}

export interface Driver {
    name: string;
    team: string;
    teamColor: string;
    teamCssClass: string;
}

export const SEASON = 2026;

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
    { round: 1, gp: "Australian GP", date: "2026-03-08", circuit: "Albert Park", isSaturday: false },
    { round: 2, gp: "Chinese GP", date: "2026-03-15", circuit: "Shanghai International", isSaturday: false },
    { round: 3, gp: "Japanese GP", date: "2026-03-29", circuit: "Suzuka", isSaturday: false },
    { round: 4, gp: "Bahrain GP", date: "2026-04-12", circuit: "Sakhir", isSaturday: false },
    { round: 5, gp: "Saudi Arabian GP", date: "2026-04-19", circuit: "Jeddah Street", isSaturday: false },
    { round: 6, gp: "Miami GP", date: "2026-05-03", circuit: "Miami Gardens", isSaturday: false },
    { round: 7, gp: "Canadian GP", date: "2026-05-24", circuit: "Montreal", isSaturday: false },
    { round: 8, gp: "Monaco GP", date: "2026-06-07", circuit: "Monte Carlo", isSaturday: false },
    { round: 9, gp: "Barcelona-Catalunya GP", date: "2026-06-14", circuit: "Catalunya", isSaturday: false },
    { round: 10, gp: "Austrian GP", date: "2026-06-28", circuit: "Red Bull Ring", isSaturday: false },
    { round: 11, gp: "British GP", date: "2026-07-05", circuit: "Silverstone", isSaturday: false },
    { round: 12, gp: "Belgian GP", date: "2026-07-19", circuit: "Spa-Francorchamps", isSaturday: false },
    { round: 13, gp: "Hungarian GP", date: "2026-07-26", circuit: "Hungaroring", isSaturday: false },
    { round: 14, gp: "Dutch GP", date: "2026-08-23", circuit: "Zandvoort", isSaturday: false },
    { round: 15, gp: "Italian GP", date: "2026-09-06", circuit: "Monza", isSaturday: false },
    { round: 16, gp: "Spanish GP (Madrid)", date: "2026-09-13", circuit: "Madrid (Debut)", isSaturday: false },
    { round: 17, gp: "Azerbaijan GP", date: "2026-09-26", circuit: "Baku (Saturday)", isSaturday: true },
    { round: 18, gp: "Singapore GP", date: "2026-10-11", circuit: "Marina Bay", isSaturday: false },
    { round: 19, gp: "United States GP", date: "2026-10-25", circuit: "COTA", isSaturday: false },
    { round: 20, gp: "Mexico City GP", date: "2026-11-01", circuit: "Hermanos Rodríguez", isSaturday: false },
    { round: 21, gp: "São Paulo GP", date: "2026-11-08", circuit: "Interlagos", isSaturday: false },
    { round: 22, gp: "Las Vegas GP", date: "2026-11-21", circuit: "Las Vegas (Saturday)", isSaturday: true },
    { round: 23, gp: "Qatar GP", date: "2026-11-29", circuit: "Lusail", isSaturday: false },
    { round: 24, gp: "Abu Dhabi GP", date: "2026-12-06", circuit: "Yas Marina", isSaturday: false },
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
