import { test, expect } from '@playwright/test';
import { scoreRaceBet, scoreYearBet } from '../../src/lib/scoring';
import type { RaceBet, RaceResult, YearBet, YearResult } from '../../src/lib/scoring';

test.describe('Scoring Engine Unit Tests', () => {

    test('Race Bet - Perfect Score (158 points)', () => {
        const bet: RaceBet = {
            p1: 'Max Verstappen',
            p2: 'Lando Norris',
            p3: 'Charles Leclerc',
            dnf: 'Logan Sargeant',
            teamMostPoints: 'Red Bull Racing',
            specialCategory: 'Yes',
        };

        const result: RaceResult = {
            p1: 'Max Verstappen',
            p2: 'Lando Norris',
            p3: 'Charles Leclerc',
            dnfDrivers: ['Logan Sargeant', 'Kevin Magnussen'],
            teamMostPoints: 'Red Bull Racing',
            specialCategoryAnswer: 'Yes',
        };

        const score = scoreRaceBet(bet, result);

        expect(score.podiumP1).toBe(25);
        expect(score.podiumP2).toBe(18);
        expect(score.podiumP3).toBe(15);
        expect(score.podiumBonus).toBe(25);
        expect(score.dnfPoints).toBe(10);
        expect(score.teamPoints).toBe(10);
        expect(score.specialPoints).toBe(15);
        expect(score.allCorrectBonus).toBe(40);
        expect(score.total).toBe(158);
    });

    test('Race Bet - Partial Score (Wrong Spot)', () => {
        const bet: RaceBet = {
            p1: 'Lando Norris',
            p2: 'Max Verstappen',
            p3: 'Lewis Hamilton',
            dnf: 'Carlos Sainz',
            teamMostPoints: 'McLaren',
            specialCategory: 'No',
        };

        const result: RaceResult = {
            p1: 'Max Verstappen',
            p2: 'Lando Norris',
            p3: 'Oscar Piastri',
            dnfDrivers: ['Fernando Alonso'],
            teamMostPoints: 'Red Bull Racing',
            specialCategoryAnswer: 'Yes',
        };

        const score = scoreRaceBet(bet, result);

        expect(score.podiumP1).toBe(0); // Wrong
        expect(score.podiumP2).toBe(0); // Wrong
        expect(score.wrongSpotPoints).toBe(10); // Norris (P1->P2) and Verstappen (P2->P1) both on podium = 5 * 2
        expect(score.dnfPoints).toBe(0);
        expect(score.teamPoints).toBe(0);
        expect(score.specialPoints).toBe(0);
        expect(score.total).toBe(10);
    });

    test('Year Bet - Full evaluation', () => {
        const bet: YearBet = {
            driverChampion: 'Max Verstappen',
            driverP2: 'Lando Norris',
            driverP3: 'Charles Leclerc',
            constructorChampion: 'Red Bull Racing',
            lastConstructor: 'Kick Sauber',
            fewestFinishersRace: 'Singapore GP',
            mostDnfsDriver: 'Yuki Tsunoda',
            firstDriverReplaced: 'Logan Sargeant',
            mostPoles: 'Max Verstappen',
            mostPodiumsNoWin: 'Oscar Piastri',
        };

        const result: YearResult = {
            driverChampion: 'Max Verstappen',
            driverP2: 'Lando Norris',
            driverP3: 'Lewis Hamilton', // Incorrect
            constructorChampion: 'McLaren', // Incorrect
            lastConstructor: 'Kick Sauber',
            fewestFinishersRace: 'Singapore GP',
            mostDnfsDriver: 'Yuki Tsunoda',
            firstDriverReplaced: 'Logan Sargeant',
            mostPoles: 'Lando Norris', // Incorrect
            mostPodiumsNoWin: 'Oscar Piastri',
        };

        const score = scoreYearBet(bet, result);

        // Breakdowns
        expect(score.breakdown['Driver Champion']).toBe(250);
        expect(score.breakdown['Driver P2']).toBe(150);
        expect(score.breakdown['Driver P3']).toBe(0);
        expect(score.breakdown['Constructor Champion']).toBe(0);
        expect(score.breakdown['Last Constructor']).toBe(100);
        expect(score.breakdown['Fewest Finishers Race']).toBe(100);
        expect(score.breakdown['Most DNFs Driver']).toBe(100);
        expect(score.breakdown['First Driver Replaced']).toBe(150);
        expect(score.breakdown['Most Poles']).toBe(0);
        expect(score.breakdown['Most Podiums No Win']).toBe(125);

        expect(score.total).toBe(250 + 150 + 100 + 100 + 100 + 150 + 125); // 975
    });
});
