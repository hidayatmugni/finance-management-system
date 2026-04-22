import { useEffect, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Tag, Typography } from "antd";
import { NavLink } from "react-router-dom";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { SectionHeading } from "../../shared/components/SectionHeading";
import {
  createAccount,
  createCategory,
  updateFamily
} from "../../shared/firebase/firestoreHousehold.js";

export function SettingsPage() {
  const family = useFinanceStore((state) => state.family);
  const accounts = useFinanceStore((state) => state.accounts);
  const categories = useFinanceStore((state) => state.categories);
  const [familyName, setFamilyName] = useState(family?.name || "");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("cash");
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState("expense");
  const [submitAlert, setSubmitAlert] = useState(null);

  useEffect(() => {
    setFamilyName(family?.name || "");
  }, [family?.name]);

  useEffect(() => {
    if (!submitAlert) return undefined;
    const timeoutId = window.setTimeout(() => setSubmitAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [submitAlert]);

  const items = [
    { title: "Target Tabungan", description: "Target dan progres tabungan", to: "/savings" },
    { title: "Hutang & Piutang", description: "Hutang, piutang, dan riwayat pembayaran", to: "/debts" },
    { title: "Anggota", description: "Peran, akses, dan statistik per anggota", to: "/members" }
  ];

  const handleFamilySave = async () => {
    setSubmitAlert(null);
    if (!family?.id || !familyName.trim()) {
      setSubmitAlert({
        type: "warning",
        title: "Nama keluarga tidak boleh kosong."
      });
      return;
    }
    try {
      await updateFamily(family.id, { name: familyName.trim() });
      setSubmitAlert({
        type: "success",
        title: "Nama keluarga berhasil diperbarui."
      });
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal memperbarui nama keluarga."
      });
    }
  };

  const handleCreateAccount = async () => {
    setSubmitAlert(null);
    if (!family?.id || !accountName.trim()) {
      setSubmitAlert({
        type: "warning",
        title: "Nama akun tidak boleh kosong."
      });
      return;
    }
    try {
      await createAccount(family.id, {
        familyId: family.id,
        name: accountName.trim(),
        type: accountType,
        balance: 0
      });
      setAccountName("");
      setSubmitAlert({
        type: "success",
        title: "Akun berhasil ditambahkan."
      });
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menambahkan akun."
      });
    }
  };

  const handleCreateCategory = async () => {
    setSubmitAlert(null);
    if (!family?.id || !categoryName.trim()) {
      setSubmitAlert({
        type: "warning",
        title: "Nama kategori tidak boleh kosong."
      });
      return;
    }
    try {
      await createCategory(family.id, {
        familyId: family.id,
        name: categoryName.trim(),
        type: categoryType
      });
      setCategoryName("");
      setSubmitAlert({
        type: "success",
        title: "Kategori berhasil ditambahkan."
      });
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Gagal menambahkan kategori."
      });
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeading eyebrow="Pengaturan" title="Konfigurasi keluarga dan sistem" />

      {submitAlert ? (
        <Alert
          type={submitAlert.type}
          showIcon
          title={submitAlert.title}
          closable={{ closeIcon: true, onClose: () => setSubmitAlert(null), "aria-label": "close" }}
        />
      ) : null}

      <Card className="finance-card finance-soft-card">
        <Typography.Text className="metric-label">Keluarga</Typography.Text>
        <Typography.Title level={4} className="!mb-0 !mt-3 !text-lg">{family?.name || "Keluarga"}</Typography.Title>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Nama keluarga
          </span>
          <Input
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            size="large"
            placeholder="Keluarga Anda"
          />
        </label>

        <Button type="primary" size="large" className="mt-4" onClick={handleFamilySave}>
          Simpan nama keluarga
        </Button>
      </Card>

      <Card className="finance-card finance-soft-card">
        <Typography.Text className="metric-label">Akun</Typography.Text>

        <Space orientation="vertical" size={12} className="mt-4 w-full">
          {accounts.length ? accounts.map((account) => (
            <Card key={account.id} size="small" className="finance-soft-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Typography.Text strong className="!text-sm">{account.name}</Typography.Text>
                  <Typography.Text className="block !text-xs !uppercase !tracking-[0.14em] !text-muted">
                    {translateAccountType(account.type)}
                  </Typography.Text>
                </div>
                <Tag className="rounded-full border-0 bg-white/10 px-3 py-1 text-xs font-semibold text-muted">Aktif</Tag>
              </div>
            </Card>
          )) : (
            <Typography.Text className="!text-sm !text-muted">
              Belum ada akun. Tambahkan minimal satu akun untuk input transaksi.
            </Typography.Text>
          )}
        </Space>

        <div className="mt-4 space-y-3">
          <Input
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            size="large"
            placeholder="Contoh: Kas rumah"
          />
          <Select
            value={accountType}
            onChange={setAccountType}
            size="large"
            options={[
              { value: "cash", label: "Kas" },
              { value: "bank", label: "Bank" },
              { value: "ewallet", label: "Dompet digital" },
              { value: "savings", label: "Tabungan" }
            ]}
          />
          <Button type="primary" size="large" onClick={handleCreateAccount}>
            Tambah akun
          </Button>
        </div>
      </Card>

      <Card className="finance-card finance-soft-card">
        <Typography.Text className="metric-label">Kategori</Typography.Text>

        <Space orientation="vertical" size={12} className="mt-4 w-full">
          {categories.length ? categories.map((category) => (
            <Card key={category.id} size="small" className="finance-soft-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Typography.Text strong className="!text-sm">{category.name}</Typography.Text>
                  <Typography.Text className="block !text-xs !uppercase !tracking-[0.14em] !text-muted">
                    {category.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                  </Typography.Text>
                </div>
              </div>
            </Card>
          )) : (
            <Typography.Text className="!text-sm !text-muted">
              Belum ada kategori. Tambahkan kategori pemasukan atau pengeluaran terlebih dahulu.
            </Typography.Text>
          )}
        </Space>

        <div className="mt-4 space-y-3">
          <Input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            size="large"
            placeholder="Contoh: Makan"
          />
          <Select
            value={categoryType}
            onChange={setCategoryType}
            size="large"
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" }
            ]}
          />
          <Button type="primary" size="large" onClick={handleCreateCategory}>
            Tambah kategori
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((item) => (
          <NavLink key={item.title} to={item.to}>
            <Card className="finance-card block">
              <Typography.Text strong className="!text-sm">{item.title}</Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-2 !text-sm !leading-6 !text-muted">
                {item.description}
              </Typography.Paragraph>
            </Card>
          </NavLink>
        ))}
      </div>

      <Card className="finance-card">
        <Typography.Text className="metric-label">Integrasi</Typography.Text>
        <Space orientation="vertical" size={8} className="mt-4 w-full">
          <Typography.Text className="!text-sm !text-muted">
            Auth, Firestore, proteksi route, dan token sesi sudah menjadi jalur utama aplikasi.
          </Typography.Text>
          <Typography.Text className="!text-sm !text-muted">
            Sinkronisasi spreadsheet tetap dijalankan oleh Firebase Cloud Functions, bukan dari frontend.
          </Typography.Text>
          <Typography.Text className="!text-sm !text-muted">
            Fondasi PWA dan antrean offline tetap tersedia untuk pengembangan berikutnya.
          </Typography.Text>
        </Space>
      </Card>

    </div>
  );
}

function translateAccountType(type) {
  switch (type) {
    case "cash":
      return "Kas";
    case "bank":
      return "Bank";
    case "ewallet":
      return "Dompet digital";
    case "savings":
      return "Tabungan";
    default:
      return type;
  }
}
