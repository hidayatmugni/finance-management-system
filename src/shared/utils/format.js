import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value || 0);
}

export function formatAxisCurrency(value) {
  const compact = new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value || 0);

  return compact.replace(" ", " ");
}

export function formatDate(value, pattern = "DD MMM YYYY") {
  return dayjs(value).format(pattern);
}
