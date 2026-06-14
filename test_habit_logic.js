// habit-logic.js 的单元测试，用 Node 内置 node:test（零依赖）。
// 跑测试：node --test test_habit_logic.js
const test = require('node:test');
const assert = require('node:assert');
const {
  dayKey, currentStreak, bestStreak, totalDone, doneInLastDays, normalizeHabits,
} = require('./habit-logic.js');

// 固定"今天"，保证测试结果不随真实日期变化
const TODAY = new Date('2026-06-15T12:00:00');

test('dayKey：格式化为 YYYY-MM-DD（个位补零）', () => {
  assert.strictEqual(dayKey(new Date('2026-01-05T08:00:00')), '2026-01-05');
  assert.strictEqual(dayKey(new Date('2026-12-31T23:00:00')), '2026-12-31');
});

test('currentStreak：今天打卡，连续 3 天', () => {
  const h = { dates: { '2026-06-15': true, '2026-06-14': true, '2026-06-13': true } };
  assert.strictEqual(currentStreak(h, TODAY), 3);
});

test('currentStreak：今天没打但昨天起连续 2 天（不清零）', () => {
  const h = { dates: { '2026-06-14': true, '2026-06-13': true } };
  assert.strictEqual(currentStreak(h, TODAY), 2);
});

test('currentStreak：中间断了只算到断点', () => {
  const h = { dates: { '2026-06-15': true, '2026-06-13': true } };
  assert.strictEqual(currentStreak(h, TODAY), 1);
});

test('currentStreak：没有任何打卡为 0', () => {
  assert.strictEqual(currentStreak({ dates: {} }, TODAY), 0);
});

test('bestStreak：找出最长连续段', () => {
  const h = { dates: { '2026-06-01': true, '2026-06-02': true, '2026-06-03': true, '2026-06-10': true } };
  assert.strictEqual(bestStreak(h), 3);
});

test('bestStreak：空为 0，单天为 1', () => {
  assert.strictEqual(bestStreak({ dates: {} }), 0);
  assert.strictEqual(bestStreak({ dates: { '2026-06-01': true } }), 1);
});

test('bestStreak：跨月连续也能正确识别', () => {
  const h = { dates: { '2026-01-30': true, '2026-01-31': true, '2026-02-01': true } };
  assert.strictEqual(bestStreak(h), 3);
});

test('doneInLastDays：统计窗口内打卡次数', () => {
  const h = { dates: { '2026-06-15': true, '2026-06-14': true, '2026-06-10': true, '2026-06-01': true } };
  assert.strictEqual(doneInLastDays(h, 7, TODAY), 3);   // 15/14/10 在最近 7 天内；01 不在
  assert.strictEqual(doneInLastDays(h, 30, TODAY), 4);  // 30 天窗口把 01 也算上
});

test('totalDone：累计打卡次数', () => {
  assert.strictEqual(totalDone({ dates: { '2026-06-01': true, '2026-06-02': true } }), 2);
});

test('normalizeHabits：合法数据原样保留', () => {
  const good = [{ id: 'a', name: '读书', dates: { '2026-06-01': true } }];
  assert.deepStrictEqual(normalizeHabits(good), good);
});

test('normalizeHabits：缺字段补齐、垃圾项丢弃', () => {
  const out = normalizeHabits([{ name: '喝水' }, { dates: { '2026-06-01': true } }, null, 'x', 42]);
  assert.strictEqual(out.length, 2);          // null / 字符串 / 数字被丢弃
  assert.deepStrictEqual(out[0].dates, {});   // 缺 dates 补成 {}
  assert.strictEqual(out[1].name, '未命名习惯'); // 缺 name 补默认
  assert.ok(out.every(h => typeof h.id === 'string')); // 都补上了 id
});

test('normalizeHabits：非数组返回空数组', () => {
  assert.deepStrictEqual(normalizeHabits(null), []);
  assert.deepStrictEqual(normalizeHabits({}), []);
});
