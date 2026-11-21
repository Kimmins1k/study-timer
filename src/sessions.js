// 공부 구간 {start, end}(ms) 계산. main 프로세스와 화면(script 태그) 양쪽에서 같이 쓴다.
// 구간은 나누지 않고 저장하고, 읽을 때 자정 기준으로 나눈다.

function dayKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextMidnight(ms) {
  const d = new Date(ms);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function splitAtMidnight(s) {
  const out = [];
  for (let start = s.start; start < s.end; ) {
    const end = Math.min(s.end, nextMidnight(start));
    out.push({ start, end });
    start = end;
  }
  return out;
}

// 해당 날짜(YYYY-MM-DD)에 속한 조각들
function sessionsOfDay(sessions, key) {
  return sessions.flatMap(splitAtMidnight).filter((p) => dayKey(p.start) === key);
}

function totalsByDay(sessions) {
  const t = {};
  for (const p of sessions.flatMap(splitAtMidnight)) {
    const k = dayKey(p.start);
    t[k] = (t[k] || 0) + p.end - p.start;
  }
  return t;
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

if (typeof module !== 'undefined') module.exports = { dayKey, splitAtMidnight, sessionsOfDay, totalsByDay, fmt };
