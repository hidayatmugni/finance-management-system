import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Segmented, Select, Switch, Typography } from "antd";
import { useState } from "react";
import { ICON_NAMES, renderIcon } from "../../../shared/config/iconRegistry";
import {
  Badge,
  Field,
  ResponsiveDialog,
  SearchSelect,
  SectionCard,
  SortableList
} from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

/**
 * Widget types the dashboard knows how to render. Adding one here (and a case
 * in `DashboardPage`) is all it takes to offer a new widget in the CMS.
 */
export const WIDGET_TYPES = [
  { value: "stat-balance", label: "Ringkasan saldo", hint: "Kartu KPI: saldo, masuk, keluar, bersih" },
  { value: "chart-cashflow", label: "Grafik arus kas", hint: "Tren harian pemasukan vs pengeluaran" },
  { value: "chart-income-expense", label: "Perbandingan bulanan", hint: "Batang per bulan" },
  { value: "chart-categories", label: "Pengeluaran per kategori", hint: "Donat + peringkat" },
  { value: "list-budget", label: "Progress anggaran", hint: "Bar per kategori" },
  { value: "list-bills", label: "Tagihan mendatang", hint: "Hutang jatuh tempo terdekat" },
  { value: "list-goals", label: "Target keuangan", hint: "Progress tabungan" },
  { value: "list-recent", label: "Transaksi terbaru", hint: "Daftar transaksi terakhir" },
  { value: "quick-actions", label: "Aksi cepat", hint: "Tombol pintasan" }
];

const EMPTY_WIDGET = { title: "", type: "stat-balance", size: "half", enabled: true };
const EMPTY_ACTION = { label: "", path: "", icon: "plus", tone: "primary", enabled: true };

