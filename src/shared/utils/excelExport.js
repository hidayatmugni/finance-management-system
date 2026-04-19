import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { buildCategoryBreakdown, buildFinanceSummary, buildMonthlyTrend, buildUserInputSummary } from "./finance";
import { getJenisLabel, getKategoriName } from "../config/cashflow";

const COLORS = {
  maroon: "FF7C2D3B",
  green: "FF2F8F57",
  red: "FFCF4B4B",
  gold: "FFB87A25",
  plum: "FF8B5C7E",
  teal: "FF2B7A78",
  blueSoft: "FFF1F5FF",
  graySoft: "FFF3F4F6",
  greenSoft: "FFEAF6EF",
  redSoft: "FFFBECEC",
  goldSoft: "FFFFF3E2",
  plumSoft: "FFF7EEF3",
  tealSoft: "FFEAF7F6",
  border: "FF6B555B",
  text: "FF24181A",
  muted: "FF7B666A",
  white: "FFFFFFFF"
};

const USER_TABLE_COLORS = [
  { strong: COLORS.maroon, soft: COLORS.blueSoft },
  { strong: COLORS.teal, soft: COLORS.tealSoft },
  { strong: COLORS.gold, soft: COLORS.goldSoft },
  { strong: COLORS.plum, soft: COLORS.plumSoft }
];

function applyCellBorder(cell) {
  cell.border = {
    top: { style: "thin", color: { argb: COLORS.border } },
    left: { style: "thin", color: { argb: COLORS.border } },
    bottom: { style: "thin", color: { argb: COLORS.border } },
    right: { style: "thin", color: { argb: COLORS.border } }
  };
}

function styleHeaderRow(row, fill = COLORS.maroon) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    applyCellBorder(cell);
  });
}

function styleNeutralHeaderRange(sheet, rowNumber, fromColumn, toColumn) {
  for (let column = fromColumn; column <= toColumn; column += 1) {
    const cell = sheet.getCell(rowNumber, column);
    cell.font = { bold: true, color: { argb: COLORS.text }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.graySoft } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    applyCellBorder(cell);
  }
}

function styleSummaryRow(sheet, rowNumber, currencyColumns = []) {
  const row = sheet.getRow(rowNumber);
  row.eachCell((cell, columnNumber) => {
    cell.font = { size: 10, bold: true, color: { argb: COLORS.text } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.blueSoft } };
    applyCellBorder(cell);

    if (currencyColumns.includes(columnNumber) && typeof cell.value === "number") {
      cell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';
      cell.alignment = { vertical: "middle", horizontal: "right" };
    }
  });
}

function styleBodyRows(sheet, startRow, endRow, currencyColumns = []) {
  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    row.eachCell((cell, columnNumber) => {
      cell.font = { size: 10, color: { argb: COLORS.text } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      applyCellBorder(cell);

      if (currencyColumns.includes(columnNumber) && typeof cell.value === "number") {
        cell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }
    });
  }
}

function setColumnWidths(sheet, widths) {
  sheet.columns = widths.map((width) => ({ width }));
}

function buildTextBar(value, maxValue) {
  if (!maxValue || value <= 0) return "";
  const length = Math.max(1, Math.round((value / maxValue) * 18));
  return "#".repeat(length);
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

function addKpiBlock(sheet, startRow, startColumn, title, value, fillColor) {
  const endColumn = startColumn + 1;
  sheet.mergeCells(startRow, startColumn, startRow, endColumn);
  sheet.mergeCells(startRow + 1, startColumn, startRow + 2, endColumn);

  const titleCell = sheet.getCell(startRow, startColumn);
  const valueCell = sheet.getCell(startRow + 1, startColumn);

  titleCell.value = title;
  titleCell.font = { bold: true, size: 11, color: { argb: COLORS.text } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.graySoft } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  valueCell.value = value;
  valueCell.numFmt = '"Rp"#,##0;[Red]-"Rp"#,##0';
  valueCell.font = { bold: true, size: 15, color: { argb: fillColor } };
  valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.white } };
  valueCell.alignment = { vertical: "middle", horizontal: "center" };

  for (let row = startRow; row <= startRow + 2; row += 1) {
    for (let col = startColumn; col <= endColumn; col += 1) {
      applyCellBorder(sheet.getCell(row, col));
    }
  }
}

