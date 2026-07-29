import { Tabs } from "antd";
import { useState } from "react";
import { usePermissions } from "../../shared/config/useAppConfig";
import { renderIcon } from "../../shared/config/iconRegistry";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState, PageHeader } from "../../shared/ui";
import { useResponsive } from "../../shared/hooks/useResponsive";
import { AccessSection } from "./sections/AccessSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { DashboardSection } from "./sections/DashboardSection";
import { FormsSection } from "./sections/FormsSection";
import { GeneralSection } from "./sections/GeneralSection";
import { NavigationSection } from "./sections/NavigationSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { TaxonomySection } from "./sections/TaxonomySection";
import { WorkflowSection } from "./sections/WorkflowSection";

const SECTIONS = [
  { key: "general", label: "Umum", icon: "sliders", Component: GeneralSection },
  { key: "appearance", label: "Tampilan", icon: "tag", Component: AppearanceSection },
  { key: "navigation", label: "Menu", icon: "dashboard", Component: NavigationSection },
  { key: "dashboard", label: "Dashboard", icon: "analytics", Component: DashboardSection },
  { key: "taxonomy", label: "Tipe & status", icon: "categories", Component: TaxonomySection },
  { key: "forms", label: "Form", icon: "file", Component: FormsSection },
  { key: "workflow", label: "Alur kerja", icon: "automation", Component: WorkflowSection },
  { key: "notifications", label: "Notifikasi", icon: "bell", Component: NotificationsSection },
  { key: "access", label: "Peran & akses", icon: "users", Component: AccessSection }
];

/**
 * Configuration Center — the CMS for the whole application.
 *
 * Every section writes to `families/{id}/appConfig/{section}` and the running
 * app reads from the same place, so changing the menu, the dashboard, the form
 * fields or the theme never requires a code change or a deploy.
 */
export function ConfigurationPage() {
  const { profile } = useAuth();
  const { can } = usePermissions(profile?.role);
  const { isDesktop } = useResponsive();
  const [activeKey, setActiveKey] = useState("general");

  if (!can("config.manage")) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Pengaturan" title="Konfigurasi aplikasi" />
        <EmptyState
          title="Akses terbatas"
          description="Hanya peran dengan hak akses 'Kelola konfigurasi aplikasi' yang dapat membuka halaman ini. Hubungi pemilik keluarga bila Anda memerlukannya."
        />
      </div>
    );
  }

  const items = SECTIONS.map(({ key, label, icon, Component }) => ({
    key,
    label: (
      <span className="flex items-center gap-2">
        {renderIcon(icon)}
        {label}
      </span>
    ),
    // Rendering only the active tab keeps nine editors from mounting at once.
    children: activeKey === key ? <Component /> : null
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Pusat konfigurasi"
        title="Konfigurasi aplikasi"
        description="Atur menu, dashboard, form, tema, alur kerja, notifikasi, dan hak akses — semuanya tanpa mengubah kode."
      />

      <Tabs
        items={items}
        activeKey={activeKey}
        onChange={setActiveKey}
        tabPosition={isDesktop ? "left" : "top"}
        className={isDesktop ? "cms-tabs" : undefined}
        style={isDesktop ? { minHeight: "70vh" } : undefined}
      />
    </div>
  );
}
