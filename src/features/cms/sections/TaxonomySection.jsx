import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Select, Switch, Typography } from "antd";
import { Link } from "react-router-dom";
import { ICON_NAMES, renderIcon } from "../../../shared/config/iconRegistry";
import { useTheme } from "../../../shared/design/ThemeProvider";
import { Badge, Card, Field, SearchSelect, SectionCard, SortableList } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

const TONES = [
  { value: "neutral", label: "Netral" },
  { value: "primary", label: "Utama" },
  { value: "success", label: "Sukses" },
  { value: "warning", label: "Peringatan" },
  { value: "danger", label: "Bahaya" },
  { value: "info", label: "Info" }
];

/**
 * Transaction types, wallets, statuses and the wording used across the app.
 *
 * Categories deliberately live in Firestore (see the Categories page) rather
 * than in config, because they are day-to-day data an admin edits constantly.
 */
export function TaxonomySection() {
  const editor = useConfigEditor("taxonomy");
  const { chart } = useTheme();
  const { draft } = editor;

  const addType = () =>
    editor.addItem("transactionTypes", {
      id: slugify("tipe baru", "type"),
      label: "Tipe baru",
      color: chart[0],
      icon: "tag",
      direction: -1,
      enabled: true
    });

  const addAccount = () =>
    editor.addItem("accounts", {
      id: slugify("dompet baru", "wallet"),
      label: "Dompet baru",
      icon: "wallet",
      color: chart[1],
      enabled: true
    });

  const updateStatus = (entity, id, patch) => {
    editor.set("statuses", {
      ...draft.statuses,
      [entity]: draft.statuses[entity].map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      )
    });
  };

  return (
    <ConfigSectionShell
      title="Tipe, dompet & status"
      description="Istilah dasar yang dipakai seluruh aplikasi. Mengubah label di sini langsung mengubah form input, filter, tabel, dan laporan."
      editor={editor}
    >
      <SectionCard
        title="Jenis transaksi"
        description="Arah +1 menambah saldo, -1 mengurangi. Warna dipakai untuk badge dan grafik."
        action={
          <Button icon={<PlusOutlined />} onClick={addType}>
            Tambah jenis
          </Button>
        }
      >
        <SortableList
          items={draft.transactionTypes}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("transactionTypes", items)}
          renderItem={(item) => (
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <input
                type="color"
                value={item.color}
                onChange={(event) =>
                  editor.updateItem("transactionTypes", item.id, { color: event.target.value })
                }
                className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
                aria-label={`Warna ${item.label}`}
              />
              <Input
                value={item.label}
                onChange={(event) =>
                  editor.updateItem("transactionTypes", item.id, { label: event.target.value })
                }
                className="!max-w-[190px]"
              />
              <Select
                value={item.direction}
                onChange={(value) =>
                  editor.updateItem("transactionTypes", item.id, { direction: value })
                }
                className="!w-[130px]"
                options={[
                  { value: 1, label: "Menambah (+)" },
                  { value: -1, label: "Mengurangi (−)" }
                ]}
              />
              <Typography.Text className="!font-mono !text-caption !text-muted">
                {item.id}
              </Typography.Text>
              <span className="ml-auto flex items-center gap-2">
                <Switch
                  size="small"
                  checked={item.enabled !== false}
                  onChange={(value) =>
                    editor.updateItem("transactionTypes", item.id, { enabled: value })
                  }
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => editor.removeItem("transactionTypes", item.id)}
                  aria-label="Hapus jenis"
                />
              </span>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Dompet / sumber dana"
        description="Muncul sebagai pilihan 'sumber dana' pada form transaksi bila field-nya diaktifkan."
        action={
          <Button icon={<PlusOutlined />} onClick={addAccount}>
            Tambah dompet
          </Button>
        }
      >
        <SortableList
          items={draft.accounts}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("accounts", items)}
          renderItem={(item) => (
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${item.color}1F`, color: item.color }}
              >
                {renderIcon(item.icon)}
              </span>
              <Input
                value={item.label}
                onChange={(event) =>
                  editor.updateItem("accounts", item.id, { label: event.target.value })
                }
                className="!max-w-[200px]"
              />
              <div className="w-[170px]">
                <SearchSelect
                  size="middle"
                  options={ICON_NAMES.map((name) => ({
                    value: name,
                    label: name,
                    icon: renderIcon(name)
                  }))}
                  value={item.icon}
                  onChange={(value) => editor.updateItem("accounts", item.id, { icon: value })}
                />
              </div>
              <input
                type="color"
                value={item.color}
                onChange={(event) =>
                  editor.updateItem("accounts", item.id, { color: event.target.value })
                }
                className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
                aria-label={`Warna ${item.label}`}
              />
              <span className="ml-auto flex items-center gap-2">
                <Switch
                  size="small"
                  checked={item.enabled !== false}
                  onChange={(value) => editor.updateItem("accounts", item.id, { enabled: value })}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => editor.removeItem("accounts", item.id)}
                  aria-label="Hapus dompet"
                />
              </span>
            </div>
          )}
        />
      </SectionCard>

      <SectionCard
        title="Status"
        description="Label dan warna status untuk hutang/piutang dan target tabungan."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {Object.entries(draft.statuses).map(([entity, statuses]) => (
            <div key={entity}>
              <Typography.Text className="ds-eyebrow !mb-2 !block">
                {entity === "financeRecord" ? "Hutang & piutang" : "Target tabungan"}
              </Typography.Text>
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-2 rounded-md border border-line px-3 py-2"
                  >
                    <Input
                      value={status.label}
                      onChange={(event) =>
                        updateStatus(entity, status.id, { label: event.target.value })
                      }
                      className="!max-w-[170px]"
                    />
                    <Select
                      value={status.tone}
                      onChange={(value) => updateStatus(entity, status.id, { tone: value })}
                      options={TONES}
                      className="!w-[140px]"
                    />
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Istilah aplikasi"
        description="Ganti kata yang dipakai di kartu ringkasan dan judul bagian agar sesuai kebiasaan keluarga."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(draft.labels).map(([key, value]) => (
            <Field key={key} label={key}>
              <Input
                value={value}
                onChange={(event) =>
                  editor.set("labels", { ...draft.labels, [key]: event.target.value })
                }
              />
            </Field>
          ))}
        </div>
      </SectionCard>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Typography.Text className="!block !font-medium !text-ink">Kategori</Typography.Text>
          <Typography.Text className="!block !text-caption !text-muted">
            Kategori adalah data harian, bukan konfigurasi — dikelola di halaman tersendiri lengkap
            dengan warna, ikon dan kata kunci pencarian.
          </Typography.Text>
        </div>
        <Link to="/dashboard/categories">
          <Button type="primary">Kelola kategori</Button>
        </Link>
      </Card>
    </ConfigSectionShell>
  );
}
