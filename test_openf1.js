const OPENF1_BASE = 'https://api.openf1.org/v1';
fetch(`${OPENF1_BASE}/session_result?session_key=9163`).then(r => r.json()).then(d => console.log(d[0]));
