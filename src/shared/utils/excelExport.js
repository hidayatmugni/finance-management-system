import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { buildCategoryBreakdown, buildFinanceSummary, buildMonthlyTrend, buildUserInputSummary } from "./finance";
import { getBookMonthRange, inDateRange, isInBookYear } from "./dateFilters";
import { getKategoriName } from "../config/cashflow";

const COLORS = {
  primary: "FF1E293B",
  secondary: "FF475569",
  muted: "FF64748B",
  income: "FF059669",
  expense: "FFDC2626",
  margin: "FF2563EB",
  warning: "FFD97706",
  purple: "FF7C3AED",
  teal: "FF0F766E",
  bgIncome: "FFECFDF5",
  bgExpense: "FFFEF2F2",
  bgNeutral: "FFF8FAFC",
  bgAccent: "FFEFF6FF",
  border: "FFE2E8F0",
  text: "FF0F172A",
  white: "FFFFFFFF"
};

const TYPE_TONES = {
  income: {
    label: "Pemasukan",
    header: COLORS.income,
    soft: COLORS.bgIncome
  },
  expense: {
    label: "Pengeluaran",
    header: COLORS.expense,
    soft: COLORS.bgExpense
  }
};

const USER_BANDS = [COLORS.primary, COLORS.teal, COLORS.purple, COLORS.warning, COLORS.margin];
const RIGHT_PANEL_START_COLUMN = 8;
const RIGHT_PANEL_END_COLUMN = 13;

function applyCellBorder(cell) {
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } }
  };
}

function styleRangeBorder(sheet, rowNumber, fromColumn, toColumn) {
  for (let column = fromColumn; column <= toColumn; column += 1) {
    applyCellBorder(sheet.getCell(rowNumber, column));
  }
}

function styleHeaderRange(sheet, rowNumber, fromColumn, toColumn, fillColor) {
  const row = sheet.getRow(rowNumber);
  row.height = 20;

  for (let column = fromColumn; column <= toColumn; column += 1) {
    const cell = sheet.getCell(rowNumber, column);
    cell.font = { bold: true, color: { argb: COLORS.white }, size: 9, name: "Segoe UI" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  }
}

function styleBodyRow(sheet, rowNumber, fromColumn, toColumn, currencyColumns = []) {
  const row = sheet.getRow(rowNumber);
  row.height = 19;

  for (let column = fromColumn; column <= toColumn; column += 1) {
    const cell = sheet.getCell(rowNumber, column);
    cell.font = { size: 9, color: { argb: COLORS.text }, name: "Segoe UI" };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    applyCellBorder(cell);

    if (currencyColumns.includes(column) && typeof cell.value === "number") {
      cell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';
      cell.alignment = { vertical: "middle", horizontal: "right" };
    }
  }
}

function styleTotalRow(sheet, rowNumber, tone, label, value) {
  sheet.mergeCells(rowNumber, 1, rowNumber, 5);

  const labelCell = sheet.getCell(rowNumber, 1);
  const valueCell = sheet.getCell(rowNumber, 6);

  labelCell.value = label;
  valueCell.value = value;
  valueCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';

  for (let column = 1; column <= 6; column += 1) {
    const cell = sheet.getCell(rowNumber, column);
    cell.font = { bold: true, size: 9, color: { argb: tone.header }, name: "Segoe UI" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tone.soft } };
    cell.alignment = { vertical: "middle", horizontal: column === 6 ? "right" : "left" };
    applyCellBorder(cell);
  }
}

function setColumnWidths(sheet, widths) {
  sheet.columns = widths.map((width) => ({ width }));
}

