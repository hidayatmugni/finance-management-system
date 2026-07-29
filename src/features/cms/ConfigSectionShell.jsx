import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { Card, useToast } from "../../shared/ui";

/**
 * Frame shared by every CMS section: a description, the editor body, and a
 * sticky save bar that only appears once something has actually changed — so
 * the admin always knows whether their work is persisted.
 */
export function ConfigSectionShell({ title, description, editor, children, extraActions }) {
  const toast = useToast();

  const handleRestore = () => {
    toast.confirm({
      title: "Kembalikan ke pengaturan bawaan?",
      content: "Semua penyesuaian pada bagian ini akan dihapus dan diganti nilai awal aplikasi.",
      okText: "Kembalikan",
      danger: true,
      onOk: editor.restoreDefaults
    });
  };

  return (
    <div className="pb-20">
      <div className="mb-4">
        <Typography.Title level={2} className="!mb-1 !text-subtitle !font-bold !text-ink">
          {title}
        </Typography.Title>
        <Typography.Text className="!block !max-w-3xl !text-body !leading-6 !text-muted">
          {description}
        </Typography.Text>
      </div>

      <div className="space-y-4">{children}</div>

      {editor.isDirty ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 py-3 backdrop-blur md:left-[var(--sidebar-width)] md:px-5">
          <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-end gap-2">
            <Typography.Text className="mr-auto !text-small !text-muted">
              Ada perubahan yang belum disimpan.
            </Typography.Text>
            <Button onClick={editor.discard} disabled={editor.saving}>
              Batalkan
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={editor.saving}
              onClick={editor.save}
            >
              Simpan konfigurasi
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <Typography.Text className="!block !text-body !font-medium !text-ink">
            Pengaturan bawaan
          </Typography.Text>
          <Typography.Text className="!block !text-caption !text-muted">
            Kembalikan bagian ini ke nilai awal aplikasi kapan saja.
          </Typography.Text>
        </div>
        <div className="flex gap-2">
          {extraActions}
          <Button icon={<ReloadOutlined />} onClick={handleRestore} disabled={editor.saving}>
            Kembalikan bawaan
          </Button>
        </div>
      </Card>
    </div>
  );
}
