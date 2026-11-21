const test = require('node:test');
const assert = require('node:assert');
const { splitAtMidnight, sessionsOfDay, totalsByDay, fmt } = require('./sessions');

const at = (d, h, m) => new Date(2026, 10, d, h, m).getTime();
const MIN = 60000;

test('자정을 넘긴 구간은 어제와 오늘로 나뉜다', () => {
  const s = { start: at(21, 23, 30), end: at(22, 0, 45) };
  assert.deepStrictEqual(splitAtMidnight(s), [
    { start: at(21, 23, 30), end: at(22, 0, 0) },
    { start: at(22, 0, 0), end: at(22, 0, 45) },
  ]);
  assert.deepStrictEqual(totalsByDay([s]), { '2026-11-21': 30 * MIN, '2026-11-22': 45 * MIN });
  assert.strictEqual(sessionsOfDay([s], '2026-11-22').length, 1);
});

test('같은 날 구간은 합쳐진다', () => {
  const t = totalsByDay([
    { start: at(21, 9, 0), end: at(21, 10, 0) },
    { start: at(21, 14, 0), end: at(21, 14, 20) },
  ]);
  assert.deepStrictEqual(t, { '2026-11-21': 80 * MIN });
});

test('길이 0인 구간은 무시된다', () => {
  assert.deepStrictEqual(totalsByDay([{ start: at(21, 9, 0), end: at(21, 9, 0) }]), {});
});

test('시간 표시 형식', () => {
  assert.strictEqual(fmt(2 * 3600000 + 20 * MIN + 13000), '2:20:13');
  assert.strictEqual(fmt(0), '0:00:00');
});