function sumAmount(items) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function buildAsciiBar(value, maxValue, maxChars = 18) {
  if (!value || !maxValue) return "";
  const length = Math.max(1, Math.round((Number(value || 0) / maxValue) * maxChars));
  return "|".repeat(length);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCategoryBreakdownRows(items, limit = 5) {
  const grouped = new Map();

  items.forEach((item) => {
    const key = item.categoryName || getKategoriName(item.categoryId) || "Tanpa kategori";
    grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
  });

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}

function writeMergedCell(sheet, rowNumber, fromColumn, toColumn, value, options = {}) {
  if (fromColumn !== toColumn) {
    sheet.mergeCells(rowNumber, fromColumn, rowNumber, toColumn);
  }

  const anchor = sheet.getCell(rowNumber, fromColumn);
  anchor.value = value;
  anchor.font = {
    bold: Boolean(options.bold),
    size: options.size || 9,
    color: { argb: options.fontColor || COLORS.text },
    name: "Segoe UI"
  };
  anchor.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: options.fill || COLORS.white }
  };
  anchor.alignment = {
    vertical: "middle",
    horizontal: options.horizontal || "left",
    wrapText: options.wrapText ?? true
  };

  if (options.numFmt) {
    anchor.numFmt = options.numFmt;
  }

  for (let column = fromColumn; column <= toColumn; column += 1) {
    applyCellBorder(sheet.getCell(rowNumber, column));
  }
}

function renderCategorySummaryCard(sheet, startRow, { title, items, type }) {
  const tone = TYPE_TONES[type];
  const rows = buildCategoryBreakdownRows(items, 5);
  const total = sumAmount(items);
  const maxCategory = Math.max(...rows.map((item) => item.value), 1);
  let currentRow = startRow;

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_END_COLUMN, title, {
    fill: COLORS.secondary,
    fontColor: COLORS.white,
    bold: true
  });
  currentRow += 1;

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_START_COLUMN + 2, `Total ${tone.label}`, {
    fill: tone.soft,
    fontColor: tone.header,
    bold: true
  });
  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 3, RIGHT_PANEL_END_COLUMN, total, {
    fill: tone.soft,
    fontColor: tone.header,
    bold: true,
    horizontal: "right",
    numFmt: '"Rp"#,##0;[Red]-"Rp"#,##0'
  });
  currentRow += 1;

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_START_COLUMN + 2, "Jumlah transaksi", {
    fill: COLORS.bgNeutral,
    fontColor: COLORS.muted
  });
  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 3, RIGHT_PANEL_END_COLUMN, items.length, {
    fill: COLORS.bgNeutral,
    fontColor: COLORS.text,
    bold: true,
    horizontal: "right",
    numFmt: "#,##0"
  });
  currentRow += 1;

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_END_COLUMN, "Bar kategori terbesar", {
    fill: COLORS.bgAccent,
    fontColor: COLORS.secondary,
    bold: true
  });
  currentRow += 1;

  if (!rows.length) {
    writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_END_COLUMN, "Belum ada kategori", {
      fill: COLORS.white,
      fontColor: COLORS.muted,
      horizontal: "center"
    });
    currentRow += 1;
  } else {
    rows.forEach((item) => {
      writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_START_COLUMN + 1, item.name, {
        fill: COLORS.white,
        fontColor: COLORS.text
      });
      writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 2, RIGHT_PANEL_START_COLUMN + 3, item.value, {
        fill: COLORS.white,
        fontColor: tone.header,
        bold: true,
        horizontal: "right",
        numFmt: '"Rp"#,##0'
      });
      writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 4, RIGHT_PANEL_END_COLUMN, buildAsciiBar(item.value, maxCategory), {
        fill: tone.soft,
        fontColor: tone.header,
        bold: true,
        horizontal: "left",
        wrapText: false
      });
      currentRow += 1;
    });
  }

  return currentRow + 1;
}

