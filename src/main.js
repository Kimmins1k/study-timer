const { app, BrowserWindow, ipcMain, nativeImage, powerMonitor } = require('electron');
const fs = require('fs');
const path = require('path');
const { fmt, totalsByDay, dayKey } = require('./sessions');

// 두 개가 동시에 돌면 시간이 두 번 기록되므로 하나만 허용
if (!app.requestSingleInstanceLock() || process.argv.includes('--quit')) {
  app.quit();
  return;
}

const file = path.join(app.getPath('userData'), 'sessions.json');
let sessions = [];
try {
  sessions = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  // 깨진 파일은 덮어쓰지 않고 옆에 보관
  if (e.code !== 'ENOENT') fs.renameSync(file, `${file}.broken-${Date.now()}`);
}

function save() {
  fs.writeFileSync(file + '.tmp', JSON.stringify(sessions));
  fs.renameSync(file + '.tmp', file);
}

let win;
let running = false;
let quitting = false;
let ticks = 0;

const last = () => sessions[sessions.length - 1];
const todayTotal = () => totalsByDay(sessions)[dayKey(Date.now())] || 0;

function update() {
  if (win) win.setTitle(`${running ? '공부 중' : '멈춤'} ${fmt(todayTotal())}`);
}

function toggle() {
  const now = Date.now();
  if (running) last().end = now;
  else sessions.push({ start: now, end: now });
  running = !running;
  save();
  update();
}

setInterval(() => {
  if (running) {
    const now = Date.now();
    // 1초마다 도는데 5초 넘게 비었으면 절전 등으로 멈췄던 것: 빈 시간은 빼고 멈춤
    if (now - last().end > 5000) {
      running = false;
      save();
    } else {
      last().end = now;
      if (++ticks % 30 === 0) save(); // 갑자기 꺼져도 잃는 건 최대 30초
    }
  }
  update();
}, 1000);

ipcMain.handle('state', () => ({ sessions, running, now: Date.now() }));
ipcMain.on('toggle', toggle);
ipcMain.on('quit', () => app.quit());
ipcMain.on('icons', (e, ring, button) => {
  win.setIcon(nativeImage.createFromDataURL(ring));
  win.setThumbarButtons([{ tooltip: running ? '멈춤' : '시작', icon: nativeImage.createFromDataURL(button), click: toggle }]);
});

app.on('second-instance', (e, argv) => {
  if (argv.includes('--quit')) return app.quit();
  win.restore();
  win.focus();
});

app.on('before-quit', () => {
  quitting = true;
  if (running) toggle();
});

app.whenReady().then(() => {
  // 자리를 비운 시간이 공부 시간에 들어가지 않게 잠금·절전 때 멈춤 (풀려도 자동 재시작 안 함)
  const pause = () => running && toggle();
  powerMonitor.on('lock-screen', pause);
  powerMonitor.on('suspend', pause);

  // 작업 표시줄 아이콘 우클릭 메뉴의 "종료"
  app.setUserTasks([{
    // 포터블 exe라도 실행 중엔 풀린 exe를 직접 불러야 압축 풀기 없이 바로 꺼진다
    program: process.execPath,
    arguments: app.isPackaged ? '--quit' : `"${app.getAppPath()}" --quit`,
    title: '종료',
    description: '공부 타이머 종료',
    iconPath: process.execPath,
    iconIndex: 0,
  }]);

  win = new BrowserWindow({
    width: 440,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), backgroundThrottling: false },
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  // X는 끄지 않고 작업 표시줄로 내린다. 아이콘이 사라지면 타이머를 못 보기 때문
  win.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      win.minimize();
    }
  });
  update();
});
