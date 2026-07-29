import dayjs from "dayjs";
import "dayjs/locale/id";
import { appConfigDefaults } from "../config/appConfigDefaults";

dayjs.locale("id");

/**
 * Accounting period helpers.
 *
 * A family can either use calendar months or a custom cut-off (the original app
 * closed books on the 27th–26th). Every function takes the period config, with
 * the configured default applied when the caller has none — so nothing here
 * hardcodes a cut-off day any more.
 */
function periodConfig(general) {
  const source = general || appConfigDefaults.general;
  return {
    mode: source.bookPeriodMode || "calendar",
    startDay: Number(source.bookPeriodStartDay || 1),
    endDay: Number(source.bookPeriodEndDay || 31)
  };
}

export function inDateRange(value, startDate, endDate) {
  if (!value) return false;
  const current = dayjs(value);
  if (!current.isValid()) return false;
  if (startDate && current.isBefore(dayjs(startDate), "day")) return false;
  if (endDate && current.isAfter(dayjs(endDate), "day")) return false;
  return true;
}

export function getTodayRange() {
  const today = dayjs().format("YYYY-MM-DD");
  return { startDate: today, endDate: today };
}

/**
 * Range covering the book month that *ends* in the given calendar month.
 *
 * @returns {{year:number, monthIndex:number, startDate:string, endDate:string, label:string}}
 */
export function getBookMonthRange(year, monthIndex, general) {
  const { mode, startDay, endDay } = periodConfig(general);
  const monthStart = dayjs(new Date(year, monthIndex, 1));

  if (mode === "calendar") {
    return {
      year,
      monthIndex,
      startDate: monthStart.startOf("month").format("YYYY-MM-DD"),
      endDate: monthStart.endOf("month").format("YYYY-MM-DD"),
      label: monthStart.format("MMMM YYYY")
    };
  }

  // Custom cut-off: the period ends on `endDay` of this month and starts on
  // `startDay` of the previous one.
  const end = monthStart.date(Math.min(endDay, monthStart.daysInMonth()));
  const previous = end.subtract(1, "month");
  const start = previous.date(Math.min(startDay, previous.daysInMonth()));

  return {
    year: end.year(),
    monthIndex: end.month(),
    startDate: start.format("YYYY-MM-DD"),
    endDate: end.format("YYYY-MM-DD"),
    label: `${start.format("DD MMM")} – ${end.format("DD MMM YYYY")}`
  };
}

/** Which book month does this date belong to? */
export function getBookMonthFromDate(value = dayjs(), general) {
  const { mode, startDay } = periodConfig(general);
  const date = dayjs(value);
  if (!date.isValid()) return { year: dayjs().year(), monthIndex: dayjs().month() };

  if (mode === "calendar") {
    return { year: date.year(), monthIndex: date.month() };
  }

  const bookMonth = date.date() >= startDay ? date.add(1, "month") : date;
  return { year: bookMonth.year(), monthIndex: bookMonth.month() };
}

export function getCurrentBookMonthRange(general, referenceDate = dayjs()) {
  const bookMonth = getBookMonthFromDate(referenceDate, general);
  return getBookMonthRange(bookMonth.year, bookMonth.monthIndex, general);
}

export function getPreviousBookMonthRange(general, referenceDate = dayjs()) {
  const bookMonth = getBookMonthFromDate(referenceDate, general);
  const previous = dayjs(new Date(bookMonth.year, bookMonth.monthIndex, 1)).subtract(1, "month");
  return getBookMonthRange(previous.year(), previous.month(), general);
}

export function getBookYearRange(year, general) {
  const start = getBookMonthRange(year, 0, general);
  const end = getBookMonthRange(year, 11, general);
  return { startDate: start.startDate, endDate: end.endDate };
}

export function isInBookMonth(value, year, monthIndex, general) {
  const range = getBookMonthRange(year, monthIndex, general);
  return inDateRange(value, range.startDate, range.endDate);
}

export function isInBookYear(value, year, general) {
  const range = getBookYearRange(year, general);
  return inDateRange(value, range.startDate, range.endDate);
}

/** Presets offered by every date-range picker in the app. */
export function buildRangePresets(general) {
  const today = dayjs();
  const current = getCurrentBookMonthRange(general, today);
  const previous = getPreviousBookMonthRange(general, today);

  return [
    { label: "Hari ini", value: [today, today] },
    { label: "7 hari terakhir", value: [today.subtract(6, "day"), today] },
    { label: "30 hari terakhir", value: [today.subtract(29, "day"), today] },
    { label: "Periode berjalan", value: [dayjs(current.startDate), dayjs(current.endDate)] },
    { label: "Periode lalu", value: [dayjs(previous.startDate), dayjs(previous.endDate)] },
    { label: "Tahun ini", value: [today.startOf("year"), today] }
  ];
}