function renderUserComparisonPanel(sheet, startRow, userBreakdown) {
  let currentRow = startRow;
  const rows = userBreakdown
    .map((item) => ({
      name: item.name,
      income: sumAmount(item.income),
      expense: sumAmount(item.expense)
    }))
    .map((item) => ({
      ...item,
      net: item.income - item.expense
    }))
    .sort((left, right) => right.expense - left.expense)
    .slice(0, 5);
  const maxValue = Math.max(...rows.flatMap((item) => [item.income, item.expense]), 1);

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_END_COLUMN, "Comparison total per user", {
    fill: COLORS.primary,
    fontColor: COLORS.white,
    bold: true
  });
  currentRow += 1;

  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_START_COLUMN + 1, "User", {
    fill: COLORS.secondary,
    fontColor: COLORS.white,
    bold: true,
    horizontal: "center"
  });
  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 2, RIGHT_PANEL_START_COLUMN + 3, "In / Out", {
    fill: COLORS.secondary,
    fontColor: COLORS.white,
    bold: true,
    horizontal: "center"
  });
  writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 4, RIGHT_PANEL_END_COLUMN, "Bar", {
    fill: COLORS.secondary,
    fontColor: COLORS.white,
    bold: true,
    horizontal: "center"
  });
  currentRow += 1;

  if (!rows.length) {
    writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_END_COLUMN, "Belum ada data user", {
      fill: COLORS.bgNeutral,
      fontColor: COLORS.muted,
      horizontal: "center"
    });
    return currentRow + 2;
  }

  rows.forEach((item) => {
    writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN, RIGHT_PANEL_START_COLUMN + 1, item.name, {
      fill: COLORS.white,
      fontColor: COLORS.text,
      bold: true
    });
    writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 2, RIGHT_PANEL_START_COLUMN + 3, `${formatCompactCurrency(item.income)} / ${formatCompactCurrency(item.expense)}`, {
      fill: COLORS.white,
      fontColor: item.net >= 0 ? COLORS.margin : COLORS.expense,
      bold: true,
      horizontal: "right"
    });
    writeMergedCell(sheet, currentRow, RIGHT_PANEL_START_COLUMN + 4, RIGHT_PANEL_END_COLUMN, `I ${buildAsciiBar(item.income, maxValue, 9)} O ${buildAsciiBar(item.expense, maxValue, 9)}`, {
      fill: COLORS.bgNeutral,
      fontColor: COLORS.secondary,
      bold: true,
      wrapText: false
    });
    currentRow += 1;
  });

  return currentRow + 1;
}

function downloadBuffer(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

function addKpiBlock(sheet, startRow, startColumn, title, value, color, columnSpan = 3) {
  const endColumn = startColumn + columnSpan - 1;
  sheet.mergeCells(startRow, startColumn, startRow, endColumn);
  sheet.mergeCells(startRow + 1, startColumn, startRow + 2, endColumn);

  const titleCell = sheet.getCell(startRow, startColumn);
  const valueCell = sheet.getCell(startRow + 1, startColumn);

  titleCell.value = title.toUpperCase();
  titleCell.font = { bold: true, size: 9, color: { argb: COLORS.secondary }, name: "Segoe UI" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bgNeutral } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  valueCell.value = value;
  valueCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';
  valueCell.font = { bold: true, size: 15, color: { argb: color }, name: "Segoe UI" };
  valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } };
  valueCell.alignment = { vertical: "middle", horizontal: "center" };

  for (let row = startRow; row <= startRow + 2; row += 1) {
    styleRangeBorder(sheet, row, startColumn, endColumn);
  }
}

