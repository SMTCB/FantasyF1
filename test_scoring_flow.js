const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We need the scoring logic here or we can just mock the scoring result and push to DB
// But since I want to verify the logic, I'll literally perform the steps the admin would do.
// I'll import the scoring logic if possible, but it's easier to just re-implement a minimal version for verification.

const POINT_VALUES = {
    PODIUM_CORRECT: 10,
    PODIUM_OFF_BY_ONE: 8,
    PODIUM_OFF_BY_TWO: 6,
    PODIUM_WRONG_SPOT: 3,
    DNF_CORRECT: 5,
    TEAM_MOST_POINTS_CORRECT: 5,
    SPECIAL_CORRECT: 10,
    PODIUM_BONUS: 5,
    ALL_CORRECT_BONUS: 10
};

function minimalScoreRaceBet(bet, result) {
    let score = {
        total: 0,
        podiumP1: 0, podiumP2: 0, podiumP3: 0,
        podiumBonus: 0, wrongSpotPoints: 0,
        dnfPoints: 0, teamPoints: 0, specialPoints: 0,
        allCorrectBonus: 0
    };

    const podiumResults = [result.p1, result.p2, result.p3];
    const podiumBets = [bet.p1, bet.p2, bet.p3];

    // P1
    if (bet.p1 === result.p1) score.podiumP1 = POINT_VALUES.PODIUM_CORRECT;
    else if (bet.p1 === result.p2) score.podiumP1 = POINT_VALUES.PODIUM_OFF_BY_ONE;
    else if (bet.p1 === result.p3) score.podiumP1 = POINT_VALUES.PODIUM_OFF_BY_TWO;

    // P2
    if (bet.p2 === result.p2) score.podiumP2 = POINT_VALUES.PODIUM_CORRECT;
    else if (bet.p2 === result.p1) score.podiumP2 = POINT_VALUES.PODIUM_OFF_BY_ONE;
    else if (bet.p2 === result.p3) score.podiumP2 = POINT_VALUES.PODIUM_OFF_BY_ONE;

    // P3
    if (bet.p3 === result.p3) score.podiumP3 = POINT_VALUES.PODIUM_CORRECT;
    else if (bet.p3 === result.p2) score.podiumP3 = POINT_VALUES.PODIUM_OFF_BY_ONE;
    else if (bet.p3 === result.p1) score.podiumP3 = POINT_VALUES.PODIUM_OFF_BY_TWO;

    // Podium Bonus (all 3 correct spots)
    if (bet.p1 === result.p1 && bet.p2 === result.p2 && bet.p3 === result.p3) {
        score.podiumBonus = POINT_VALUES.PODIUM_BONUS;
    }

    // DNF
    if (result.dnfDrivers.includes(bet.dnf)) {
        score.dnfPoints = POINT_VALUES.DNF_CORRECT;
    }

    // Team
    if (bet.teamMostPoints === result.teamMostPoints) {
        score.teamPoints = POINT_VALUES.TEAM_MOST_POINTS_CORRECT;
    }

    // Special
    if (bet.specialCategory === result.specialCategoryAnswer) {
        score.specialPoints = POINT_VALUES.SPECIAL_CORRECT;
    }

    score.total = score.podiumP1 + score.podiumP2 + score.podiumP3 + score.podiumBonus + score.dnfPoints + score.teamPoints + score.specialPoints;

    // All correct bonus
    if (bet.p1 === result.p1 && bet.p2 === result.p2 && bet.p3 === result.p3 &&
        result.dnfDrivers.includes(bet.dnf) &&
        bet.teamMostPoints === result.teamMostPoints &&
        bet.specialCategory === result.specialCategoryAnswer) {
        score.allCorrectBonus = POINT_VALUES.ALL_CORRECT_BONUS;
        score.total += score.allCorrectBonus;
    }

    return score;
}

async function runFlow() {
    console.log("--- STARTING SCORING FLOW ---");

    // 1. Get test_racer user id
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const testRacer = users.find(u => u.email === 'test_racer@f1.local');
    if (!testRacer) {
        console.error("test_racer not found");
        return;
    }

    // 2. Submit bet for test_racer (Round 1)
    console.log("Submitting bet for test_racer...");
    await supabase.from('bets_race').upsert({
        user_id: testRacer.id,
        round: 1,
        p1: 'Charles Leclerc',
        p2: 'Max Verstappen',
        p3: 'Sergio Pérez',
        dnf_driver: 'Nico Hülkenberg',
        team_most_points: 'Ferrari',
        special_category_answer: '21+'
    }, { onConflict: 'user_id, round' });

    // 3. Set Results for Round 1
    console.log("Setting results for Round 1...");
    const round1Result = {
        p1: 'George Russell',
        p2: 'Max Verstappen',
        p3: 'Sergio Pérez',
        dnfDrivers: ['Nico Hülkenberg'],
        teamMostPoints: 'Red Bull',
        specialCategoryAnswer: '4+'
    };

    await supabase.from('races').update({
        result_p1: round1Result.p1,
        result_p2: round1Result.p2,
        result_p3: round1Result.p3,
        result_dnf_drivers: round1Result.dnfDrivers,
        result_team_most_points: round1Result.teamMostPoints,
        special_category_answer: round1Result.specialCategoryAnswer,
        is_scored: true
    }).eq('round', 1);

    // 4. Score all bets for Round 1
    console.log("Calculating scores...");
    const { data: bets } = await supabase.from('bets_race').select('*').eq('round', 1);

    for (const bet of bets) {
        const raceBet = {
            p1: bet.p1,
            p2: bet.p2,
            p3: bet.p3,
            dnf: bet.dnf_driver,
            teamMostPoints: bet.team_most_points,
            specialCategory: bet.special_category_answer
        };

        const score = minimalScoreRaceBet(raceBet, round1Result);
        console.log(`User ${bet.user_id} score: ${score.total}`);

        await supabase.from('scores').upsert({
            user_id: bet.user_id,
            round: 1,
            score_type: 'race',
            podium_p1_pts: score.podiumP1,
            podium_p2_pts: score.podiumP2,
            podium_p3_pts: score.podiumP3,
            podium_bonus_pts: score.podiumBonus,
            wrong_spot_pts: score.wrongSpotPoints,
            dnf_pts: score.dnfPoints,
            team_pts: score.teamPoints,
            special_pts: score.specialPoints,
            all_correct_bonus: score.allCorrectBonus,
            total_points: score.total,
            scored_at: new Date().toISOString()
        }, { onConflict: 'user_id, round, score_type' });
    }

    console.log("--- FLOW COMPLETE ---");
}

runFlow();
