import { Button, Slider, Switch, Typography } from "antd";
import { useTheme } from "../../../shared/design/ThemeProvider";
import { getTheme } from "../../../shared/design/themes";
import { Card, Field, SectionCard } from "../../../shared/ui";
import { ThemeGallery } from "../../../shared/ui/ThemeSwitcher";
import { ConfigSectionShell } from "../ConfigSectionShell";
import { useConfigEditor } from "../useConfigEditor";

/**
 * Theme and typography.
 *
 * All three themes expose the same semantic tokens, so switching here re-paints
 * every screen without touching a single component's styles.
 */
export function AppearanceSection() {
  const editor = useConfigEditor("theme");
  const { draft } = editor;
  const { setTheme, clearUserTheme } = useTheme();

  const previewTheme = getTheme(draft.activeTheme);
  const accent = draft.primaryColor || previewTheme.colors.primary;

  /** Apply immediately so the admin sees the result while choosing. */
  const chooseTheme = (themeId) => {
    editor.set("activeTheme", themeId);
    setTheme(themeId);
  };

  return (
    <ConfigSectionShell
      title="Tampilan"
      description="Pilih tema global aplikasi. Warna, latar, border, dan tipografi semuanya diambil dari tema aktif — satu perubahan di sini berlaku untuk seluruh halaman."
      editor={editor}
      extraActions={
        <Button onClick={clearUserTheme}>Ikuti tema default</Button>
      }
    >
      <SectionCard
        title="Tema aplikasi"
        description="Setiap tema membawa palet lengkap: latar, permukaan, garis, teks, status, dan warna grafik."
      >
        <ThemeGallery value={draft.activeTheme} onChange={chooseTheme} />

        <div className="mt-5">
          <Field
            label="Izinkan pengguna memilih tema sendiri"
            hint="Jika dimatikan, semua anggota memakai tema di atas dan tombol ganti tema disembunyikan."
          >
            <Switch
              checked={draft.allowUserOverride}
              onChange={(value) => editor.set("allowUserOverride", value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Warna aksen"
        description="Kosongkan untuk memakai warna asli tema. Mengisi warna sendiri akan menimpa aksen di ketiga tema."
      >
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Warna utama">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(event) => editor.set("primaryColor", event.target.value)}
                className="h-10 w-16 cursor-pointer rounded-md border border-line bg-surface p-1"
                aria-label="Warna utama"
              />
              <Typography.Text className="!font-mono !text-small !text-muted">
                {accent.toUpperCase()}
              </Typography.Text>
            </div>
          </Field>

          <Button onClick={() => editor.set("primaryColor", null)} disabled={!draft.primaryColor}>
            Pakai warna tema
          </Button>
        </div>

        <Card className="mt-4 p-4">
          <Typography.Text className="ds-eyebrow">Pratinjau palet</Typography.Text>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {[
              ["Latar", previewTheme.colors.bg],
              ["Permukaan", previewTheme.colors.surface],
              ["Garis", previewTheme.colors.border],
              ["Utama", accent],
              ["Sukses", previewTheme.colors.success],
              ["Peringatan", previewTheme.colors.warning],
              ["Bahaya", previewTheme.colors.danger],
              ["Teks", previewTheme.colors.text]
            ].map(([label, color]) => (
              <div key={label} className="w-[84px]">
                <span
                  className="block h-10 rounded-md border border-line"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <Typography.Text className="!mt-1 !block !text-caption !text-muted">
                  {label}
                </Typography.Text>
              </div>
            ))}
          </div>
        </Card>
      </SectionCard>

      <SectionCard title="Kepadatan & tipografi">
        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label={`Ukuran huruf — ${Math.round((draft.fontScale ?? 1) * 100)}%`}
            hint="Menskalakan seluruh tipografi, termasuk tabel dan grafik."
          >
            <Slider
              min={0.9}
              max={1.2}
              step={0.05}
              value={draft.fontScale ?? 1}
              onChange={(value) => editor.set("fontScale", value)}
              marks={{ 0.9: "90%", 1: "100%", 1.2: "120%" }}
            />
          </Field>

          <Field
            label={`Kelengkungan sudut — ${Math.round((draft.radiusScale ?? 1) * 100)}%`}
            hint="0% menghasilkan sudut tajam, 150% sangat membulat."
          >
            <Slider
              min={0}
              max={1.5}
              step={0.25}
              value={draft.radiusScale ?? 1}
              onChange={(value) => editor.set("radiusScale", value)}
              marks={{ 0: "Tajam", 1: "Normal", 1.5: "Bulat" }}
            />
          </Field>

          <Field
            label="Mode padat"
            hint="Memperkecil tinggi kontrol dan jarak — berguna untuk layar kecil atau data padat."
          >
            <Switch checked={draft.compact} onChange={(value) => editor.set("compact", value)} />
          </Field>
        </div>

        <Card className="mt-4 p-4">
          <Typography.Text className="ds-eyebrow">Pratinjau tipografi</Typography.Text>
          <Typography.Title level={2} className="!mb-1 !mt-2 !font-display !text-headline !text-ink">
            Rp 12.480.000
          </Typography.Title>
          <Typography.Text className="!block !text-body !text-ink">
            Saldo berjalan seluruh dompet keluarga
          </Typography.Text>
          <Typography.Text className="!mt-1 !block !text-small !text-muted">
            Teks sekunder — keterangan, hint, dan metadata tabel.
          </Typography.Text>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="primary">Tombol utama</Button>
            <Button>Tombol biasa</Button>
            <Button danger>Tindakan berisiko</Button>
          </div>
        </Card>
      </SectionCard>
    </ConfigSectionShell>
  );
}
