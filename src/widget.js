const HOUR = 3600000;
const arc = document.getElementById('arc');

async function tick() {
  const { sessions, running, now } = await api.state();
  const total = totalsByDay(sessions)[dayKey(now)] || 0;
  arc.setAttribute('stroke-dasharray', `${((total % HOUR) / HOUR) * 56.55} 56.55`);
  arc.setAttribute('stroke', running ? '#1D9E75' : '#9a9a9a');
  document.getElementById('t').textContent = fmt(total);
}

document.getElementById('w').onclick = () => api.open();
setInterval(tick, 1000);
tick();