function addMergedBand(sheet, rowNumber, fromColumn, toColumn, title, fillColor = COLORS.primary, fontColor = COLORS.white) {
  sheet.mergeCells(rowNumber, fromColumn, rowNumber, toColumn);
  const cell = sheet.getCell(rowNumber, fromColumn);
  cell.value = title;
  cell.font = { bold: true, size: 10, color: { argb: fontColor }, name: "Segoe UI" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  sheet.getRow(rowNumber).height = 21;
  styleRangeBorder(sheet, rowNumber, fromColumn, toColumn);
}

function getUserMonthlyBreakdown(monthTransactions) {
  const grouped = new Map();

  monthTransactions.forEach((item) => {
    const key = item.memberName || item.userId || "Tanpa nama";
    const current = grouped.get(key) || {
      name: key,
      income: [],
      expense: []
    };

    if (item.type === "income") {
      current.income.push(item);
    }

    if (item.type === "expense") {
      current.expense.push(item);
    }

    grouped.set(key, current);
  });

  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

async function renderTransactionTable(workbook, sheet, startRow, {
  title,
  items,
  type,
  emptyText,
  showUserColumn = true,
  headerColor,
  sideCardTitle
}) {
  const tone = TYPE_TONES[type];
  const typeLabel = tone.label;
  const lastColumn = showUserColumn ? 6 : 5;
  const amountColumn = showUserColumn ? 6 : 5;
  const typeColumn = showUserColumn ? 3 : 2;
  const categoryColumn = showUserColumn ? 4 : 3;
  const noteColumn = showUserColumn ? 5 : 4;
  const tableHeaderColor = headerColor || tone.header;

  addMergedBand(sheet, startRow, 1, lastColumn, title, tableHeaderColor);

  const headerRowNumber = startRow + 1;
  sheet.getRow(headerRowNumber).values = showUserColumn
    ? ["Tanggal", "User", "Jenis", "Kategori", "Catatan", "Nominal"]
    : ["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal"];

  styleHeaderRange(sheet, headerRowNumber, 1, lastColumn, tableHeaderColor);

  let currentRow = headerRowNumber + 1;

  if (items.length) {
    items.forEach((item) => {
      const row = sheet.getRow(currentRow);
      row.values = [
        dayjs(item.date).format("DD MMM YYYY"),
        ...(showUserColumn ? [item.memberName || "Tanpa nama"] : []),
        typeLabel,
        item.categoryName || getKategoriName(item.categoryId),
        item.note || item.title || "-",
        Number(item.amount || 0)
      ];

      styleBodyRow(sheet, currentRow, 1, lastColumn, [amountColumn]);

      const typeCell = sheet.getCell(currentRow, typeColumn);
      typeCell.font = { bold: true, size: 9, color: { argb: tone.header }, name: "Segoe UI" };
      typeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tone.soft } };
      typeCell.alignment = { vertical: "middle", horizontal: "center" };

      sheet.getCell(currentRow, categoryColumn).alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true
      };

      sheet.getCell(currentRow, noteColumn).alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: true
      };

      const amountCell = sheet.getCell(currentRow, amountColumn);
      amountCell.font = { bold: true, size: 9, color: { argb: tone.header }, name: "Segoe UI" };

      currentRow += 1;
    });
  } else {
    sheet.mergeCells(currentRow, 1, currentRow, lastColumn);

    const emptyCell = sheet.getCell(currentRow, 1);
    emptyCell.value = emptyText || `Tidak ada transaksi ${typeLabel.toLowerCase()}`;
    emptyCell.font = { italic: true, size: 9, color: { argb: COLORS.muted }, name: "Segoe UI" };
    emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tone.soft } };
    emptyCell.alignment = { vertical: "middle", horizontal: "center" };

    styleRangeBorder(sheet, currentRow, 1, lastColumn);
    currentRow += 1;
  }

  if (showUserColumn) {
    styleTotalRow(sheet, currentRow, tone, `Total ${typeLabel}`, sumAmount(items));
  } else {
    sheet.mergeCells(currentRow, 1, currentRow, 4);

    const labelCell = sheet.getCell(currentRow, 1);
    const valueCell = sheet.getCell(currentRow, 5);

    labelCell.value = `Total ${typeLabel}`;
    valueCell.value = sumAmount(items);
    valueCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';

    for (let column = 1; column <= 5; column += 1) {
      const cell = sheet.getCell(currentRow, column);
      cell.font = { bold: true, size: 9, color: { argb: tone.header }, name: "Segoe UI" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: tone.soft } };
      cell.alignment = {
        vertical: "middle",
        horizontal: column === 5 ? "right" : "left"
      };
      applyCellBorder(cell);
    }
  }

  const nextRow = currentRow + 2;

  if (!sideCardTitle) {
    return nextRow;
  }

  const sideCardNextRow = await addSideCategoryChart(workbook, sheet, startRow, {
    title: sideCardTitle,
    items,
    type
  });

  return Math.max(nextRow, sideCardNextRow);
}

