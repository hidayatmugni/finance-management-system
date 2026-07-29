import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Input, Select, Typography } from "antd";
import { Badge, Card, Field, SectionCard } from "../../../shared/ui";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { slugify, useConfigEditor } from "../useConfigEditor";

/**
 * Roles and permissions.
 *
 * A role holding `*` keeps every permission, including ones added later — that
 * is why the owner row shows as locked rather than as a fully-ticked matrix.
 */
export function AccessSection() {
  const editor = useConfigEditor("access");
  const { draft } = editor;

  const addRole = () =>
    editor.addItem("roles", {
      id: slugify("peran baru", "role"),
      label: "Peran baru",
      description: "",
      permissions: ["dashboard.view"]
    });

  const togglePermission = (roleId, permissionId, checked) => {
    const role = draft.roles.find((item) => item.id === roleId);
    if (!role || role.permissions.includes("*")) return;

    editor.updateItem("roles", roleId, {
      permissions: checked
        ? [...role.permissions, permissionId]
        : role.permissions.filter((item) => item !== permissionId)
    });
  };

  return (
    <ConfigSectionShell
      title="Peran & hak akses"
      description="Menentukan siapa boleh melihat dan mengubah apa. Menu dengan permission yang tidak dimiliki otomatis hilang dari navigasi anggota tersebut."
      editor={editor}
    >
      <SectionCard
        title="Peran"
        action={
          <Button icon={<PlusOutlined />} onClick={addRole}>
            Tambah peran
          </Button>
        }
      >
        <div className="space-y-3">
          {draft.roles.map((role) => {
            const isSuperUser = role.permissions.includes("*");

            return (
              <Card key={role.id} className="p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[200px] flex-1">
                    <Input
                      value={role.label}
                      onChange={(event) =>
                        editor.updateItem("roles", role.id, { label: event.target.value })
                      }
                      className="!max-w-xs"
                    />
                    <Typography.Text className="!mt-1 !block !font-mono !text-caption !text-muted">
                      {role.id}
                    </Typography.Text>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSuperUser ? <Badge tone="primary">Akses penuh</Badge> : null}
                    <Badge tone="neutral">
                      {isSuperUser ? "semua" : role.permissions.length} hak akses
                    </Badge>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={draft.roles.length <= 1}
                      onClick={() => editor.removeItem("roles", role.id)}
                      aria-label="Hapus peran"
                    />
                  </div>
                </div>

                <Input
                  className="!mt-3"
                  value={role.description}
                  onChange={(event) =>
                    editor.updateItem("roles", role.id, { description: event.target.value })
                  }
                  placeholder="Keterangan singkat peran ini"
                />

                {isSuperUser ? (
                  <Typography.Text className="!mt-3 !block !text-small !text-muted">
                    Peran ini memegang tanda <code>*</code>, jadi otomatis mendapat setiap hak akses
                    — termasuk yang ditambahkan di kemudian hari.
                  </Typography.Text>
                ) : (
                  <div className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {draft.permissions.map((permission) => (
                      <Checkbox
                        key={permission.id}
                        checked={role.permissions.includes(permission.id)}
                        onChange={(event) =>
                          togglePermission(role.id, permission.id, event.target.checked)
                        }
                      >
                        <span className="text-small text-ink">{permission.label}</span>
                      </Checkbox>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Peran default">
        <Field
          label="Peran untuk anggota baru"
          hint="Diberikan otomatis saat seseorang pertama kali masuk."
        >
          <Select
            size="large"
            className="!w-full !max-w-sm"
            value={draft.defaultRole}
            onChange={(value) => editor.set("defaultRole", value)}
            options={draft.roles.map((role) => ({ value: role.id, label: role.label }))}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="Daftar hak akses"
        description="Kode permission yang bisa dipasang pada menu dan tombol."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {draft.permissions.map((permission) => (
            <div
              key={permission.id}
              className="rounded-md border border-line px-3 py-2"
            >
              <Typography.Text className="!block !text-small !font-medium !text-ink">
                {permission.label}
              </Typography.Text>
              <Typography.Text className="!block !font-mono !text-caption !text-muted">
                {permission.id}
              </Typography.Text>
            </div>
          ))}
        </div>
      </SectionCard>
    </ConfigSectionShell>
  );
}
