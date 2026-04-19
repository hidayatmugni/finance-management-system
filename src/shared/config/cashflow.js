export const JENIS_ARUS_KAS = {
  PEMASUKAN: "income",
  PENGELUARAN: "expense"
};

export const KATEGORI_PEMASUKAN = [
  { id: "gaji", name: "Gaji", type: JENIS_ARUS_KAS.PEMASUKAN },
  { id: "freelance", name: "Freelance", type: JENIS_ARUS_KAS.PEMASUKAN },
  { id: "jual_barang", name: "Jual barang", type: JENIS_ARUS_KAS.PEMASUKAN },
  { id: "bonus", name: "Bonus", type: JENIS_ARUS_KAS.PEMASUKAN },
  { id: "lainnya_income", name: "Lainnya", type: JENIS_ARUS_KAS.PEMASUKAN }
];

export const KATEGORI_PENGELUARAN = [
  { id: "makan", name: "Makan", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "minum", name: "Minum", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "belanja", name: "Belanja", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "transport", name: "Transport", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "tagihan", name: "Tagihan", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "tabungan", name: "Tabungan", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "kesehatan", name: "Kesehatan", type: JENIS_ARUS_KAS.PENGELUARAN },
  { id: "lainnya_expense", name: "Lainnya", type: JENIS_ARUS_KAS.PENGELUARAN }
];

export const SEMUA_KATEGORI_ARUS_KAS = [...KATEGORI_PEMASUKAN, ...KATEGORI_PENGELUARAN];

export const PILIHAN_JENIS_ARUS_KAS = [
  { value: JENIS_ARUS_KAS.PENGELUARAN, label: "Pengeluaran" },
  { value: JENIS_ARUS_KAS.PEMASUKAN, label: "Pemasukan" }
];

export function getKategoriByJenis(type) {
  if (type === JENIS_ARUS_KAS.PEMASUKAN) return KATEGORI_PEMASUKAN;
  if (type === JENIS_ARUS_KAS.PENGELUARAN) return KATEGORI_PENGELUARAN;
  return [];
}

export function getKategoriName(categoryId) {
  return SEMUA_KATEGORI_ARUS_KAS.find((item) => item.id === categoryId)?.name || "Tanpa kategori";
}

export function getJenisLabel(type) {
  return type === JENIS_ARUS_KAS.PEMASUKAN ? "Pemasukan" : "Pengeluaran";
}