function buildSideCategoryChartSvg({ title, items, type }) {
  const tone = TYPE_TONES[type];
  const width = 430;
  const height = 210;

  const padding = {
    top: 44,
    right: 22,
    bottom: 44,
    left: 54
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const rows = buildCategoryBreakdownRows(items, 6);
  const values = rows.map((item) => Number(item.value || 0));
  const maxValue = Math.max(...values, 1);

  const barColor = `#${tone.header.slice(2)}`;
  const gridColor = `#${COLORS.border.slice(2)}`;
  const textColor = `#${COLORS.text.slice(2)}`;
  const mutedColor = `#${COLORS.muted.slice(2)}`;

  const yFor = (value) =>
    padding.top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padding.top + plotHeight - ratio * plotHeight;
      const value = maxValue * ratio;

      return `
        <line 
          x1="${padding.left}" 
          y1="${y}" 
          x2="${width - padding.right}" 
          y2="${y}" 
          stroke="${gridColor}" 
          stroke-width="1" 
        />
        <text 
          x="${padding.left - 8}" 
          y="${y + 4}" 
          text-anchor="end" 
          font-family="Segoe UI, Arial" 
          font-size="9" 
          fill="${mutedColor}"
        >
          ${formatCompactCurrency(value)}
        </text>
      `;
    })
    .join("");

  const bars = rows.length
    ? rows
        .map((item, index) => {
          const groupWidth = plotWidth / rows.length;
          const center = padding.left + index * groupWidth + groupWidth / 2;
          const barWidth = Math.min(22, groupWidth * 0.42);
          const value = Number(item.value || 0);
          const y = yFor(value);
          const barHeight = padding.top + plotHeight - y;

          const label =
            item.name.length > 8
              ? `${item.name.slice(0, 7)}…`
              : item.name;

          return `
            <rect 
              x="${center - barWidth / 2}" 
              y="${y}" 
              width="${barWidth}" 
              height="${barHeight}" 
              rx="3" 
              fill="${barColor}" 
            />
            <text 
              x="${center}" 
              y="${height - 24}" 
              text-anchor="middle" 
              font-family="Segoe UI, Arial" 
              font-size="9" 
              fill="${mutedColor}"
            >
              ${escapeXml(label)}
            </text>
          `;
        })
        .join("")
    : `
      <text 
        x="${width / 2}" 
        y="${height / 2}" 
        text-anchor="middle" 
        font-family="Segoe UI, Arial" 
        font-size="12" 
        fill="${mutedColor}"
      >
        Belum ada data
      </text>
    `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#ffffff" />

      <text 
        x="16" 
        y="22" 
        font-family="Segoe UI, Arial" 
        font-weight="700" 
        font-size="12" 
        fill="${textColor}"
      >
        ${escapeXml(title)}
      </text>

      <circle 
        cx="${width - 108}" 
        cy="18" 
        r="4" 
        fill="${barColor}" 
      />

      <text 
        x="${width - 98}" 
        y="22" 
        font-family="Segoe UI, Arial" 
        font-size="9" 
        fill="${mutedColor}"
      >
        ${tone.label}
      </text>

      ${gridLines}

      <line 
        x1="${padding.left}" 
        y1="${padding.top + plotHeight}" 
        x2="${width - padding.right}" 
        y2="${padding.top + plotHeight}" 
        stroke="${gridColor}" 
        stroke-width="1.2" 
      />

      ${bars}
    </svg>
  `;
}

async function addSideCategoryChart(workbook, sheet, startRow, { title, items, type }) {
  const width = 430;
  const height = 210;

  const svg = buildSideCategoryChartSvg({
    title,
    items,
    type
  });

  const chartImage = await createPngDataUrlFromSvg(svg, width, height);

  if (!chartImage) {
    return renderCategorySummaryCard(sheet, startRow, {
      title,
      items,
      type
    });
  }

  const imageId = workbook.addImage({
    base64: chartImage,
    extension: "png"
  });

  sheet.addImage(imageId, {
    tl: {
      col: RIGHT_PANEL_START_COLUMN - 1,
      row: startRow - 1
    },
    ext: {
      width,
      height
    }
  });

  return startRow + 12;
}

function buildMonthlyChartSvg(trend, numericYear) {
  const width = 900;
  const height = 320;
  const padding = { top: 54, right: 30, bottom: 54, left: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = trend.flatMap((item) => [Number(item.income || 0), Number(item.expense || 0)]);
  const maxValue = Math.max(...values, 1);
  const groupWidth = plotWidth / trend.length;
  const barWidth = Math.min(18, groupWidth / 4);
  const incomeColor = `#${COLORS.income.slice(2)}`;
  const expenseColor = `#${COLORS.expense.slice(2)}`;
  const gridColor = `#${COLORS.border.slice(2)}`;
  const textColor = `#${COLORS.text.slice(2)}`;
  const mutedColor = `#${COLORS.muted.slice(2)}`;

  const yFor = (value) => padding.top + plotHeight - (Number(value || 0) / maxValue) * plotHeight;
  const bars = trend.map((item, index) => {
    const groupLeft = padding.left + index * groupWidth;
    const center = groupLeft + groupWidth / 2;
    const incomeHeight = padding.top + plotHeight - yFor(item.income);
    const expenseHeight = padding.top + plotHeight - yFor(item.expense);
    const label = String(item.month || "");

    return `
      <rect x="${center - barWidth - 2}" y="${yFor(item.income)}" width="${barWidth}" height="${incomeHeight}" rx="3" fill="${incomeColor}" />
      <rect x="${center + 2}" y="${yFor(item.expense)}" width="${barWidth}" height="${expenseHeight}" rx="3" fill="${expenseColor}" />
      <text x="${center}" y="${height - 28}" text-anchor="middle" font-family="Segoe UI, Arial" font-size="12" fill="${mutedColor}">${label}</text>
    `;
  }).join("");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + plotHeight - ratio * plotHeight;
    const value = maxValue * ratio;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${gridColor}" stroke-width="1" />
      <text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-family="Segoe UI, Arial" font-size="11" fill="${mutedColor}">${formatCompactCurrency(value)}</text>
    `;
  }).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
      <text x="28" y="30" font-family="Segoe UI, Arial" font-weight="700" font-size="18" fill="${textColor}">Comparison per bulan ${numericYear}</text>
      <circle cx="646" cy="25" r="6" fill="${incomeColor}" />
      <text x="660" y="29" font-family="Segoe UI, Arial" font-size="12" fill="${mutedColor}">Pemasukan</text>
      <circle cx="752" cy="25" r="6" fill="${expenseColor}" />
      <text x="766" y="29" font-family="Segoe UI, Arial" font-size="12" fill="${mutedColor}">Pengeluaran</text>
      ${gridLines}
      <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${width - padding.right}" y2="${padding.top + plotHeight}" stroke="${gridColor}" stroke-width="1.3" />
      ${bars}
    </svg>
  `;
}

