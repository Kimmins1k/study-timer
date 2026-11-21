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

let iconKey;

async function render() {
  const { sessions, running, now } = await api.state();
  const total = totalsByDay(sessions)[dayKey(now)] || 0;
  $('total').textContent = fmt(total);
  $('toggle').textContent = running ? '멈춤' : '시작';
  // 링은 1분 단위로만 움직이므로 바뀔 때만 다시 그린다
  const key = `${Math.floor(total / 60000)}|${running}`;
  if (key !== iconKey) {
    iconKey = key;
    api.setIcons(ringIcon(total, running), glyph(!running));
  }
}

$('toggle').onclick = () => { api.toggle(); render(); };
$('quit').onclick = () => api.quit();
setInterval(render, 1000);
render();
