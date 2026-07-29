import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { Button, Input, Segmented, Typography } from "antd";
import { useMemo, useState } from "react";
import { useConfigSection } from "../../shared/config/useAppConfig";
import { ICON_NAMES, renderIcon } from "../../shared/config/iconRegistry";
import { useCatalogue } from "../../shared/data/useCatalogue";
import { useMutations } from "../../shared/data/useMutations";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useTheme } from "../../shared/design/ThemeProvider";
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  ResponsiveDialog,
  SearchSelect,
  useToast
} from "../../shared/ui";

const EMPTY_FORM = { name: "", type: "expense", color: "", icon: "tag", keywords: "" };

/**
 * Category management.
 *
 * Categories are created by hand and stored in Firestore — the app ships with
 * no invisible defaults. A one-click import of the CMS starter list is offered
 * for a fresh account, but even those become ordinary editable rows.
 */
export function CategoriesPage() {
  const toast = useToast();
  const mutations = useMutations();
  const catalogue = useCatalogue();
  const { chart } = useTheme();
  const taxonomy = useConfigSection("taxonomy");

  const categories = useFinanceStore((state) => state.categories);
  const transactions = useFinanceStore((state) => state.transactions);
  const loading = useFinanceStore((state) => state.loading.categories);

  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  /** Usage counts tell the admin which categories are safe to delete. */
  const usageByCategory = useMemo(() => {
    const counts = new Map();
    transactions.forEach((item) => {
      counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1);
    });
    return counts;
  }, [transactions]);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return catalogue.categories
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .filter((item) => !keyword || item.name.toLowerCase().includes(keyword))
      .map((item) => ({ ...item, usageCount: usageByCategory.get(item.id) || 0 }));
  }, [catalogue.categories, typeFilter, search, usageByCategory]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type: typeFilter === "all" ? "expense" : typeFilter, color: chart[0] });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      type: category.type || "expense",
      color: category.color || chart[0],
      icon: category.icon || "tag",
      keywords: category.keywords || ""
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (values) => {
    const nextErrors = {};
    const name = values.name.trim();

    if (!name) {
      nextErrors.name = "Nama kategori wajib diisi.";
    } else {
      const duplicate = categories.some(
        (item) =>
          item.id !== editing?.id &&
          item.type === values.type &&
          item.name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) nextErrors.name = `"${name}" sudah ada untuk jenis ini.`;
    }

    if (!values.type) nextErrors.type = "Pilih jenis transaksi.";
    return nextErrors;
  };

  const patchForm = (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (Object.keys(errors).length > 0) setErrors(validate(next));
  };

  const handleSubmit = async () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      color: form.color || chart[0],
      icon: form.icon || "tag",
      keywords: form.keywords.trim(),
      order: editing?.order ?? categories.length
    };

    setSubmitting(true);
    const outcome = editing
      ? await mutations.update("categories", editing.id, payload, {
          context: "kategori",
          successMessage: "Kategori diperbarui."
        })
      : await mutations.create("categories", payload, {
          context: "kategori",
          successMessage: "Kategori ditambahkan."
        });
    setSubmitting(false);

    if (outcome.ok) {
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    }
  };

  const handleDelete = (category) => {
    const used = usageByCategory.get(category.id) || 0;

    toast.confirm({
      title: `Hapus kategori "${category.name}"?`,
      content:
        used > 0
          ? `${used} transaksi masih memakai kategori ini. Transaksinya tetap ada, tetapi kategorinya akan kosong.`
          : "Kategori ini belum dipakai transaksi mana pun.",
      okText: "Hapus",
      danger: true,
      onOk: () =>
        mutations.remove("categories", category.id, {
          context: "kategori",
          successMessage: "Kategori dihapus."
        })
    });
  };

  /** Imports the starter list from the CMS as real, editable documents. */
  const handleImportStarter = async () => {
    const existing = new Set(
      categories.map((item) => `${item.type}:${item.name.trim().toLowerCase()}`),
    );
    const payloads = taxonomy.categories
      .filter((item) => !existing.has(`${item.type}:${item.name.trim().toLowerCase()}`))
      .map((item, index) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        color: item.color,
        icon: item.icon || "tag",
        keywords: "",
        order: categories.length + index
      }));

    if (payloads.length === 0) {
      toast.info("Semua kategori bawaan sudah ada.");
      return;
    }

    setImporting(true);
    await mutations.createMany("categories", payloads, {
      context: "kategori",
      successMessage: `${payloads.length} kategori bawaan ditambahkan.`
    });
    setImporting(false);
  };

  const columns = [
    {
      title: "Kategori",
      dataIndex: "name",
      render: (value, record) => (
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[15px]"
            style={{ backgroundColor: `${record.color}1F`, color: record.color }}
          >
            {renderIcon(record.icon)}
          </span>
          <div className="min-w-0">
            <Typography.Text className="!block !truncate !font-medium !text-ink">
              {value}
            </Typography.Text>
            {record.keywords ? (
              <Typography.Text className="!block !truncate !text-caption !text-muted">
                {record.keywords}
              </Typography.Text>
            ) : null}
          </div>
        </div>
      )
    },
    {
      title: "Jenis",
      dataIndex: "type",
      width: 140,
      filters: catalogue.transactionTypes.map((item) => ({ text: item.label, value: item.id })),
      onFilter: (value, record) => record.type === value,
      render: (value) => (
        <Badge tone={value === "income" ? "success" : "danger"}>
          {catalogue.getTypeLabel(value)}
        </Badge>
      )
    },
    {
      title: "Dipakai",
      dataIndex: "usageCount",
      width: 110,
      align: "right",
      sorter: (left, right) => left.usageCount - right.usageCount,
      render: (value) => (
        <Typography.Text className="!tabular-nums !text-muted">{value} transaksi</Typography.Text>
      )
    },
    {
      title: "",
      key: "actions",
      width: 92,
      align: "right",
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            aria-label="Ubah kategori"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            aria-label="Hapus kategori"
          />
        </div>
      )
    }
  ];

  const renderMobileCard = (record) => (
    <div className="flex items-center gap-3 p-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[17px]"
        style={{ backgroundColor: `${record.color}1F`, color: record.color }}
      >
        {renderIcon(record.icon)}
      </span>
      <div className="min-w-0 flex-1">
        <Typography.Text className="!block !truncate !font-semibold !text-ink">
          {record.name}
        </Typography.Text>
        <Typography.Text className="!block !text-caption !text-muted">
          {catalogue.getTypeLabel(record.type)} · {record.usageCount} transaksi
        </Typography.Text>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Pengaturan"
        title="Kategori"
        description="Semua kategori dibuat manual di sini dan langsung dipakai oleh form input, anggaran dan laporan."
        actions={
          <>
            {catalogue.categories.length === 0 ? (
              <Button icon={<DownloadOutlined />} loading={importing} onClick={handleImportStarter}>
                Import kategori bawaan
              </Button>
            ) : null}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah kategori
            </Button>
          </>
        }
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Segmented
            className="ds-segmented-lg"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: "Semua", value: "all" },
              ...catalogue.transactionTypes.map((item) => ({
                label: item.label,
                value: item.id
              }))
            ]}
          />
          <Input.Search
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kategori…"
            className="sm:!max-w-xs"
          />
          <Typography.Text className="!ml-auto !text-caption !text-muted">
            {rows.length} kategori
          </Typography.Text>
        </div>
      </Card>

      <DataTable
        dataSource={rows}
        columns={columns}
        renderMobileCard={renderMobileCard}
        loading={loading}
        scrollX={720}
        emptyState={
          <EmptyState
            title={search ? "Tidak ada yang cocok" : "Belum ada kategori"}
            description={
              search
                ? "Coba kata kunci lain atau ubah filter jenis."
                : "Buat kategori sendiri agar sesuai kebiasaan keluarga, atau mulai dari daftar bawaan lalu sesuaikan."
            }
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Tambah kategori
              </Button>
            }
            secondaryAction={
              !search && catalogue.categories.length === 0 ? (
                <Button icon={<DownloadOutlined />} loading={importing} onClick={handleImportStarter}>
                  Import kategori bawaan
                </Button>
              ) : null
            }
          />
        }
      />

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={editing ? "Ubah kategori" : "Tambah kategori"}
      >
        <Field label="Nama kategori" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => patchForm({ name: event.target.value })}
            placeholder="Contoh: Belanja bulanan"
            size="large"
            status={errors.name ? "error" : undefined}
            autoFocus
            maxLength={40}
          />
        </Field>

        <Field label="Jenis transaksi" required error={errors.type}>
          <Segmented
            block
            className="ds-segmented-lg"
            value={form.type}
            onChange={(value) => patchForm({ type: value })}
            options={catalogue.transactionTypes.map((item) => ({
              label: item.label,
              value: item.id
            }))}
          />
        </Field>

        <Field label="Warna" hint="Dipakai di grafik, badge dan daftar transaksi.">
          <div className="flex flex-wrap gap-2">
            {chart.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => patchForm({ color })}
                aria-label={`Warna ${color}`}
                className={`h-8 w-8 rounded-md transition ${
                  form.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={form.color || chart[0]}
              onChange={(event) => patchForm({ color: event.target.value })}
              className="h-8 w-12 cursor-pointer rounded-md border border-line bg-surface p-0.5"
              aria-label="Warna kustom"
            />
          </div>
        </Field>

        <Field label="Ikon">
          <SearchSelect
            options={ICON_NAMES.map((name) => ({
              value: name,
              label: name,
              icon: renderIcon(name)
            }))}
            value={form.icon}
            onChange={(value) => patchForm({ icon: value })}
            placeholder="Pilih ikon"
          />
        </Field>

        <Field
          label="Kata kunci pencarian"
          optional
          hint="Kata lain yang sering diketik untuk kategori ini — membantu pencarian cepat saat input."
        >
          <Input
            value={form.keywords}
            onChange={(event) => patchForm({ keywords: event.target.value })}
            placeholder="Contoh: warung, makan siang, kopi"
            size="large"
          />
        </Field>
      </ResponsiveDialog>
    </div>
  );
}
