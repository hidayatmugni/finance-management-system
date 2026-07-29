import { SettingOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { Link } from "react-router-dom";
import { useConfigSection, useFormatters, usePermissions } from "../../shared/config/useAppConfig";
import { useTheme } from "../../shared/design/ThemeProvider";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../auth/AuthProvider";
import { Badge, Card, PageHeader, SectionCard } from "../../shared/ui";
import { ThemeGallery } from "../../shared/ui/ThemeSwitcher";
import { getCurrentBookMonthRange } from "../../shared/utils/dateFilters";

/**
 * Personal preferences.
 *
 * Deliberately thin: anything that affects the whole family lives in the
 * Configuration Center. What a single person controls here is their theme,
 * plus a read-only view of the settings that apply to them.
 */
export function SettingsPage() {
  const { user, profile, logout } = useAuth();
  const { themeId, setTheme, canSwitch } = useTheme();
  const formatters = useFormatters();

  const general = useConfigSection("general");
  const access = useConfigSection("access");
  const { can, role } = usePermissions(profile?.role);

  const family = useFinanceStore((state) => state.family);
  const period = getCurrentBookMonthRange(general);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Akun"
        title="Preferensi"
        description="Pengaturan pribadi Anda. Konfigurasi yang berlaku untuk seluruh keluarga ada di Pusat Konfigurasi."
        actions={
          can("config.manage") ? (
            <Link to="/dashboard/configuration">
              <Button type="primary" icon={<SettingOutlined />}>
                Buka konfigurasi
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Profil" description="Data ini berasal dari akun Firebase Anda.">
          <dl className="divide-y divide-line">
            <Row label="Nama" value={profile?.fullName || user?.displayName || "—"} />
            <Row label="Email" value={user?.email || "—"} />
            <Row
              label="Peran"
              value={<Badge tone="primary">{role?.label || profile?.role || "member"}</Badge>}
            />
            <Row label="Keluarga" value={family?.name || general.appName} />
          </dl>

          <Button className="!mt-4" danger onClick={logout}>
            Keluar dari akun
          </Button>
        </SectionCard>

        <SectionCard
          title="Tema"
          description={
            canSwitch
              ? "Pilihan ini hanya berlaku di perangkat Anda."
              : "Pemilihan tema dikunci oleh administrator keluarga."
          }
        >
          {canSwitch ? (
            <ThemeGallery value={themeId} onChange={setTheme} />
          ) : (
            <Typography.Text className="!text-body !text-muted">
              Tema aplikasi saat ini ditentukan di Pusat Konfigurasi.
            </Typography.Text>
          )}
        </SectionCard>

        <SectionCard
          title="Format & periode"
          description="Berlaku untuk seluruh keluarga — diubah dari Pusat Konfigurasi."
        >
          <dl className="divide-y divide-line">
            <Row label="Mata uang" value={`${general.currency} (${general.currencySymbol})`} />
            <Row label="Format angka" value={formatters.currency(1234567)} />
            <Row label="Format tanggal" value={general.dateFormat} />
            <Row
              label="Periode pembukuan"
              value={
                general.bookPeriodMode === "calendar"
                  ? "Bulan kalender"
                  : `Tanggal ${general.bookPeriodStartDay} – ${general.bookPeriodEndDay}`
              }
            />
            <Row label="Periode berjalan" value={period.label} />
          </dl>
        </SectionCard>

        <SectionCard title="Hak akses Anda" description={role?.description}>
          <div className="flex flex-wrap gap-1.5">
            {role?.permissions?.includes("*") ? (
              <Badge tone="primary">Akses penuh ke seluruh fitur</Badge>
            ) : (
              access.permissions
                .filter((permission) => can(permission.id))
                .map((permission) => (
                  <Badge key={permission.id} tone="neutral">
                    {permission.label}
                  </Badge>
                ))
            )}
          </div>
        </SectionCard>
      </div>

      {can("config.manage") ? (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <Typography.Text className="!block !font-medium !text-ink">
              Pusat Konfigurasi
            </Typography.Text>
            <Typography.Text className="!block !text-caption !text-muted">
              Menu, dashboard, form, tipe transaksi, alur kerja, notifikasi, dan peran — semuanya
              dapat diubah tanpa menyentuh kode.
            </Typography.Text>
          </div>
          <Link to="/dashboard/configuration">
            <Button type="primary">Buka</Button>
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="m-0 min-w-0 truncate text-right text-body font-medium text-ink">{value}</dd>
    </div>
  );
}
