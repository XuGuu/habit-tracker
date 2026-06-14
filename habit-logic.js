// 习惯追踪器的纯逻辑（日期、连续天数、统计、数据规范化）。
// 不碰 DOM、不读 localStorage，方便单元测试。
// 既能被网页 <script src> 加载（暴露为全局函数），也能被 Node 测试 require。
// 注意：和时间有关的函数都接受一个可选的 today 参数，测试时传入固定日期才能稳定复现。

// 把日期对象变成 "YYYY-MM-DD" 字符串（用本地时间，避免时区错位）。
function dayKey(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// 当前连续打卡天数：从今天往回数。今天还没打就从昨天起算（不会因"今天还没打"清零）。
function currentStreak(h, today = new Date()) {
  let streak = 0;
  const d = new Date(today);
  if (!h.dates[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (h.dates[dayKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// 历史最长连续天数：扫描所有打卡日期，找最长的连续段。
function bestStreak(h) {
  const days = Object.keys(h.dates).sort();
  if (days.length === 0) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T00:00:00');
    const curr = new Date(days[i] + 'T00:00:00');
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }
  return best;
}

// 总打卡次数。
function totalDone(h) { return Object.keys(h.dates).length; }

// 最近 n 天里打了几次卡（用于本周/本月完成率）。
function doneInLastDays(h, n, today = new Date()) {
  let count = 0;
  const d = new Date(today);
  for (let i = 0; i < n; i++) {
    if (h.dates[dayKey(d)]) count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// 把任意数据规范成合法的习惯数组：补齐 id/name/dates，丢弃明显不合法的项。
function normalizeHabits(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(h => h && typeof h === 'object' && !Array.isArray(h)).map((h, idx) => {
    const out = {
      id: (h.id !== undefined && h.id !== null) ? String(h.id) : ('h' + Date.now() + '-' + idx),
      name: (typeof h.name === 'string' && h.name.trim()) ? h.name : '未命名习惯',
      dates: (h.dates && typeof h.dates === 'object' && !Array.isArray(h.dates)) ? h.dates : {},
    };
    if (h.notes && typeof h.notes === 'object' && !Array.isArray(h.notes)) out.notes = h.notes;
    return out;
  });
}

// Node 环境下导出供测试；浏览器里不执行，这些函数仍是全局函数。
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dayKey, currentStreak, bestStreak, totalDone, doneInLastDays, normalizeHabits };
}
