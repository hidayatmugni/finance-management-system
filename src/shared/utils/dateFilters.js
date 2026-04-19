import dayjs from "dayjs";

export function inDateRange(value, startDate, endDate) {
  if (!value) return false;
  const current = dayjs(value);
  if (startDate && current.isBefore(dayjs(startDate), "day")) return false;
  if (endDate && current.isAfter(dayjs(endDate), "day")) return false;
  return true;
}

export function getTodayRange() {
  const today = dayjs().format("YYYY-MM-DD");
  return { startDate: today, endDate: today };
}

export function getYearMonthRange(year, monthIndex) {
  const start = dayjs().year(year).month(monthIndex).startOf("month");
  const end = start.endOf("month");
  return {
    startDate: start.format("YYYY-MM-DD"),
    endDate: end.format("YYYY-MM-DD")
  };
}