async function createPngDataUrlFromSvg(svg, width, height) {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof Image === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  if (!canvas?.getContext) return null;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const encodedSvg = new TextEncoder().encode(svg);
  let binary = "";
  encodedSvg.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = `data:image/svg+xml;base64,${window.btoa(binary)}`;
  });
}

async function addMonthlyComparisonChart(workbook, sheet, trend, numericYear) {
  const width = 900;
  const height = 320;
  const svg = buildMonthlyChartSvg(trend, numericYear);
  const chartImage = await createPngDataUrlFromSvg(svg, width, height);

  if (!chartImage) {
    addMergedBand(sheet, 8, 7, 12, "Chart bar akan tampil saat export dari browser.", COLORS.bgAccent, COLORS.text);
    return;
  }

  const imageId = workbook.addImage({
    base64: chartImage,
    extension: "png"
  });

  sheet.addImage(imageId, {
    tl: { col: 6.1, row: 7.2 },
    ext: { width: 560, height: 220 }
  });
}

async function buildDashboardSheet({ workbook, familyName, numericYear, summary, trend, categories, users }) {
  const sheet = workbook.addWorksheet("Dashboard", {
    views: [{ state: "frozen", ySplit: 7, showGridLines: false }]
  });

  setColumnWidths(sheet, [14, 16, 16, 14, 18, 3, 14, 14, 14, 14, 14, 14]);

  sheet.mergeCells("A1:L2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${familyName || "Mugni Finance"} - Ringkasan Tahunan ${numericYear}`;
  titleCell.font = { bold: true, size: 15, color: { argb: COLORS.white }, name: "Segoe UI" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  addKpiBlock(sheet, 4, 1, "Total Pemasukan", summary.incomeMonth, COLORS.income);
  addKpiBlock(sheet, 4, 4, "Total Pengeluaran", summary.expenseMonth, COLORS.expense);
  addKpiBlock(sheet, 4, 7, "Arus Kas Bersih", summary.netCashflow, COLORS.margin);
  addKpiBlock(sheet, 4, 10, "Jumlah Transaksi", users.reduce((total, item) => total + Number(item.count || 0), 0), COLORS.primary);
  sheet.getCell("J5").numFmt = "#,##0";

  addMergedBand(sheet, 8, 1, 5, "Comparison per bulan - periode tutup buku 27 sampai 26", COLORS.secondary);
  sheet.getRow(9).values = ["Bulan", "Periode", "Pemasukan", "Pengeluaran", "Arus Kas"];
  styleHeaderRange(sheet, 9, 1, 5, COLORS.secondary);

  trend.forEach((item, index) => {
    const rowNumber = 10 + index;
    const range = getBookMonthRange(numericYear, index);
    const netCashflow = Number(item.income || 0) - Number(item.expense || 0);
    const row = sheet.getRow(rowNumber);
    row.values = [
      item.month,
      `${dayjs(range.startDate).format("DD MMM")} - ${dayjs(range.endDate).format("DD MMM")}`,
      Number(item.income || 0),
      Number(item.expense || 0),
      netCashflow
    ];

    styleBodyRow(sheet, rowNumber, 1, 5, [3, 4, 5]);
    sheet.getCell(rowNumber, 3).font = { bold: true, size: 9, color: { argb: COLORS.income }, name: "Segoe UI" };
    sheet.getCell(rowNumber, 4).font = { bold: true, size: 9, color: { argb: COLORS.expense }, name: "Segoe UI" };
    sheet.getCell(rowNumber, 5).font = { bold: true, size: 9, color: { argb: netCashflow >= 0 ? COLORS.margin : COLORS.expense }, name: "Segoe UI" };
  });

  await addMonthlyComparisonChart(workbook, sheet, trend, numericYear);

  const categoryStartRow = 24;
  addMergedBand(sheet, categoryStartRow, 1, 5, "Kategori pengeluaran terbesar", COLORS.expense);
  sheet.getRow(categoryStartRow + 1).values = ["Kategori", "Nominal", "", "", ""];
  styleHeaderRange(sheet, categoryStartRow + 1, 1, 5, COLORS.expense);
  categories.slice(0, 6).forEach((item, index) => {
    const rowNumber = categoryStartRow + 2 + index;
    sheet.getRow(rowNumber).values = [item.name, Number(item.value || 0)];
    styleBodyRow(sheet, rowNumber, 1, 5, [2]);
    sheet.mergeCells(rowNumber, 2, rowNumber, 5);
    sheet.getCell(rowNumber, 2).alignment = { vertical: "middle", horizontal: "right" };
  });

  addMergedBand(sheet, categoryStartRow, 7, 12, "Ringkasan penginput", COLORS.income);
  sheet.getRow(categoryStartRow + 1).getCell(7).value = "User";
  sheet.getRow(categoryStartRow + 1).getCell(8).value = "Pemasukan";
  sheet.getRow(categoryStartRow + 1).getCell(9).value = "Pengeluaran";
  sheet.getRow(categoryStartRow + 1).getCell(10).value = "Jumlah";
  styleHeaderRange(sheet, categoryStartRow + 1, 7, 12, COLORS.income);

  users.slice(0, 6).forEach((item, index) => {
    const rowNumber = categoryStartRow + 2 + index;
    sheet.getRow(rowNumber).getCell(7).value = item.name;
    sheet.getRow(rowNumber).getCell(8).value = Number(item.income || 0);
    sheet.getRow(rowNumber).getCell(9).value = Number(item.expense || 0);
    sheet.getRow(rowNumber).getCell(10).value = Number(item.count || 0);
    styleBodyRow(sheet, rowNumber, 7, 12, [8, 9]);
    sheet.mergeCells(rowNumber, 10, rowNumber, 12);
    sheet.getCell(rowNumber, 8).font = { bold: true, size: 9, color: { argb: COLORS.income }, name: "Segoe UI" };
    sheet.getCell(rowNumber, 9).font = { bold: true, size: 9, color: { argb: COLORS.expense }, name: "Segoe UI" };
    sheet.getCell(rowNumber, 10).alignment = { vertical: "middle", horizontal: "center" };
  });
}

async function buildMonthSheet({ workbook, numericYear, monthIndex, monthTransactions }) {
  const monthDate = dayjs().year(numericYear).month(monthIndex);
  const monthRange = getBookMonthRange(numericYear, monthIndex);

  const sheet = workbook.addWorksheet(monthDate.format("MMM"), {
    views: [{ state: "frozen", ySplit: 6, showGridLines: false }]
  });

  setColumnWidths(sheet, [15, 18, 13, 20, 40, 16, 3, 15, 15, 15, 12, 12, 18]);

  const summary = buildFinanceSummary(monthTransactions, {
    year: numericYear,
    month: monthIndex
  });

  const incomeTransactions = monthTransactions.filter((item) => item.type === "income");
  const expenseTransactions = monthTransactions.filter((item) => item.type === "expense");
  const userBreakdown = getUserMonthlyBreakdown(monthTransactions);

  sheet.mergeCells("A1:F1");

  const title = sheet.getCell("A1");
  title.value = `Laporan ${monthDate.format("MMMM")} ${numericYear} (${dayjs(monthRange.startDate).format("DD MMM")} - ${dayjs(monthRange.endDate).format("DD MMM")})`;
  title.font = { bold: true, size: 14, color: { argb: COLORS.white }, name: "Segoe UI" };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
  title.alignment = { vertical: "middle", horizontal: "center" };

  sheet.getRow(1).height = 24;
  styleRangeBorder(sheet, 1, 1, 6);

  addKpiBlock(sheet, 3, 1, "Pemasukan", summary.incomeMonth, COLORS.income, 2);
  addKpiBlock(sheet, 3, 3, "Pengeluaran", summary.expenseMonth, COLORS.expense, 2);
  addKpiBlock(sheet, 3, 5, "Arus Kas Bersih", summary.netCashflow, COLORS.margin, 2);

  renderUserComparisonPanel(sheet, 1, userBreakdown);

  let currentRow = 8;

  currentRow = await renderTransactionTable(workbook, sheet, currentRow, {
    title: "Global Detail Pemasukan",
    items: incomeTransactions,
    type: "income",
    sideCardTitle: "Chart global pemasukan"
  });

  currentRow = await renderTransactionTable(workbook, sheet, currentRow, {
    title: "Global Detail Pengeluaran",
    items: expenseTransactions,
    type: "expense",
    sideCardTitle: "Chart global pengeluaran"
  });

  addMergedBand(sheet, currentRow, 1, 13, "Detail transaksi per user", COLORS.primary);
  currentRow += 2;

  for (let index = 0; index < userBreakdown.length; index += 1) {
    const userGroup = userBreakdown[index];
    const bandColor = USER_BANDS[index % USER_BANDS.length];

    addMergedBand(
      sheet,
      currentRow,
      1,
      6,
      `User: ${userGroup.name} | Pemasukan ${formatCurrency(sumAmount(userGroup.income))} | Pengeluaran ${formatCurrency(sumAmount(userGroup.expense))}`,
      bandColor
    );

    currentRow += 1;

    currentRow = await renderTransactionTable(workbook, sheet, currentRow, {
      title: `Detail Pemasukan - ${userGroup.name}`,
      items: userGroup.income,
      type: "income",
      showUserColumn: false,
      headerColor: COLORS.secondary,
      sideCardTitle: `Chart pemasukan ${userGroup.name}`
    });

    currentRow = await renderTransactionTable(workbook, sheet, currentRow, {
      title: `Detail Pengeluaran - ${userGroup.name}`,
      items: userGroup.expense,
      type: "expense",
      showUserColumn: false,
      headerColor: COLORS.secondary,
      sideCardTitle: `Chart pengeluaran ${userGroup.name}`
    });
  }
}

export async function exportLaporanTahunanExcel({ year, transactions, familyName }) {
  const numericYear = Number(year);
  const yearlyTransactions = transactions.filter((item) => isInBookYear(item.date, numericYear));
  const summary = buildFinanceSummary(yearlyTransactions, { year: numericYear, month: null });
  const trend = buildMonthlyTrend(yearlyTransactions, { year: numericYear });
  const categories = buildCategoryBreakdown(yearlyTransactions);
  const users = buildUserInputSummary(yearlyTransactions);
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Mugni Finance";
  workbook.created = new Date();
  workbook.modified = new Date();

  await buildDashboardSheet({
    workbook,
    familyName,
    numericYear,
    summary,
    trend,
    categories,
    users
  });

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const range = getBookMonthRange(numericYear, monthIndex);

    const monthTransactions = yearlyTransactions.filter((item) =>
      inDateRange(item.date, range.startDate, range.endDate)
    );

    if (!monthTransactions.length) continue;

    await buildMonthSheet({
      workbook,
      numericYear,
      monthIndex,
      monthTransactions
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `laporan-keuangan-${numericYear}.xlsx`);
}
