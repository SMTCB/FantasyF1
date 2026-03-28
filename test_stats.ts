const OPENF1_BASE = 'https://api.openf1.org/v1';

async function fetchWithRetry(url: string, maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
        const res = await fetch(url);
        if (res.ok) return res;
        if (res.status === 404) return res; // Valid response for future races
        if (res.status === 429) {
            console.log(`Hit 429 on ${url}. Retrying in ${1000 * (i + 1)}ms...`);
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            continue;
        }
        return res;
    }
    return fetch(url);
}

async function fetchAllSeasonResults(year: number, sessionType: 'Race' | 'Qualifying') {
    const sessionsRes = await fetchWithRetry(`${OPENF1_BASE}/sessions?year=${year}&session_type=${sessionType}`);
    if (!sessionsRes.ok) return [];
    const sessions = await sessionsRes.json();
    if (!sessions || sessions.length === 0) return [];
    
    console.log(`Found ${sessions.length} sessions for ${sessionType}`);
    const allResults: any[] = [];
    
    // Chunking with retry
    const CHUNK_SIZE = 3;
    const BATCH_DELAY_MS = 300;
    let records = 0;

    for (let i = 0; i < sessions.length; i += CHUNK_SIZE) {
        const chunk = sessions.slice(i, i + CHUNK_SIZE);
        const chunkPromises = chunk.map(async (sess: any) => {
            const res = await fetchWithRetry(`${OPENF1_BASE}/session_result?session_key=${sess.session_key}`);
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) {
                return data.map((d: any) => ({ ...d, session_key: sess.session_key }));
            }
            return [];
        });

        const resolvedChunk = await Promise.all(chunkPromises);
        resolvedChunk.forEach(r => records += r.length);
        allResults.push(...resolvedChunk.flat());

        if (i + CHUNK_SIZE < sessions.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        }
    }
    console.log(`Finished ${sessionType}. Total records: ${records}`);
    return allResults;
}

async function run() {
    const t0 = Date.now();
    await fetchAllSeasonResults(2026, 'Race');
    await fetchAllSeasonResults(2026, 'Qualifying');
    const t1 = Date.now();
    console.log(`Done in ${(t1 - t0) / 1000}s`);
}
run();
