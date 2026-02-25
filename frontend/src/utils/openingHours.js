const DAY_KEYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function getWeeklySchedule(opensAt, closesAt, scheduleJson) {
  // Per-day schedule takes priority when available
  if (scheduleJson) {
    try {
      const parsed = typeof scheduleJson === 'string' ? JSON.parse(scheduleJson) : scheduleJson;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return days.map((day) => {
        const entry = parsed[day];
        if (!entry || entry.off) return { key: day.toLowerCase(), label: day, opensAt: null, closesAt: null, isClosed: true };
        return { key: day.toLowerCase(), label: day, opensAt: entry.opensAt, closesAt: entry.closesAt, isClosed: false };
      });
    } catch {
      // fall through to legacy
    }
  }

  if (!opensAt || !closesAt) return [];

  const saturdayCloseHour = Number(closesAt.split(':')[0]) >= 19 ? '14:00' : '13:00';

  return [
    { key: 'mon-fri', label: 'Mon - Fri', opensAt, closesAt, isClosed: false },
    { key: 'sat', label: 'Saturday', opensAt, closesAt: saturdayCloseHour, isClosed: false },
    { key: 'sun', label: 'Sunday', opensAt: null, closesAt: null, isClosed: true }
  ];
}

export function getOpenStatus(opensAt, closesAt, referenceDate = new Date(), scheduleJson) {
  const schedule = getWeeklySchedule(opensAt, closesAt, scheduleJson);
  if (!schedule.length) return { isOpen: null, message: 'Hours not available' };

  const dayIndex = referenceDate.getDay(); // 0=Sun
  const todayName = DAY_KEYS[dayIndex];

  // Per-day schedule path
  if (scheduleJson) {
    const todayEntry = schedule.find((d) => d.label === todayName);
    if (!todayEntry || todayEntry.isClosed) {
      // Find next open day
      for (let i = 1; i <= 7; i++) {
        const next = schedule.find((d) => d.label === DAY_KEYS[(dayIndex + i) % 7]);
        if (next && !next.isClosed) return { isOpen: false, message: `Closed · Opens ${next.label} ${next.opensAt}` };
      }
      return { isOpen: false, message: 'Closed' };
    }
    const openMinutes = toMinutes(todayEntry.opensAt);
    const closeMinutes = toMinutes(todayEntry.closesAt);
    const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
    if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) return { isOpen: true, message: `Open · Closes ${todayEntry.closesAt}` };
    if (nowMinutes < openMinutes) return { isOpen: false, message: `Closed · Opens ${todayEntry.opensAt}` };
    for (let i = 1; i <= 7; i++) {
      const next = schedule.find((d) => d.label === DAY_KEYS[(dayIndex + i) % 7]);
      if (next && !next.isClosed) return { isOpen: false, message: `Closed · Opens ${next.label} ${next.opensAt}` };
    }
    return { isOpen: false, message: 'Closed' };
  }

  // Legacy path
  if (dayIndex === 0) return { isOpen: false, message: 'Closed · Opens Monday 09:00' };
  const selectedDay = dayIndex === 6 ? schedule[1] : schedule[0];
  const openMinutes = toMinutes(selectedDay.opensAt);
  const closeMinutes = toMinutes(selectedDay.closesAt);
  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  if (isOpen) return { isOpen: true, message: `Open · Closes ${selectedDay.closesAt}` };
  if (nowMinutes < openMinutes) return { isOpen: false, message: `Closed · Opens ${selectedDay.opensAt}` };
  const nextDayName = dayIndex === 6 ? DAY_KEYS[1] : DAY_KEYS[dayIndex + 1];
  return { isOpen: false, message: `Closed · Opens ${nextDayName} 09:00` };
}
