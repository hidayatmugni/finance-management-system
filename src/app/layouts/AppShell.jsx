import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { Alert, Avatar, Button, Drawer, Dropdown, Layout, Tooltip, Typography } from "antd";
import { Suspense, useCallback, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { useConfigSection, usePermissions } from "../../shared/config/useAppConfig";
import { renderIcon } from "../../shared/config/iconRegistry";
import { useHouseholdSync } from "../../shared/data/useHouseholdSync";
import { useHotkeys, formatCombo } from "../../shared/hooks/useHotkeys";
import { useResponsive, useLocalStorage } from "../../shared/hooks/useResponsive";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { PageSkeleton } from "../../shared/ui/Skeleton";
import { ThemeSwitcher } from "../../shared/ui/ThemeSwitcher";
import { useToast } from "../../shared/ui/feedback";
import { cn } from "../../shared/ui/utils";
import { CommandPalette } from "./CommandPalette";

/**
 * Application chrome.
 *
 * Navigation, quick actions and permissions all come from the CMS config, so
 * the menu is data — adding a page means adding a config row, not editing this
 * file.
 */
export function AppShell() {
  const { logout, user, profile, provisionError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { isMobile } = useResponsive();

  const navigation = useConfigSection("navigation");
  const dashboard = useConfigSection("dashboard");
  const general = useConfigSection("general");
  const { can } = usePermissions(profile?.role);

  const family = useFinanceStore((state) => state.family);

  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("fm:sidebar-collapsed", false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleSyncError = useCallback(
    (scope, error) => {
      // One toast per failing collection is enough; Firestore retries on its own.
      if (error?.code === "permission-denied") {
        toast.error(`Akses ke data "${scope}" ditolak. Periksa Firestore Rules.`);
      }
    },
    [toast],
  );

  useHouseholdSync({ onError: handleSyncError });

  /** Menu entries the current role may see, in configured order. */
  const visibleNavItems = useMemo(
    () => navigation.items.filter((item) => item.enabled !== false && can(item.permission)),
    [navigation.items, can],
  );

  const groupedNavItems = useMemo(() => {
    return navigation.groups
      .map((group) => ({
        ...group,
        items: visibleNavItems.filter((item) => item.group === group.id)
      }))
      .filter((group) => group.items.length > 0);
  }, [navigation.groups, visibleNavItems]);

  const bottomNavItems = useMemo(
    () =>
      navigation.bottomBar
        .map((id) => visibleNavItems.find((item) => item.id === id))
        .filter(Boolean),
    [navigation.bottomBar, visibleNavItems],
  );

  const activeItem = useMemo(() => {
    return [...visibleNavItems]
      .sort((left, right) => right.path.length - left.path.length)
      .find((item) =>
        item.end ? location.pathname === item.path : location.pathname.startsWith(item.path),
      );
  }, [visibleNavItems, location.pathname]);

  const quickActions = useMemo(
    () => dashboard.quickActions.filter((item) => item.enabled !== false),
    [dashboard.quickActions],
  );

  useHotkeys({
    "mod+k": () => setPaletteOpen(true),
    "mod+shift+n": () => navigate("/dashboard/add"),
    escape: () => setPaletteOpen(false)
  });

  const displayName = profile?.fullName || user?.displayName || user?.email || "Pengguna";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Layout
      className="app-shell min-h-screen !bg-transparent"
      data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
    >
      <DesktopSidebar
        appName={general.appName}
        familyName={family?.name}
        groups={groupedNavItems}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <Layout className="app-main min-h-screen !bg-transparent">
        <Layout.Header className="app-header sticky top-0 z-30 !h-auto !bg-transparent !px-3 !py-2.5 md:!px-5">
          <div className="flex items-center gap-3">
            <Button
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              className="!flex !h-9 !w-9 !items-center !justify-center md:!hidden"
              aria-label="Buka menu"
            />
            <Button
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setSidebarCollapsed((value) => !value)}
              className="!hidden !h-9 !w-9 !items-center !justify-center lg:!flex"
              aria-label="Ubah lebar sidebar"
            />

            <div className="min-w-0 flex-1">
              <Typography.Title
                level={1}
                className="!mb-0 !truncate !text-subtitle !font-bold !text-ink md:!text-title"
              >
                {activeItem?.label || general.appName}
              </Typography.Title>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Tooltip title={`Cari cepat (${formatCombo("mod+k")})`}>
                <Button
                  icon={<SearchOutlined />}
                  onClick={() => setPaletteOpen(true)}
                  className="!hidden !h-9 sm:!inline-flex"
                >
                  <span className="hidden text-caption text-muted lg:inline">
                    {formatCombo("mod+k")}
                  </span>
                </Button>
              </Tooltip>

              <ThemeSwitcher />

              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    {
                      key: "profile",
                      label: (
                        <div className="py-1">
                          <Typography.Text className="!block !text-body !font-semibold !text-ink">
                            {displayName}
                          </Typography.Text>
                          <Typography.Text className="!block !text-caption !text-muted">
                            {profile?.role || "member"} · {family?.name || general.appName}
                          </Typography.Text>
                        </div>
                      ),
                      disabled: true
                    },
                    { type: "divider" },
                    { key: "settings", label: "Preferensi", onClick: () => navigate("/dashboard/settings") },
                    { key: "logout", label: "Keluar", icon: <LogoutOutlined />, danger: true, onClick: logout }
                  ]
                }}
              >
                <button type="button" className="ml-0.5" aria-label="Menu akun">
                  <Avatar size={34} className="!bg-primary !font-semibold !text-primary-fg">
                    {initials || "?"}
                  </Avatar>
                </button>
              </Dropdown>
            </div>
          </div>
        </Layout.Header>

        <Layout.Content className="px-3 pb-28 pt-4 md:px-5 md:pb-8">
          <div className="mx-auto w-full max-w-[1640px]">
            {/* The session is valid but its Firestore records are missing —
                almost always un-deployed rules or a freshly wiped database. */}
            {provisionError ? (
              <Alert
                className="!mb-4"
                type="warning"
                showIcon
                title="Data akun belum tersimpan di Firestore"
                description={
                  provisionError.code === "permission-denied"
                    ? "Firestore Rules menolak penulisan. Deploy ulang firestore.rules, lalu muat ulang halaman ini."
                    : provisionError.message
                }
                action={
                  <Button size="small" onClick={() => window.location.reload()}>
                    Muat ulang
                  </Button>
                }
              />
            ) : null}

            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </Layout.Content>

        {isMobile ? <MobileBottomNav items={bottomNavItems} /> : null}
      </Layout>

      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        groups={groupedNavItems}
        appName={general.appName}
        familyName={family?.name}
        displayName={displayName}
        onLogout={logout}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        navItems={visibleNavItems}
        quickActions={quickActions}
      />
    </Layout>
  );
}