function addSectionTitle(sheet, rowNumber, fromColumn, toColumn, title, fillColor = COLORS.maroon) {
  sheet.mergeCells(rowNumber, fromColumn, rowNumber, toColumn);
  const cell = sheet.getCell(rowNumber, fromColumn);
  cell.value = title;
  cell.font = { bold: true, size: 11, color: { argb: COLORS.white } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
  cell.alignment = { vertical: "middle", horizontal: "left" };

  for (let column = fromColumn; column <= toColumn; column += 1) {
    applyCellBorder(sheet.getCell(rowNumber, column));
  }
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

function renderUserTransactionTable(sheet, startRow, items, palette, typeLabel) {
  const headerRowNumber = startRow;
  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = ["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal"];
  styleNeutralHeaderRange(sheet, headerRowNumber, 1, 5);

  let currentRow = headerRowNumber + 1;

  if (items.length) {
    items.forEach((item) => {
      const row = sheet.getRow(currentRow);
      row.values = [
        dayjs(item.date).format("DD MMM YYYY"),
        typeLabel,
        item.categoryName || getKategoriName(item.categoryId),
        item.note || item.title || "-",
        Number(item.amount || 0)
      ];
      styleBodyRows(sheet, currentRow, currentRow, [5]);
      sheet.getCell(`B${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: palette.soft }
      };
      sheet.getCell(`B${currentRow}`).font = {
        size: 10,
        bold: true,
        color: { argb: palette.strong }
      };
      currentRow += 1;
    });
  } else {
    sheet.mergeCells(currentRow, 1, currentRow, 5);
    const emptyCell = sheet.getCell(currentRow, 1);
    emptyCell.value = "Belum ada data";
    emptyCell.font = { italic: true, size: 10, color: { argb: COLORS.muted } };
    emptyCell.alignment = { vertical: "middle", horizontal: "center" };
    emptyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: palette.soft } };
    for (let column = 1; column <= 5; column += 1) {
      applyCellBorder(sheet.getCell(currentRow, column));
    }
    currentRow += 1;
  }

  const totalRow = sheet.getRow(currentRow);
  totalRow.getCell(1).value = `Total ${typeLabel}`;
  totalRow.getCell(5).value = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  styleSummaryRow(sheet, currentRow, [5]);
  totalRow.getCell(1).font = { bold: true, color: { argb: palette.strong }, size: 10 };
  totalRow.getCell(5).font = { bold: true, color: { argb: palette.strong }, size: 10 };

  return currentRow + 2;
}

function buildDashboardSheet({ workbook, familyName, numericYear, summary, trend, categories, users }) {
  const sheet = workbook.addWorksheet("Dashboard", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  setColumnWidths(sheet, [18, 18, 18, 18, 18, 18, 18]);

  sheet.mergeCells("A1:G1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `Ringkasan Tahunan Keluarga - ${numericYear}`;
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.maroon } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(titleCell);

  addKpiBlock(sheet, 3, 1, "Pemasukan", summary.incomeMonth, COLORS.green);
  addKpiBlock(sheet, 3, 3, "Pengeluaran", summary.expenseMonth, COLORS.red);
  addKpiBlock(sheet, 3, 5, "Arus kas bersih", summary.netCashflow, COLORS.maroon);

  sheet.getCell("A8").value = "Perbandingan Bulanan";
  sheet.getCell("A8").font = { bold: true, size: 12, color: { argb: COLORS.maroon } };

  const trendHeader = sheet.getRow(9);
  trendHeader.values = ["Bulan", "Pemasukan", "Pengeluaran", "Bar Pemasukan", "Bar Pengeluaran"];
  styleHeaderRow(trendHeader);

  const maxTrendValue = Math.max(...trend.map((item) => Math.max(item.income, item.expense)), 1);
  trend.forEach((item, index) => {
    const rowNumber = 10 + index;
    const row = sheet.getRow(rowNumber);
    row.values = [
      item.month,
      item.income,
      item.expense,
      buildTextBar(item.income, maxTrendValue),
      buildTextBar(item.expense, maxTrendValue)
    ];
    styleBodyRows(sheet, rowNumber, rowNumber, [2, 3]);
    sheet.getCell(`D${rowNumber}`).font = { size: 10, color: { argb: COLORS.green }, bold: true };
    sheet.getCell(`E${rowNumber}`).font = { size: 10, color: { argb: COLORS.red }, bold: true };
  });

  const categoryTitleRow = 24;
  sheet.getCell(`A${categoryTitleRow}`).value = "Kategori Terbesar";
  sheet.getCell(`A${categoryTitleRow}`).font = { bold: true, size: 12, color: { argb: COLORS.maroon } };
  const categoryHeader = sheet.getRow(categoryTitleRow + 1);
  categoryHeader.values = ["Kategori", "Nominal"];
  styleHeaderRow(categoryHeader, COLORS.red);
  categories.forEach((item, index) => {
    const rowNumber = categoryTitleRow + 2 + index;
    sheet.getRow(rowNumber).values = [item.name, item.value];
    styleBodyRows(sheet, rowNumber, rowNumber, [2]);
  });

  const userTitleRow = 24;
  sheet.getCell(`D${userTitleRow}`).value = "Ringkasan Penginput";
  sheet.getCell(`D${userTitleRow}`).font = { bold: true, size: 12, color: { argb: COLORS.maroon } };
  const userHeader = sheet.getRow(userTitleRow + 1);
  userHeader.getCell(4).value = "User";
  userHeader.getCell(5).value = "Pemasukan";
  userHeader.getCell(6).value = "Pengeluaran";
  userHeader.getCell(7).value = "Jumlah Input";
  styleHeaderRow(userHeader, COLORS.green);
  users.forEach((item, index) => {
    const rowNumber = userTitleRow + 2 + index;
    sheet.getCell(`D${rowNumber}`).value = item.name;
    sheet.getCell(`E${rowNumber}`).value = item.income;
    sheet.getCell(`F${rowNumber}`).value = item.expense;
    sheet.getCell(`G${rowNumber}`).value = item.count;
    styleBodyRows(sheet, rowNumber, rowNumber, [5, 6]);
  });
}

function buildMonthSheet({ workbook, numericYear, monthIndex, monthTransactions }) {
  const monthDate = dayjs().year(numericYear).month(monthIndex);
  const sheet = workbook.addWorksheet(monthDate.format("MMM"), {
    views: [{ state: "frozen", ySplit: 6 }]
  });
  setColumnWidths(sheet, [16, 14, 16, 42, 16, 20]);

  const summary = buildFinanceSummary(monthTransactions, { year: numericYear, month: monthIndex });
  const userBreakdown = getUserMonthlyBreakdown(monthTransactions);

  sheet.mergeCells("A1:F1");
  const title = sheet.getCell("A1");
  title.value = `Laporan ${monthDate.format("MMMM")} ${numericYear}`;
  title.font = { bold: true, size: 15, color: { argb: COLORS.white } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.maroon } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(title);

  addKpiBlock(sheet, 3, 1, "Pemasukan", summary.incomeMonth, COLORS.green);
  addKpiBlock(sheet, 3, 3, "Pengeluaran", summary.expenseMonth, COLORS.red);
  addKpiBlock(sheet, 3, 5, "Arus kas bersih", summary.netCashflow, COLORS.maroon);

  addSectionTitle(sheet, 8, 1, 6, "Ringkasan Transaksi Bulanan", COLORS.maroon);
  const headerRow = sheet.getRow(9);
  headerRow.values = ["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal", "User"];
  styleHeaderRow(headerRow);

  monthTransactions.forEach((item, index) => {
    const rowNumber = 10 + index;
    const row = sheet.getRow(rowNumber);
    row.values = [
      dayjs(item.date).format("DD MMM YYYY"),
      getJenisLabel(item.type),
      item.categoryName || getKategoriName(item.categoryId),
      item.note || item.title || "",
      Number(item.amount || 0),
      item.memberName || "Tanpa nama"
    ];
    styleBodyRows(sheet, rowNumber, rowNumber, [5]);
    sheet.getCell(`B${rowNumber}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: item.type === "income" ? COLORS.greenSoft : COLORS.redSoft }
    };
    sheet.getCell(`B${rowNumber}`).font = {
      size: 10,
      bold: true,
      color: { argb: item.type === "income" ? COLORS.green : COLORS.red }
    };
  });

  const summaryEndRow = 10 + monthTransactions.length - 1;
  const totalSummaryRow = Math.max(summaryEndRow + 1, 10);
  const totalSummary = sheet.getRow(totalSummaryRow);
  totalSummary.getCell(1).value = "Total Bulanan";
  totalSummary.getCell(5).value = summary.netCashflow;
  styleSummaryRow(sheet, totalSummaryRow, [5]);
  totalSummary.getCell(1).font = { bold: true, color: { argb: COLORS.maroon }, size: 10 };
  totalSummary.getCell(5).font = { bold: true, color: { argb: COLORS.maroon }, size: 10 };

  let currentRow = totalSummaryRow + 3;
  userBreakdown.forEach((userGroup, index) => {
    const palette = USER_TABLE_COLORS[index % USER_TABLE_COLORS.length];
    addSectionTitle(
      sheet,
      currentRow,
      1,
      6,
      `Ringkasan ${userGroup.name} | Pemasukan ${formatCurrency(
        userGroup.income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      )} | Pengeluaran ${formatCurrency(
        userGroup.expense.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      )}`,
      palette.strong
    );
    currentRow += 1;
    currentRow = renderUserTransactionTable(
      sheet,
      currentRow,
      userGroup.income,
      { strong: COLORS.green, soft: COLORS.greenSoft },
      "Pemasukan"
    );
    currentRow = renderUserTransactionTable(
      sheet,
      currentRow,
      userGroup.expense,
      { strong: COLORS.red, soft: COLORS.redSoft },
      "Pengeluaran"
    );
  });
}

export async function exportLaporanTahunanExcel({ year, transactions, familyName }) {
  const numericYear = Number(year);
  const yearlyTransactions = transactions.filter((item) => dayjs(item.date).year() === numericYear);
  const summary = buildFinanceSummary(yearlyTransactions, { year: numericYear, month: null });
  const trend = buildMonthlyTrend(yearlyTransactions, { year: numericYear });
  const categories = buildCategoryBreakdown(yearlyTransactions);
  const users = buildUserInputSummary(yearlyTransactions);
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Mugni Finance";
  workbook.created = new Date();
  workbook.modified = new Date();

  buildDashboardSheet({
    workbook,
    familyName,
    numericYear,
    summary,
    trend,
    categories,
    users
  });

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const monthTransactions = yearlyTransactions.filter((item) => dayjs(item.date).month() === monthIndex);
    if (!monthTransactions.length) continue;
    buildMonthSheet({ workbook, numericYear, monthIndex, monthTransactions });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `laporan-keuangan-${numericYear}.xlsx`);
}
