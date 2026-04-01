// ═══════════════════════════════════════════════════════════
// Scoring Engine — Year Bets & Race Bets
// ═══════════════════════════════════════════════════════════

import { RACE_BET_SCORING, YEAR_BET_SCORING } from './f1-data';

export interface RaceBet {
    p1: string;
    p2: string;
    p3: string;
    dnf: string | null;
    teamMostPoints: string | null;
    specialCategory: string | null;
}

export interface RaceResult {
    p1: string;
    p2: string;
    p3: string;
    dnfDrivers: string[];
    teamMostPoints: string;
    specialCategoryAnswer: string | null;
}

export interface RaceScore {
    podiumP1: number;
    podiumP2: number;
    podiumP3: number;
    podiumBonus: number;
    wrongSpotPoints: number;
    dnfPoints: number;
    teamPoints: number;
    specialPoints: number;
    allCorrectBonus: number;
    total: number;
}

/**
 * Score a race bet against actual results
 */
export function scoreRaceBet(bet: RaceBet, result: RaceResult): RaceScore {
    const score: RaceScore = {
        podiumP1: 0,
        podiumP2: 0,
        podiumP3: 0,
        podiumBonus: 0,
        wrongSpotPoints: 0,
        dnfPoints: 0,
        teamPoints: 0,
        specialPoints: 0,
        allCorrectBonus: 0,
        total: 0,
    };

    const resultPodium = [result.p1, result.p2, result.p3];

    // Exact position matches
    if (bet.p1 === result.p1) score.podiumP1 = RACE_BET_SCORING.EXACT_P1;
    if (bet.p2 === result.p2) score.podiumP2 = RACE_BET_SCORING.EXACT_P2;
    if (bet.p3 === result.p3) score.podiumP3 = RACE_BET_SCORING.EXACT_P3;

    // Driver on podium but wrong position
    const betPodium = [bet.p1, bet.p2, bet.p3];
    betPodium.forEach((driver, idx) => {
        if (driver && resultPodium.includes(driver)) {
            // Only award "wrong spot" points if NOT exact match
            const resultIdx = resultPodium.indexOf(driver);
            if (resultIdx !== idx) {
                score.wrongSpotPoints += RACE_BET_SCORING.DRIVER_ON_PODIUM_WRONG_SPOT;
            }
        }
    });

    // All podium correct bonus
    if (bet.p1 === result.p1 && bet.p2 === result.p2 && bet.p3 === result.p3) {
        score.podiumBonus = RACE_BET_SCORING.ALL_PODIUM_BONUS;
    }

    // DNF
    if (bet.dnf && result.dnfDrivers.includes(bet.dnf)) {
        score.dnfPoints = RACE_BET_SCORING.DNF;
    }

    // Team with most points
    if (bet.teamMostPoints === result.teamMostPoints) {
        score.teamPoints = RACE_BET_SCORING.TEAM_MOST_POINTS;
    }

    // Special category
    if (bet.specialCategory && result.specialCategoryAnswer && bet.specialCategory === result.specialCategoryAnswer) {
        score.specialPoints = RACE_BET_SCORING.SPECIAL_CATEGORY;
    }

    // Calculate total
    score.total =
        score.podiumP1 +
        score.podiumP2 +
        score.podiumP3 +
        score.podiumBonus +
        score.wrongSpotPoints +
        score.dnfPoints +
        score.teamPoints +
        score.specialPoints;

    // All categories correct bonus
    const allCorrect =
        score.podiumP1 > 0 &&
        score.podiumP2 > 0 &&
        score.podiumP3 > 0 &&
        score.dnfPoints > 0 &&
        score.teamPoints > 0 &&
        score.specialPoints > 0;

    if (allCorrect) {
        score.allCorrectBonus = RACE_BET_SCORING.ALL_CORRECT_BONUS;
        score.total += score.allCorrectBonus;
    }

    return score;
}

export interface YearBet {
    driverChampion: string;
    driverP2: string;
    driverP3: string;
    constructorChampion: string;
    lastConstructor: string;
    fewestFinishersRace: string;
    mostDnfsDriver: string;
    firstDriverReplaced: string;
    mostPoles: string;
    mostPodiumsNoWin: string;
}

export interface YearResult {
    driverChampion: string;
    driverP2: string;
    driverP3: string;
    constructorChampion: string;
    lastConstructor: string;
    fewestFinishersRace: string;
    mostDnfsDriver: string;
    firstDriverReplaced: string;
    mostPoles: string;
    mostPodiumsNoWin: string;
}

export interface YearScore {
    breakdown: Record<string, number>;
    total: number;
}

/**
 * Score year bets against actual results.
 * 
 * For `mostDnfsDriver`, `mostPoles`, and `mostPodiumsNoWin`, the result value
 * may be a comma-separated list of tied drivers (e.g. "Hamilton,Russell").
 * A user's bet is considered correct if their pick matches ANY of the tied values.
 */
export function scoreYearBet(bet: YearBet, result: YearResult): YearScore {
    const breakdown: Record<string, number> = {};
    let total = 0;

    // Fields with exact-match scoring
    const exactChecks: [string, keyof YearBet, keyof typeof YEAR_BET_SCORING][] = [
        ['Driver Champion', 'driverChampion', 'DRIVER_CHAMPION'],
        ['Driver P2', 'driverP2', 'DRIVER_P2'],
        ['Driver P3', 'driverP3', 'DRIVER_P3'],
        ['Constructor Champion', 'constructorChampion', 'CONSTRUCTOR_CHAMPION'],
        ['Last Constructor', 'lastConstructor', 'LAST_CONSTRUCTOR'],
        ['First Driver Replaced', 'firstDriverReplaced', 'FIRST_DRIVER_REPLACED'],
    ];

    exactChecks.forEach(([label, betKey, scoreKey]) => {
        if (bet[betKey] && result[betKey] && bet[betKey] === result[betKey]) {
            const pts = YEAR_BET_SCORING[scoreKey];
            breakdown[label] = pts;
            total += pts;
        } else {
            breakdown[label] = 0;
        }
    });

    // Fields with tie-aware scoring (result may be comma-separated)
    const tieChecks: [string, keyof YearBet, keyof typeof YEAR_BET_SCORING][] = [
        ['Most DNFs Driver', 'mostDnfsDriver', 'MOST_DNFS_DRIVER'],
        ['Most Poles', 'mostPoles', 'MOST_POLES'],
        ['Most Podiums No Win', 'mostPodiumsNoWin', 'MOST_PODIUMS_NO_WIN'],
        ['Fewest Finishers Race', 'fewestFinishersRace', 'FEWEST_FINISHERS_RACE'],
    ];

    tieChecks.forEach(([label, betKey, scoreKey]) => {
        const betValue = bet[betKey];
        const resultValue = result[betKey];
        if (betValue && resultValue) {
            // Strip any "(Computed tie)" suffix and split comma-separated values
            const cleanResult = resultValue.replace(/ \(Computed tie\)/g, '');
            const tiedValues = cleanResult.split(',').map(s => s.trim());
            
            if (tiedValues.includes(betValue)) {
                const pts = YEAR_BET_SCORING[scoreKey];
                breakdown[label] = pts;
                total += pts;
            } else {
                breakdown[label] = 0;
            }
        } else {
            breakdown[label] = 0;
        }
    });

    return { breakdown, total };
}