/* ------------------------------------------------------------- desktop nav */

function DesktopSidebar({ appName, familyName, groups, collapsed, onToggle }) {
  return (
    <Layout.Sider
      width={252}
      collapsedWidth={76}
      collapsed={collapsed}
      trigger={null}
      className="app-sidebar !fixed !bottom-0 !left-0 !top-0 !z-40 !hidden md:!block"
    >
      <div className="flex h-full flex-col">
        <Link
          to="/dashboard"
          className="flex min-h-[62px] items-center gap-2.5 border-b border-line px-4 !no-underline"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg">
            {renderIcon("wallet")}
          </span>
          <span className="nav-label min-w-0">
            <Typography.Text className="!block !truncate !font-display !text-body !font-bold !text-ink">
              {familyName || appName}
            </Typography.Text>
            <Typography.Text className="!block !truncate !text-caption !text-muted">
              {appName}
            </Typography.Text>
          </span>
        </Link>

        <nav className="ds-scrollbar-hidden flex-1 overflow-y-auto px-2.5 py-3">
          {groups.map((group) => (
            <div key={group.id} className="mb-4 last:mb-0">
              <Typography.Text className="nav-group-label !mb-1.5 !block !px-2.5 !text-caption !font-semibold !uppercase !tracking-[0.08em] !text-subtle">
                {group.label}
              </Typography.Text>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Tooltip title={collapsed ? item.label : null} placement="right">
                      <NavLink to={item.path} end={item.end} className="block !no-underline">
                        {({ isActive }) => (
                          <span
                            className={cn(
                              "flex min-h-[38px] items-center gap-3 rounded-md px-2.5 py-2 text-body font-medium transition",
                              isActive
                                ? "bg-primary-soft text-primary-ink"
                                : "text-muted hover:bg-surface-hover hover:text-ink",
                            )}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[16px]">
                              {renderIcon(item.icon)}
                            </span>
                            <span className="nav-label truncate">{item.label}</span>
                          </span>
                        )}
                      </NavLink>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-2.5">
          <Button
            block
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            className="!hidden !justify-start lg:!flex"
          >
            <span className="nav-label">Perkecil menu</span>
          </Button>
        </div>
      </div>
    </Layout.Sider>
  );
}

/* -------------------------------------------------------------- mobile nav */

function MobileBottomNav({ items }) {
  if (items.length === 0) return null;

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface md:hidden">
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          // The "add" entry is promoted to a floating action button: it is the
          // single most frequent task and belongs under the thumb.
          const isPrimaryAction = item.id === "add";

          return (
            <li key={item.id} className="flex justify-center">
              <NavLink to={item.path} end={item.end} className="block w-full !no-underline">
                {({ isActive }) =>
                  isPrimaryAction ? (
                    <span className="flex justify-center">
                      <span className="-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg">
                        <PlusOutlined className="text-[20px]" />
                      </span>
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-2 transition",
                        isActive ? "text-primary-ink" : "text-muted",
                      )}
                    >
                      <span className="text-[18px] leading-none">{renderIcon(item.icon)}</span>
                      <span className="truncate text-[10px] font-medium leading-none">
                        {item.label}
                      </span>
                    </span>
                  )
                }
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileNavDrawer({ open, onClose, groups, appName, familyName, displayName, onLogout }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="left"
      width={288}
      className="md:!hidden"
      title={
        <div className="min-w-0">
          <Typography.Text className="!block !truncate !font-display !text-body !font-bold !text-ink">
            {familyName || appName}
          </Typography.Text>
          <Typography.Text className="!block !truncate !text-caption !text-muted">
            {displayName}
          </Typography.Text>
        </div>
      }
      styles={{ body: { padding: 12 } }}
      footer={
        <Button block danger icon={<LogoutOutlined />} onClick={onLogout} className="safe-bottom">
          Keluar
        </Button>
      }
    >
      {groups.map((group) => (
        <div key={group.id} className="mb-4 last:mb-0">
          <Typography.Text className="!mb-1.5 !block !px-2 !text-caption !font-semibold !uppercase !tracking-[0.08em] !text-subtle">
            {group.label}
          </Typography.Text>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <NavLink to={item.path} end={item.end} onClick={onClose} className="block !no-underline">
                  {({ isActive }) => (
                    <span
                      className={cn(
                        "flex min-h-[42px] items-center gap-3 rounded-md px-2.5 py-2 text-body font-medium transition",
                        isActive ? "bg-primary-soft text-primary-ink" : "text-muted",
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[16px]">
                        {renderIcon(item.icon)}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Drawer>
  );
}
