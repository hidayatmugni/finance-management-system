import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select, Switch, TimePicker, Typography } from "antd";
import dayjs from "dayjs";
import { useConfigSection, useFormatters } from "../../../shared/config/useAppConfig";
import { Field, SectionCard, SortableList } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

/** Approval rules, automation switches and reminder schedules. */
export function WorkflowSection() {
  const editor = useConfigEditor("workflow");
  const access = useConfigSection("access");
  const formatters = useFormatters();
  const { draft } = editor;

  const setApproval = (patch) => editor.set("approval", { ...draft.approval, ...patch });
  const setAutomation = (patch) => editor.set("automation", { ...draft.automation, ...patch });

  const addReminder = () =>
    editor.addItem("reminders", {
      id: slugify("pengingat baru", "reminder"),
      label: "Pengingat baru",
      enabled: true,
      daysBefore: 1,
      channel: "inApp"
    });

  return (
    <ConfigSectionShell
      title="Alur kerja & otomatisasi"
      description="Aturan persetujuan, otomatisasi yang berjalan di latar belakang, dan pengingat berkala."
      editor={editor}
    >
      <SectionCard
        title="Persetujuan transaksi"
        description="Transaksi besar bisa ditahan sampai disetujui pemilik, tanpa memperlambat pencatatan harian."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Aktifkan persetujuan">
            <Switch
              checked={draft.approval.enabled}
              onChange={(value) => setApproval({ enabled: value })}
            />
          </Field>

          <Field
            label="Batas nominal"
            hint={`Transaksi ${formatters.currency(draft.approval.thresholdAmount)} ke atas perlu persetujuan.`}
          >
            <InputNumber
              className="!w-full"
              size="large"
              min={0}
              step={100000}
              disabled={!draft.approval.enabled}
              value={draft.approval.thresholdAmount}
              onChange={(value) => setApproval({ thresholdAmount: value ?? 0 })}
              formatter={(value) =>
                value ? new Intl.NumberFormat("id-ID").format(Number(value)) : ""
              }
              parser={(value) => value?.replace(/\D/g, "") || ""}
            />
          </Field>

          <Field label="Peran penyetuju">
            <Select
              size="large"
              className="!w-full"
              disabled={!draft.approval.enabled}
              value={draft.approval.approverRole}
              onChange={(value) => setApproval({ approverRole: value })}
              options={access.roles.map((role) => ({ value: role.id, label: role.label }))}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Otomatisasi">
        <div className="space-y-4">
          <AutomationToggle
            label="Tutup hutang otomatis saat lunas"
            description="Status berubah menjadi lunas begitu total pembayaran menutupi pokok."
            checked={draft.automation.autoCloseSettledDebts}
            onChange={(value) => setAutomation({ autoCloseSettledDebts: value })}
          />
          <AutomationToggle
            label="Sisa anggaran dibawa ke periode berikutnya"
            description="Limit periode depan ditambah sisa periode ini."
            checked={draft.automation.rolloverUnusedBudget}
            onChange={(value) => setAutomation({ rolloverUnusedBudget: value })}
          />
          <AutomationToggle
            label="Setoran tabungan tercatat di arus kas"
            description="Setiap setoran otomatis membuat transaksi pengeluaran yang sesuai."
            checked={draft.automation.mirrorSavingsToCashflow}
            onChange={(value) => setAutomation({ mirrorSavingsToCashflow: value })}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Pengingat"
        description="Kapan aplikasi perlu menyapa penggunanya."
        action={
          <Button icon={<PlusOutlined />} onClick={addReminder}>
            Tambah pengingat
          </Button>
        }
      >
        <SortableList
          items={draft.reminders}
          getKey={(item) => item.id}
          onReorder={(items) => editor.setList("reminders", items)}
          renderItem={(item) => (
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <Input
                value={item.label}
                onChange={(event) =>
                  editor.updateItem("reminders", item.id, { label: event.target.value })
                }
                className="!max-w-[240px]"
              />

              {item.daysBefore !== undefined ? (
                <span className="flex items-center gap-1.5">
                  <InputNumber
                    min={0}
                    max={30}
                    value={item.daysBefore}
                    onChange={(value) =>
                      editor.updateItem("reminders", item.id, { daysBefore: value ?? 0 })
                    }
                    className="!w-[70px]"
                  />
                  <Typography.Text className="!text-caption !text-muted">
                    hari sebelum
                  </Typography.Text>
                </span>
              ) : null}

              {item.threshold !== undefined ? (
                <span className="flex items-center gap-1.5">
                  <InputNumber
                    min={0}
                    max={100}
                    value={item.threshold}
                    onChange={(value) =>
                      editor.updateItem("reminders", item.id, { threshold: value ?? 0 })
                    }
                    className="!w-[76px]"
                    suffix="%"
                  />
                  <Typography.Text className="!text-caption !text-muted">terpakai</Typography.Text>
                </span>
              ) : null}

              {item.time !== undefined ? (
                <TimePicker
                  format="HH:mm"
                  value={item.time ? dayjs(item.time, "HH:mm") : null}
                  onChange={(value) =>
                    editor.updateItem("reminders", item.id, {
                      time: value ? value.format("HH:mm") : ""
                    })
                  }
                  className="!w-[110px]"
                />
              ) : null}

              <span className="ml-auto flex items-center gap-2">
                <Switch
                  size="small"
                  checked={item.enabled !== false}
                  onChange={(value) => editor.updateItem("reminders", item.id, { enabled: value })}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => editor.removeItem("reminders", item.id)}
                  aria-label="Hapus pengingat"
                />
              </span>
            </div>
          )}
        />
      </SectionCard>
    </ConfigSectionShell>
  );
}

function AutomationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-line px-3.5 py-3">
      <div className="min-w-0">
        <Typography.Text className="!block !font-medium !text-ink">{label}</Typography.Text>
        <Typography.Text className="!block !text-caption !leading-5 !text-muted">
          {description}
        </Typography.Text>
      </div>
      <Switch checked={checked} onChange={onChange} className="shrink-0" />
    </div>
  );
}
