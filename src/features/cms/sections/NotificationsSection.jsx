import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Switch, Typography } from "antd";
import { Card, Field, SectionCard, SortableList } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

const PLACEHOLDERS = [
  "{{category}}",
  "{{percent}}",
  "{{limit}}",
  "{{amount}}",
  "{{person}}",
  "{{dueDate}}",
  "{{days}}",
  "{{goal}}"
];

/** Channels, thresholds and message templates. */
export function NotificationsSection() {
  const editor = useConfigEditor("notifications");
  const { draft } = editor;

  const setChannel = (key, value) =>
    editor.set("channels", { ...draft.channels, [key]: value });

  const addTemplate = () =>
    editor.addItem("templates", {
      id: slugify("template baru", "template"),
      label: "Template baru",
      subject: "",
      body: "",
      enabled: true
    });

  return (
    <ConfigSectionShell
      title="Notifikasi"
      description="Kapan aplikasi memberi kabar, lewat jalur apa, dan dengan kalimat seperti apa."
      editor={editor}
    >
      <SectionCard title="Jalur pengiriman">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Dalam aplikasi" hint="Toast dan lonceng notifikasi.">
            <Switch
              checked={draft.channels.inApp}
              onChange={(value) => setChannel("inApp", value)}
            />
          </Field>
          <Field label="Email" hint="Butuh konfigurasi pengirim di backend.">
            <Switch checked={draft.channels.email} onChange={(value) => setChannel("email", value)} />
          </Field>
          <Field label="Push" hint="Memerlukan izin browser dari tiap perangkat.">
            <Switch checked={draft.channels.push} onChange={(value) => setChannel("push", value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Ambang peringatan anggaran"
        description="Dipakai halaman anggaran dan dashboard untuk menandai kategori yang hampir habis."
      >
        <Field label={`Peringatkan saat mencapai ${draft.budgetAlertThreshold}% dari limit`}>
          <InputNumber
            size="large"
            min={50}
            max={100}
            value={draft.budgetAlertThreshold}
            onChange={(value) => editor.set("budgetAlertThreshold", value ?? 90)}
            suffix="%"
            className="!w-40"
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Template pesan"
        description="Teks yang dikirim saat sebuah kejadian terpicu."
        action={
          <Button icon={<PlusOutlined />} onClick={addTemplate}>
            Tambah template
          </Button>
        }
      >
        <Card className="mb-4 bg-surface-sunken p-3">
          <Typography.Text className="!block !text-caption !font-semibold !text-muted">
            Variabel yang tersedia
          </Typography.Text>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PLACEHOLDERS.map((placeholder) => (
              <code
                key={placeholder}
                className="rounded-xs border border-line bg-surface px-1.5 py-0.5 text-caption text-ink"
              >
                {placeholder}
              </code>
            ))}
          </div>
        </Card>

        <SortableList
          items={draft.templates}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("templates", items)}
          renderItem={(item) => (
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={item.label}
                  onChange={(event) =>
                    editor.updateItem("templates", item.id, { label: event.target.value })
                  }
                  className="!max-w-[240px]"
                  size="small"
                />
                <span className="ml-auto flex items-center gap-2">
                  <Switch
                    size="small"
                    checked={item.enabled !== false}
                    onChange={(value) =>
                      editor.updateItem("templates", item.id, { enabled: value })
                    }
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => editor.removeItem("templates", item.id)}
                    aria-label="Hapus template"
                  />
                </span>
              </div>

              <Input
                value={item.subject}
                onChange={(event) =>
                  editor.updateItem("templates", item.id, { subject: event.target.value })
                }
                placeholder="Judul pesan"
                size="small"
              />
              <Input.TextArea
                value={item.body}
                onChange={(event) =>
                  editor.updateItem("templates", item.id, { body: event.target.value })
                }
                placeholder="Isi pesan"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
          )}
        />
      </SectionCard>
    </ConfigSectionShell>
  );
}
