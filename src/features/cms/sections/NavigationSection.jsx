import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Switch, Typography } from "antd";
import { useState } from "react";
import { useConfigSection } from "../../../shared/config/useAppConfig";
import { ICON_NAMES, renderIcon } from "../../../shared/config/iconRegistry";
import {
  Badge,
  Field,
  MultiSelect,
  ResponsiveDialog,
  SearchSelect,
  SectionCard,
  SortableList
} from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

const EMPTY_ITEM = {
  label: "",
  path: "",
  icon: "default",
  group: "utama",
  permission: "",
  enabled: true,
  mobile: false,
  end: false
};

/**
 * Menu builder.
 *
 * The sidebar, mobile drawer, bottom bar and command palette all read this
 * list, so reordering or hiding an entry here changes every surface at once.
 */
export function NavigationSection() {
  const editor = useConfigEditor("navigation");
  const access = useConfigSection("access");
  const { draft } = editor;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);

  const permissionOptions = access.permissions.map((item) => ({
    value: item.id,
    label: item.label,
    description: item.id
  }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_ITEM);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...EMPTY_ITEM, ...item });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.label.trim() || !form.path.trim()) return;

    const payload = {
      ...form,
      label: form.label.trim(),
      path: form.path.trim(),
      id: editing?.id || slugify(form.label, "menu")
    };

    if (editing) {
      editor.updateItem("items", editing.id, payload);
    } else {
      editor.addItem("items", payload);
    }

    setDialogOpen(false);
  };

  const handleRemove = (item) => {
    editor.removeItem("items", item.id);
    editor.setList(
      "bottomBar",
      draft.bottomBar.filter((id) => id !== item.id),
    );
  };

  return (
    <ConfigSectionShell
      title="Menu & navigasi"
      description="Susun menu aplikasi: urutan, label, ikon, pengelompokan, dan hak akses. Menu yang dimatikan hilang dari sidebar, drawer mobile, dan pencarian cepat."
      editor={editor}
    >
      <SectionCard
        title="Daftar menu"
        description="Seret untuk mengurutkan, atau pakai tombol panah di kanan."
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tambah menu
          </Button>
        }
      >
        <SortableList
          items={draft.items}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("items", items)}
          renderItem={(item) => (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted">
                {renderIcon(item.icon)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Typography.Text className="!truncate !font-medium !text-ink">
                    {item.label}
                  </Typography.Text>
                  {item.mobile ? <Badge tone="primary" size="sm">Mobile</Badge> : null}
                  {!item.enabled ? <Badge size="sm">Nonaktif</Badge> : null}
                </div>
                <Typography.Text className="!block !truncate !font-mono !text-caption !text-muted">
                  {item.path}
                  {item.permission ? ` · ${item.permission}` : ""}
                </Typography.Text>
              </div>

              <Switch
                size="small"
                checked={item.enabled !== false}
                onChange={(value) => editor.updateItem("items", item.id, { enabled: value })}
              />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(item)}
                aria-label="Ubah menu"
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(item)}
                aria-label="Hapus menu"
              />
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Bar bawah mobile"
        description="Maksimal lima menu. Menu berlabel id 'add' otomatis tampil sebagai tombol bulat di tengah."
      >
        <MultiSelect
          value={draft.bottomBar}
          onChange={(value) => editor.setList("bottomBar", value.slice(0, 5))}
          options={draft.items.map((item) => ({ value: item.id, label: item.label }))}
          placeholder="Pilih menu untuk bar bawah"
        />
        <Typography.Text className="!mt-2 !block !text-caption !text-muted">
          Terpilih {draft.bottomBar.length} dari maksimal 5.
        </Typography.Text>
      </SectionCard>

      <SectionCard title="Kelompok menu" description="Judul pemisah di sidebar.">
        <SortableList
          items={draft.groups}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("groups", items)}
          renderItem={(item) => (
            <div className="flex items-center gap-3">
              <Input
                value={item.label}
                onChange={(event) =>
                  editor.updateItem("groups", item.id, { label: event.target.value })
                }
                className="!max-w-xs"
              />
              <Typography.Text className="!font-mono !text-caption !text-muted">
                {item.id}
              </Typography.Text>
            </div>
          )}
        />
      </SectionCard>

      <ResponsiveDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={editing ? "Ubah menu" : "Tambah menu"}
      >
        <Field label="Label" required>
          <Input
            size="large"
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder="Contoh: Laporan Bulanan"
            autoFocus
          />
        </Field>

        <Field
          label="Path"
          required
          hint="Harus cocok dengan rute yang tersedia, mis. /dashboard/reports."
        >
          <Input
            size="large"
            value={form.path}
            onChange={(event) => setForm({ ...form, path: event.target.value })}
            placeholder="/dashboard/…"
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
              value={form.icon}
              onChange={(value) => setForm({ ...form, icon: value })}
            />
          </Field>

          <Field label="Kelompok">
            <Select
              size="large"
              className="!w-full"
              value={form.group}
              onChange={(value) => setForm({ ...form, group: value })}
              options={draft.groups.map((group) => ({ value: group.id, label: group.label }))}
            />
          </Field>
        </div>

        <Field
          label="Hak akses"
          optional
          hint="Kosongkan agar menu terlihat oleh semua peran."
        >
          <SearchSelect
            options={permissionOptions}
            value={form.permission}
            onChange={(value) => setForm({ ...form, permission: value || "" })}
            allowClear
            placeholder="Pilih permission"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Aktif">
            <Switch checked={form.enabled} onChange={(value) => setForm({ ...form, enabled: value })} />
          </Field>
          <Field label="Cocok persis" hint="Aktifkan untuk rute induk seperti /dashboard.">
            <Switch checked={form.end} onChange={(value) => setForm({ ...form, end: value })} />
          </Field>
        </div>
      </ResponsiveDialog>
    </ConfigSectionShell>
  );
}
