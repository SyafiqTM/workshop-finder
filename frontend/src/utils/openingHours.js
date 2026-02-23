const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toMinutes(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function getWeeklySchedule(opensAt, closesAt) {
  if (!opensAt || !closesAt) {
    return [];
  }

  const saturdayCloseHour = Number(closesAt.split(':')[0]) >= 19 ? '14:00' : '13:00';

  return [
    { key: 'mon-fri', label: 'Mon - Fri', opensAt, closesAt, isClosed: false },
    { key: 'sat', label: 'Saturday', opensAt, closesAt: saturdayCloseHour, isClosed: false },
    { key: 'sun', label: 'Sunday', opensAt: null, closesAt: null, isClosed: true }
  ];
}

export function getOpenStatus(opensAt, closesAt, referenceDate = new Date()) {
  const schedule = getWeeklySchedule(opensAt, closesAt);

  if (!schedule.length) {
    return { isOpen: null, message: 'Hours not available' };
  }

  const day = referenceDate.getDay();

  if (day === 0) {
    return { isOpen: false, message: 'Closed · Opens Monday 09:00' };
  }

  const selectedDay = day === 6 ? schedule[1] : schedule[0];
  const openMinutes = toMinutes(selectedDay.opensAt);
  const closeMinutes = toMinutes(selectedDay.closesAt);
  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;

  if (isOpen) {
    return { isOpen: true, message: `Open · Closes ${selectedDay.closesAt}` };
  }

  if (nowMinutes < openMinutes) {
    return { isOpen: false, message: `Closed · Opens ${selectedDay.opensAt}` };
  }

  const nextDayName = day === 6 ? dayNames[1] : dayNames[day + 1];
  return { isOpen: false, message: `Closed · Opens ${nextDayName} 09:00` };
}
