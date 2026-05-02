import dayjs from "dayjs";

export const BOOK_PERIOD_START_DAY = 27;
export const BOOK_PERIOD_END_DAY = 26;

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
  return getBookMonthRange(year, monthIndex);
}

export function getBookMonthRange(year, monthIndex) {
  const monthStart = dayjs(`${year}-${String(monthIndex + 1).padStart(2, "0")}-01`);
  const end = monthStart.date(BOOK_PERIOD_END_DAY);
  const start = end.subtract(1, "month").date(BOOK_PERIOD_START_DAY);

  return {
    year: end.year(),
    monthIndex: end.month(),
    startDate: start.format("YYYY-MM-DD"),
    endDate: end.format("YYYY-MM-DD")
  };
}

export function getBookMonthFromDate(value = dayjs()) {
  const date = dayjs(value);
  if (!date.isValid()) return null;

  const bookMonth = date.date() >= BOOK_PERIOD_START_DAY ? date.add(1, "month") : date;
  return {
    year: bookMonth.year(),
    monthIndex: bookMonth.month()
  };
}

export function getCurrentBookMonthRange(referenceDate = dayjs()) {
  const bookMonth = getBookMonthFromDate(referenceDate);
  return getBookMonthRange(bookMonth.year, bookMonth.monthIndex);
}

export function getBookYearRange(year) {
  const start = getBookMonthRange(year, 0);
  const end = getBookMonthRange(year, 11);

  return {
    startDate: start.startDate,
    endDate: end.endDate
  };
}

export function isInBookMonth(value, year, monthIndex) {
  const range = getBookMonthRange(year, monthIndex);
  return inDateRange(value, range.startDate, range.endDate);
}

export function isInBookYear(value, year) {
  const range = getBookYearRange(year);
  return inDateRange(value, range.startDate, range.endDate);
}