/** Dashboard composition: which widgets appear, in what order and what size. */
export function DashboardSection() {
  const editor = useConfigEditor("dashboard");
  const { draft } = editor;

  const [widgetDialog, setWidgetDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingAction, setEditingAction] = useState(null);
  const [widgetForm, setWidgetForm] = useState(EMPTY_WIDGET);
  const [actionForm, setActionForm] = useState(EMPTY_ACTION);

  const submitWidget = () => {
    if (!widgetForm.title.trim()) return;

    const payload = {
      ...widgetForm,
      title: widgetForm.title.trim(),
      id: editingWidget?.id || slugify(widgetForm.title, "widget")
    };

    if (editingWidget) {
      editor.updateItem("widgets", editingWidget.id, payload);
    } else {
      editor.addItem("widgets", payload);
    }
    setWidgetDialog(false);
  };

  const submitAction = () => {
    if (!actionForm.label.trim() || !actionForm.path.trim()) return;

    const payload = {
      ...actionForm,
      label: actionForm.label.trim(),
      path: actionForm.path.trim(),
      id: editingAction?.id || slugify(actionForm.label, "action")
    };

    if (editingAction) {
      editor.updateItem("quickActions", editingAction.id, payload);
    } else {
      editor.addItem("quickActions", payload);
    }
    setActionDialog(false);
  };

  return (
    <ConfigSectionShell
      title="Dashboard"
      description="Tentukan widget apa yang tampil di dashboard, urutannya, dan lebarnya. Pengguna tetap bisa menyusun ulang sendiri, tetapi susunan di sini yang menjadi default keluarga."
      editor={editor}
    >
      <SectionCard
        title="Widget dashboard"
        description="Seret untuk mengurutkan. Lebar 'Penuh' memakai satu baris utuh, 'Separuh' berdampingan di layar lebar."
        action={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingWidget(null);
              setWidgetForm(EMPTY_WIDGET);
              setWidgetDialog(true);
            }}
          >
            Tambah widget
          </Button>
        }
      >
        <SortableList
          items={draft.widgets}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("widgets", items)}
          renderItem={(item) => {
            const type = WIDGET_TYPES.find((option) => option.value === item.type);

            return (
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Typography.Text className="!truncate !font-medium !text-ink">
                      {item.title}
                    </Typography.Text>
                    <Badge tone="neutral" size="sm">
                      {item.size === "full" ? "Penuh" : "Separuh"}
                    </Badge>
                    {!item.enabled ? <Badge size="sm">Nonaktif</Badge> : null}
                  </div>
                  <Typography.Text className="!block !truncate !text-caption !text-muted">
                    {type?.label || item.type} — {type?.hint}
                  </Typography.Text>
                </div>

                <Segmented
                  size="small"
                  value={item.size}
                  onChange={(value) => editor.updateItem("widgets", item.id, { size: value })}
                  options={[
                    { label: "½", value: "half" },
                    { label: "1", value: "full" }
                  ]}
                />
                <Switch
                  size="small"
                  checked={item.enabled !== false}
                  onChange={(value) => editor.updateItem("widgets", item.id, { enabled: value })}
                />
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingWidget(item);
                    setWidgetForm({ ...EMPTY_WIDGET, ...item });
                    setWidgetDialog(true);
                  }}
                  aria-label="Ubah widget"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => editor.removeItem("widgets", item.id)}
                  aria-label="Hapus widget"
                />
              </div>
            );
          }}
        />
      </SectionCard>

      <SectionCard
        title="Aksi cepat"
        description="Tombol pintasan di dashboard dan di pencarian cepat (Ctrl/⌘ + K)."
        action={
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAction(null);
              setActionForm(EMPTY_ACTION);
              setActionDialog(true);
            }}
          >
            Tambah aksi
          </Button>
        }
      >
        <SortableList
          items={draft.quickActions}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("quickActions", items)}
          renderItem={(item) => (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted">
                {renderIcon(item.icon)}
              </span>
              <div className="min-w-0 flex-1">
                <Typography.Text className="!block !truncate !font-medium !text-ink">
                  {item.label}
                </Typography.Text>
                <Typography.Text className="!block !truncate !font-mono !text-caption !text-muted">
                  {item.path}
                </Typography.Text>
              </div>
              <Switch
                size="small"
                checked={item.enabled !== false}
                onChange={(value) => editor.updateItem("quickActions", item.id, { enabled: value })}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingAction(item);
                  setActionForm({ ...EMPTY_ACTION, ...item });
                  setActionDialog(true);
                }}
                aria-label="Ubah aksi"
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => editor.removeItem("quickActions", item.id)}
                aria-label="Hapus aksi"
              />
            </div>
          )}
        />
      </SectionCard>

      <ResponsiveDialog
        open={widgetDialog}
        onClose={() => setWidgetDialog(false)}
        onSubmit={submitWidget}
        title={editingWidget ? "Ubah widget" : "Tambah widget"}
      >
        <Field label="Judul" required>
          <Input
            size="large"
            value={widgetForm.title}
            onChange={(event) => setWidgetForm({ ...widgetForm, title: event.target.value })}
            placeholder="Contoh: Arus kas 30 hari"
            autoFocus
          />
        </Field>

        <Field label="Jenis widget" required>
          <SearchSelect
            options={WIDGET_TYPES.map((item) => ({
              value: item.value,
              label: item.label,
              description: item.hint
            }))}
            value={widgetForm.type}
            onChange={(value) => setWidgetForm({ ...widgetForm, type: value })}
          />
        </Field>

        <Field label="Lebar">
          <Segmented
            block
            className="ds-segmented-lg"
            value={widgetForm.size}
            onChange={(value) => setWidgetForm({ ...widgetForm, size: value })}
            options={[
              { label: "Separuh layar", value: "half" },
              { label: "Selebar layar", value: "full" }
            ]}
          />
        </Field>

        <Field label="Aktif">
          <Switch
            checked={widgetForm.enabled}
            onChange={(value) => setWidgetForm({ ...widgetForm, enabled: value })}
          />
        </Field>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={actionDialog}
        onClose={() => setActionDialog(false)}
        onSubmit={submitAction}
        title={editingAction ? "Ubah aksi cepat" : "Tambah aksi cepat"}
      >
        <Field label="Label" required>
          <Input
            size="large"
            value={actionForm.label}
            onChange={(event) => setActionForm({ ...actionForm, label: event.target.value })}
            autoFocus
          />
        </Field>

        <Field label="Tujuan" required hint="Path aplikasi, boleh memakai query mis. ?type=income.">
          <Input
            size="large"
            value={actionForm.path}
            onChange={(event) => setActionForm({ ...actionForm, path: event.target.value })}
            placeholder="/dashboard/add?type=expense"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ikon">
            <SearchSelect
              options={ICON_NAMES.map((name) => ({
                value: name,
                label: name,
                icon: renderIcon(name)
              }))}
              value={actionForm.icon}
              onChange={(value) => setActionForm({ ...actionForm, icon: value })}
            />
          </Field>

          <Field label="Warna">
            <Select
              size="large"
              className="!w-full"
              value={actionForm.tone}
              onChange={(value) => setActionForm({ ...actionForm, tone: value })}
              options={[
                { value: "primary", label: "Utama" },
                { value: "success", label: "Sukses" },
                { value: "warning", label: "Peringatan" },
                { value: "danger", label: "Bahaya" },
                { value: "info", label: "Info" }
              ]}
            />
          </Field>
        </div>
      </ResponsiveDialog>
    </ConfigSectionShell>
  );
}
