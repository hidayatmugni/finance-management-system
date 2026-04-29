import dayjs from "dayjs";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function buildRows(items) {
  return items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.note)}</td>
          <td>${escapeHtml(item.category)}</td>
          <td>${escapeHtml(item.time)}</td>
          <td class="amount">${formatCurrency(item.amount)}</td>
        </tr>
      `,
    )
    .join("");
}

export function openDailyInvoicePrint({
  familyName,
  memberName,
  dateLabel,
  expenses,
  incomes
}) {
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const net = totalIncome - totalExpense;
  const invoiceNumber = `INV-${dayjs().format("YYYYMMDD-HHmmss")}`;

  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Invoice Harian ${escapeHtml(memberName)}</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            background: #f4f7f6;
            color: #111827;
            font-family: Inter, Arial, sans-serif;
            padding: 28px;
          }
          .sheet {
            max-width: 920px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #d6e4dd;
            border-radius: 24px;
            padding: 28px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
          }
          .brand {
            display: inline-block;
            background: #10b36d;
            color: white;
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          h1 {
            margin: 16px 0 8px;
            font-size: 28px;
            line-height: 1.1;
          }
          .subtle {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          .meta {
            min-width: 240px;
            background: #f6faf8;
            border: 1px solid #dcebe4;
            border-radius: 18px;
            padding: 16px 18px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            margin-bottom: 8px;
          }
          .meta-row:last-child {
            margin-bottom: 0;
          }
          .kpis {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-top: 24px;
          }
          .kpi {
            border: 1px solid #dcebe4;
            border-radius: 18px;
            padding: 16px 18px;
            background: #fbfefd;
          }
          .kpi-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 10px;
          }
          .kpi-value {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.1;
          }
          .expense { color: #ef4444; }
          .income { color: #10b36d; }
          .net { color: ${net >= 0 ? "#0f9f61" : "#ef4444"}; }
          .section {
            margin-top: 28px;
          }
          .section-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ecfdf4;
            color: #0f9f61;
            border: 1px solid #bbf7d0;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 18px;
            border: 1px solid #dcebe4;
          }
          th {
            background: #f6faf8;
            color: #334155;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 12px 14px;
          }
          td {
            padding: 12px 14px;
            border-top: 1px solid #edf4f0;
            font-size: 13px;
            vertical-align: top;
          }
          td.amount {
            text-align: right;
            font-weight: 700;
            white-space: nowrap;
          }
          .empty {
            padding: 22px 14px;
            color: #6b7280;
            text-align: center;
          }
          .footer {
            margin-top: 28px;
            padding-top: 18px;
            border-top: 1px dashed #d6e4dd;
            color: #6b7280;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .sheet {
              border: 0;
              border-radius: 0;
              padding: 0;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <span class="brand">Daily Invoice</span>
              <h1>Rincian Keuangan Harian</h1>
              <p class="subtle">Rekap manual per user untuk dicetak atau disimpan sebagai PDF.</p>
            </div>
            <div class="meta">
              <div class="meta-row"><strong>Invoice</strong><span>${escapeHtml(invoiceNumber)}</span></div>
              <div class="meta-row"><strong>Tanggal</strong><span>${escapeHtml(dateLabel)}</span></div>
              <div class="meta-row"><strong>User</strong><span>${escapeHtml(memberName)}</span></div>
              <div class="meta-row"><strong>Keluarga</strong><span>${escapeHtml(familyName || "-")}</span></div>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-label">Total Pengeluaran Hari Ini</div>
              <div class="kpi-value expense">${formatCurrency(totalExpense)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Total Pemasukan Hari Ini</div>
              <div class="kpi-value income">${formatCurrency(totalIncome)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Arus Kas Bersih Hari Ini</div>
              <div class="kpi-value net">${formatCurrency(net)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-head">
              <h2 class="section-title">Rincian Pengeluaran</h2>
              <span class="pill">${expenses.length} transaksi</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th>Jam / Tanggal</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.length ? buildRows(expenses) : `<tr><td class="empty" colspan="6">Tidak ada pengeluaran hari ini.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-head">
              <h2 class="section-title">Ringkasan Pemasukan</h2>
              <span class="pill">${incomes.length} transaksi</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul</th>
                  <th>Keterangan</th>
                  <th>Kategori</th>
                  <th>Jam / Tanggal</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                ${incomes.length ? buildRows(incomes) : `<tr><td class="empty" colspan="6">Tidak ada pemasukan hari ini.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <span>Dokumen ini dibuat manual dari aplikasi My Finance.</span>
            <span>${escapeHtml(dayjs().format("DD MMM YYYY HH:mm"))}</span>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=1024,height=900");
  if (!popup) {
    throw new Error("Popup invoice diblokir browser. Izinkan popup lalu coba lagi.");
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}
