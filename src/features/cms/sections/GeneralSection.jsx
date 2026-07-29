import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Segmented, Select, Typography } from "antd";
import { useState } from "react";
import { Field, SectionCard } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { useConfigEditor } from "../useConfigEditor";

const CURRENCIES = [
  { value: "IDR", label: "IDR — Rupiah", symbol: "Rp" },
  { value: "USD", label: "USD — US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "SGD", label: "SGD — Singapore Dollar", symbol: "S$" },
  { value: "MYR", label: "MYR — Ringgit", symbol: "RM" },
  { value: "JPY", label: "JPY — Yen", symbol: "¥" }
];

const LOCALES = [
  { value: "id-ID", label: "Indonesia (id-ID)" },
  { value: "en-US", label: "English US (en-US)" },
  { value: "en-GB", label: "English UK (en-GB)" }
];

const DATE_FORMATS = [
  { value: "DD MMM YYYY", label: "12 Feb 2026" },
  { value: "DD/MM/YYYY", label: "12/02/2026" },
  { value: "YYYY-MM-DD", label: "2026-02-12" },
  { value: "dddd, DD MMMM YYYY", label: "Kamis, 12 Februari 2026" }
];

/** Currency, locale, accounting period and input shortcuts. */
export function GeneralSection() {
  const editor = useConfigEditor("general");
  const { draft } = editor;
  const [newAmount, setNewAmount] = useState(null);

  const addQuickAmount = () => {
    if (!newAmount || newAmount <= 0) return;
    if (draft.quickAmounts.includes(newAmount)) return;
    editor.set("quickAmounts", [...draft.quickAmounts, newAmount].sort((a, b) => a - b));
    setNewAmount(null);
  };

  return (
    <ConfigSectionShell
      title="Umum"
      description="Identitas aplikasi, mata uang, dan periode pembukuan. Semua halaman mengikuti pengaturan ini — tidak ada nilai yang ditulis langsung di kode."
      editor={editor}
    >
      <SectionCard title="Identitas aplikasi">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama aplikasi">
            <Input
              size="large"
              value={draft.appName}
              onChange={(event) => editor.set("appName", event.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="Tagline" optional hint="Tampil di sidebar dan halaman login.">
            <Input
              size="large"
              value={draft.tagline}
              onChange={(event) => editor.set("tagline", event.target.value)}
              maxLength={80}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Mata uang & format angka">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Mata uang">
            <Select
              size="large"
              className="!w-full"
              value={draft.currency}
              onChange={(value) => {
                const currency = CURRENCIES.find((item) => item.value === value);
                editor.merge({ currency: value, currencySymbol: currency?.symbol || value });
              }}
              options={CURRENCIES}
            />
          </Field>

          <Field label="Simbol" hint="Dipakai di kolom input nominal.">
            <Input
              size="large"
              value={draft.currencySymbol}
              onChange={(event) => editor.set("currencySymbol", event.target.value)}
              maxLength={4}
            />
          </Field>

          <Field label="Bahasa & format lokal">
            <Select
              size="large"
              className="!w-full"
              value={draft.locale}
              onChange={(value) => editor.set("locale", value)}
              options={LOCALES}
            />
          </Field>

          <Field label="Angka di belakang koma">
            <InputNumber
              size="large"
              className="!w-full"
              min={0}
              max={4}
              value={draft.decimalPlaces}
              onChange={(value) => editor.set("decimalPlaces", value ?? 0)}
            />
          </Field>

          <Field label="Format tanggal" className="md:col-span-2">
            <Select
              size="large"
              className="!w-full"
              value={draft.dateFormat}
              onChange={(value) => editor.set("dateFormat", value)}
              options={DATE_FORMATS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Periode pembukuan"
        description="Menentukan rentang 'periode berjalan' pada dashboard, anggaran, dan laporan."
      >
        <Field label="Mode periode">
          <Segmented
            className="ds-segmented-lg"
            value={draft.bookPeriodMode}
            onChange={(value) => editor.set("bookPeriodMode", value)}
            options={[
              { label: "Bulan kalender (1 – akhir bulan)", value: "calendar" },
              { label: "Tanggal tutup buku sendiri", value: "custom" }
            ]}
          />
        </Field>

        {draft.bookPeriodMode === "custom" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Tanggal mulai" hint="Periode dimulai pada tanggal ini di bulan sebelumnya.">
              <InputNumber
                size="large"
                className="!w-full"
                min={1}
                max={31}
                value={draft.bookPeriodStartDay}
                onChange={(value) => editor.set("bookPeriodStartDay", value ?? 1)}
              />
            </Field>
            <Field label="Tanggal tutup">
              <InputNumber
                size="large"
                className="!w-full"
                min={1}
                max={31}
                value={draft.bookPeriodEndDay}
                onChange={(value) => editor.set("bookPeriodEndDay", value ?? 31)}
              />
            </Field>
            <Typography.Text className="!text-small !text-muted md:col-span-2">
              Contoh: mulai {draft.bookPeriodStartDay} dan tutup {draft.bookPeriodEndDay} berarti
              periode berjalan dari tanggal {draft.bookPeriodStartDay} bulan lalu sampai{" "}
              {draft.bookPeriodEndDay} bulan ini.
            </Typography.Text>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Pintasan nominal"
        description="Chip yang muncul di bawah kolom nominal supaya angka yang sering dipakai cukup satu ketukan."
      >
        <div className="flex flex-wrap gap-2">
          {draft.quickAmounts.map((amount) => (
            <span
              key={amount}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-sunken px-2.5 py-1.5 text-small font-medium text-ink"
            >
              {new Intl.NumberFormat(draft.locale).format(amount)}
              <button
                type="button"
                onClick={() =>
                  editor.set(
                    "quickAmounts",
                    draft.quickAmounts.filter((item) => item !== amount),
                  )
                }
                className="text-subtle transition hover:text-danger-ink"
                aria-label={`Hapus ${amount}`}
              >
                <CloseOutlined className="text-[10px]" />
              </button>
            </span>
          ))}
          {draft.quickAmounts.length === 0 ? (
            <Typography.Text className="!text-small !text-muted">
              Belum ada pintasan nominal.
            </Typography.Text>
          ) : null}
        </div>

        <div className="mt-4 flex max-w-sm gap-2">
          <InputNumber
            className="!w-full"
            min={0}
            step={1000}
            value={newAmount}
            onChange={setNewAmount}
            onPressEnter={addQuickAmount}
            placeholder="Contoh: 25000"
          />
          <Button icon={<PlusOutlined />} onClick={addQuickAmount}>
            Tambah
          </Button>
        </div>
      </SectionCard>
    </ConfigSectionShell>
  );
}
