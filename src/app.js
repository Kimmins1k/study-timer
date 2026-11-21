const $ = (id) => document.getElementById(id);

async function render() {
  const { sessions, running, now } = await api.state();
  $('total').textContent = fmt(totalsByDay(sessions)[dayKey(now)] || 0);
  $('toggle').textContent = running ? '멈춤' : '시작';
}

$('toggle').onclick = () => { api.toggle(); render(); };
$('quit').onclick = () => api.quit();
setInterval(render, 1000);
render();
