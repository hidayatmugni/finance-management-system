import { Input, Switch, Tabs, Typography } from "antd";
import { Badge, Field, SectionCard, SortableList } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { useConfigEditor } from "../useConfigEditor";

const FORM_LABELS = {
  transaction: "Input transaksi",
  budget: "Anggaran",
  savingGoal: "Target tabungan",
  financeRecord: "Hutang & piutang"
};

const FIELD_TYPE_LABELS = {
  segmented: "Pilihan cepat",
  money: "Nominal",
  category: "Kategori",
  account: "Dompet",
  member: "Anggota",
  date: "Tanggal",
  text: "Teks",
  textarea: "Teks panjang",
  tags: "Tag"
};

/**
 * Form builder.
 *
 * The point of this section is subtraction: every field an admin hides is a
 * field the family never has to fill in again. Fields marked `locked` cannot be
 * hidden because the app cannot save a record without them.
 */
export function FormsSection() {
  const editor = useConfigEditor("forms");
  const { draft } = editor;

  const updateForm = (formKey, patch) => {
    editor.set(formKey, { ...draft[formKey], ...patch });
  };

  const updateField = (formKey, fieldName, patch) => {
    updateForm(formKey, {
      fields: draft[formKey].fields.map((field) =>
        field.name === fieldName ? { ...field, ...patch } : field,
      )
    });
  };

  const items = Object.keys(draft).map((formKey) => {
    const form = draft[formKey];
    const visibleCount = form.fields.filter((field) => field.visible !== false).length;
    const requiredCount = form.fields.filter(
      (field) => field.visible !== false && field.required,
    ).length;

    return {
      key: formKey,
      label: FORM_LABELS[formKey] || formKey,
      children: (
        <div className="space-y-4">
          <SectionCard
            title="Field"
            description={`${visibleCount} field tampil, ${requiredCount} wajib diisi. Seret untuk mengurutkan — urutan ini yang dilihat pengguna.`}
          >
            <SortableList
              items={form.fields}
              getKey={(item) => item.name}
              onReorder={(fields) => updateForm(formKey, { fields })}
              renderItem={(field) => (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={field.label}
                        onChange={(event) =>
                          updateField(formKey, field.name, { label: event.target.value })
                        }
                        className="!max-w-[200px]"
                        size="small"
                      />
                      <Badge size="sm">{FIELD_TYPE_LABELS[field.type] || field.type}</Badge>
                      {field.locked ? (
                        <Badge tone="primary" size="sm">
                          Wajib sistem
                        </Badge>
                      ) : null}
                    </div>
                    <Typography.Text className="!mt-1 !block !font-mono !text-caption !text-muted">
                      {field.name}
                    </Typography.Text>
                  </div>

                  <label className="flex shrink-0 items-center gap-2">
                    <Typography.Text className="!text-caption !text-muted">Tampil</Typography.Text>
                    <Switch
                      size="small"
                      disabled={field.locked}
                      checked={field.visible !== false}
                      onChange={(value) => updateField(formKey, field.name, { visible: value })}
                    />
                  </label>

                  <label className="flex shrink-0 items-center gap-2">
                    <Typography.Text className="!text-caption !text-muted">Wajib</Typography.Text>
                    <Switch
                      size="small"
                      disabled={field.locked || field.visible === false}
                      checked={Boolean(field.required)}
                      onChange={(value) => updateField(formKey, field.name, { required: value })}
                    />
                  </label>
                </div>
              )}
            />
          </SectionCard>

          {formKey === "transaction" ? (
            <SectionCard
              title="Perilaku input cepat"
              description="Pengaturan yang membuat pencatatan harian selesai dalam hitungan detik."
            >
              <div className="grid gap-5 md:grid-cols-3">
                <Field
                  label="Saran kategori otomatis"
                  hint="Menebak kategori dari keterangan berdasarkan kebiasaan sebelumnya."
                >
                  <Switch
                    checked={form.smartSuggestion !== false}
                    onChange={(value) => updateForm(formKey, { smartSuggestion: value })}
                  />
                </Field>
                <Field
                  label="Simpan draft otomatis"
                  hint="Isian yang belum sempat disimpan tidak hilang saat halaman tertutup."
                >
                  <Switch
                    checked={form.autoSaveDraft !== false}
                    onChange={(value) => updateForm(formKey, { autoSaveDraft: value })}
                  />
                </Field>
                <Field
                  label="Tetap di form setelah simpan"
                  hint="Cocok untuk mencatat banyak transaksi berurutan."
                >
                  <Switch
                    checked={form.keepOpenAfterSave !== false}
                    onChange={(value) => updateForm(formKey, { keepOpenAfterSave: value })}
                  />
                </Field>
              </div>
            </SectionCard>
          ) : null}
        </div>
      )
    };
  });

  return (
    <ConfigSectionShell
      title="Form & field"
      description="Atur field mana yang tampil dan mana yang wajib. Semakin sedikit field yang aktif, semakin cepat pencatatan harian selesai."
      editor={editor}
    >
      <Tabs items={items} />
    </ConfigSectionShell>
  );
}
