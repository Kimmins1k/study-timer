const $ = (id) => document.getElementById(id);
const HOUR = 3600000;

// 작업 표시줄 아이콘: 64px로 그려서 Windows가 화면 배율에 맞춰 줄인다
const c = document.createElement('canvas');
c.width = c.height = 64;
const g = c.getContext('2d');

function ringIcon(total, running) {
  const h = Math.floor(total / HOUR);
  const frac = (total % HOUR) / HOUR;
  g.clearRect(0, 0, 64, 64);
  g.lineWidth = 14;
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(128,128,128,0.4)';
  g.beginPath();
  g.arc(32, 32, 24, 0, 2 * Math.PI);
  g.stroke();
  if (frac > 0) {
    g.strokeStyle = running ? '#1D9E75' : '#9a9a9a';
    g.beginPath();
    g.arc(32, 32, 24, -Math.PI / 2, -Math.PI / 2 + frac * 2 * Math.PI);
    g.stroke();
  }
  if (h) {
    // 작업 표시줄이 밝든 어둡든 읽히도록 흰 글자에 검은 테두리
    g.font = `bold ${h > 9 ? 24 : 30}px sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 5;
    g.strokeStyle = '#000';
    g.strokeText(h, 32, 34);
    g.fillStyle = '#fff';
    g.fillText(h, 32, 34);
  }
  return c.toDataURL();
}

// 미리보기 창 버튼 그림 (▶, ⏸)
function glyph(play) {
  g.clearRect(0, 0, 64, 64);
  g.fillStyle = '#1D9E75';
  g.beginPath();
  if (play) {
    g.moveTo(18, 12); g.lineTo(52, 32); g.lineTo(18, 52);
  } else {
    g.rect(16, 12, 12, 40); g.rect(36, 12, 12, 40);
  }
  g.fill();
  return c.toDataURL();
}

const WD = ['일', '월', '화', '수', '목', '금', '토'];
const hm = (ms) => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : m ? `${m}분` : '1분 미만'; };
const clock = (ms) => new Date(ms).toTimeString().slice(0, 5);
const segList = (parts) => parts.map((p) => `<li><span>${clock(p.start)} – ${clock(p.end)}</span><b>${hm(p.end - p.start)}</b></li>`).join('');

let iconKey;
let tab = 'today';
let state;
const month = new Date();
month.setDate(1);

function renderToday() {
  const { sessions, running, now } = state;
  const total = totalsByDay(sessions)[dayKey(now)] || 0;
  const h = Math.floor(total / HOUR);
  $('arc').setAttribute('stroke-dasharray', `${((total % HOUR) / HOUR) * 503} 503`);
  $('arc').setAttribute('stroke', running ? 'var(--green)' : 'var(--gray)');
  $('hours').textContent = h || '';
  $('total').textContent = fmt(total);
  $('state').textContent = running ? '공부 중' : '멈춤';
  $('toggle').textContent = running ? '멈춤' : '시작';
  $('toggle').classList.toggle('on', running);
  $('segments').innerHTML = segList(sessionsOfDay(sessions, dayKey(now)).reverse()) || '<li class="empty">시작을 누르면 공부 시간이 기록됩니다</li>';

  // 링은 1분 단위로만 움직이므로 바뀔 때만 다시 그린다
  const key = `${Math.floor(total / 60000)}|${running}`;
  if (key !== iconKey) {
    iconKey = key;
    api.setIcons(ringIcon(total, running), glyph(!running));
  }
}

function renderHistory() {
  const { sessions } = state;
  const totals = totalsByDay(sessions);
  const keys = Object.keys(totals).sort().reverse();
  $('days').innerHTML = keys.map((k) => {
    const wd = WD[new Date(k + 'T00:00').getDay()];
    return `<details><summary><span>${k} (${wd})</span><b>${hm(totals[k])}</b></summary><ul>${segList(sessionsOfDay(sessions, k))}</ul></details>`;
  }).join('') || '<ul><li class="empty">아직 기록이 없습니다</li></ul>';
}

function renderMonth() {
  const totals = totalsByDay(state.sessions);
  const y = month.getFullYear();
  const m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const todayKey = dayKey(state.now);
  let html = WD.map((w) => `<div class="wd">${w}</div>`).join('') + '<div></div>'.repeat(month.getDay());
  let sum = 0;
  for (let d = 1; d <= days; d++) {
    const k = dayKey(new Date(y, m, d).getTime());
    const t = totals[k] || 0;
    sum += t;
    const lv = t === 0 ? '' : t < HOUR ? 'l1' : t < 3 * HOUR ? 'l2' : t < 6 * HOUR ? 'l3' : 'l4';
    html += `<div class="day ${lv}${k === todayKey ? ' today' : ''}" title="${k} ${hm(t)}">${d}${t ? `<b>${fmt(t).slice(0, -3)}</b>` : ''}</div>`;
  }
  $('grid').innerHTML = html;
  $('monthLabel').textContent = `${y}년 ${m + 1}월`;
  // 이번 달은 오늘까지, 지난 달은 그 달 전체 일수로 평균
  const now = new Date(state.now);
  const passed = y === now.getFullYear() && m === now.getMonth() ? now.getDate() : days;
  $('monthTotal').textContent = hm(sum);
  $('monthAvg').textContent = hm(passed > 0 ? sum / passed : 0);
}

async function render(all) {
  state = await api.state();
  renderToday();
  // 기록·월간은 탭을 열 때만 다시 그린다 (펼친 날짜가 접히지 않게)
  if (all && tab === 'history') renderHistory();
  if (all && tab === 'month') renderMonth();
}

document.querySelectorAll('nav button').forEach((b) => {
  b.onclick = () => {
    tab = b.dataset.tab;
    document.querySelectorAll('nav button').forEach((x) => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('section').forEach((s) => (s.hidden = s.id !== tab));
    render(true);
  };
});
$('prev').onclick = () => { month.setMonth(month.getMonth() - 1); renderMonth(); };
$('next').onclick = () => { month.setMonth(month.getMonth() + 1); renderMonth(); };
$('toggle').onclick = () => { api.toggle(); render(); };
$('quit').onclick = () => api.quit();
setInterval(render, 1000);
render();
