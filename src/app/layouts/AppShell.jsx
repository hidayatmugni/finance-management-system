import {
  BarChartOutlined,
  CloudSyncOutlined,
  HomeOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Badge, Button, Card, Layout, Space, Typography } from "antd";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { bottomNavItems } from "../../shared/config/navigation";
import { useFinanceStore } from "../../shared/state/useFinanceStore";
import { useAuth } from "../../features/auth/AuthProvider";
import { watchTransactions } from "../../shared/firebase/firestoreTransactions";
import { processPendingSync } from "../../shared/lib/syncEngine";
import {
  watchFamily,
  watchFinancePayments,
  watchFinanceRecords,
  watchMembers,
  watchSavingContributions,
  watchSavingGoals
} from "../../shared/firebase/firestoreHousehold.js";
import { createTransaction } from "../../shared/firebase/firestoreTransactions";
import { globalFamilyId } from "../../shared/firebase/config.js";

const navIconMap = {
  "/": <HomeOutlined />,
  "/add": <PlusCircleOutlined />,
  "/transactions": <ProfileOutlined />,
  "/debts": <WalletOutlined />,
  "/reports": <BarChartOutlined />
};

export function AppShell() {
  const { logout, token, user, profile, isFirebaseReady } = useAuth();
  const family = useFinanceStore((state) => state.family);
  const setFamily = useFinanceStore((state) => state.setFamily);
  const setMembers = useFinanceStore((state) => state.setMembers);
  const setSavingsGoals = useFinanceStore((state) => state.setSavingsGoals);
  const setSavingContributions = useFinanceStore((state) => state.setSavingContributions);
  const setFinanceRecords = useFinanceStore((state) => state.setFinanceRecords);
  const setFinancePayments = useFinanceStore((state) => state.setFinancePayments);
  const setTransactions = useFinanceStore((state) => state.setTransactions);
  const resetHouseholdData = useFinanceStore((state) => state.resetHouseholdData);
  const pendingSyncCount = useFinanceStore(
    (state) => state.transactions.filter((item) => item.syncStatus === "pending").length,
  );

  useEffect(() => {
    if (!isFirebaseReady || !user || !token) {
      resetHouseholdData();
      return undefined;
    }

    const nextFamilyId = profile?.familyId || globalFamilyId;
    const unsubscribers = [];

    unsubscribers.push(watchFamily(nextFamilyId, (item) => setFamily(item), () => {}));
    unsubscribers.push(watchMembers(nextFamilyId, (items) => setMembers(items), () => {}));
    unsubscribers.push(watchSavingGoals(nextFamilyId, (items) => setSavingsGoals(items), () => {}));
    unsubscribers.push(watchSavingContributions(nextFamilyId, (items) => setSavingContributions(items), () => {}));
    unsubscribers.push(watchFinanceRecords(nextFamilyId, (items) => setFinanceRecords(items), () => {}));
    unsubscribers.push(watchFinancePayments(nextFamilyId, (items) => setFinancePayments(items), () => {}));
    unsubscribers.push(watchTransactions({
      familyId: nextFamilyId,
      onData: (items) => {
        setTransactions(items);
      },
      onError: () => {}
    }));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [
    isFirebaseReady,
    profile?.familyId,
    setFamily,
    setFinancePayments,
    setFinanceRecords,
    setMembers,
    setSavingContributions,
    setSavingsGoals,
    setTransactions,
    resetHouseholdData,
    token,
    user
  ]);

  useEffect(() => {
    if (!family?.id || !user || !token) {
      return undefined;
    }

    const syncPendingTransactions = async () => {
      if (!navigator.onLine) return;

      await processPendingSync({
        uploadMutation: async (item) => {
          if (item.entityType !== "transaction" || item.action !== "create") return;

          await createTransaction({
            familyId: family.id,
            payload: item.body
          });
        }
      });
    };

    syncPendingTransactions();
    window.addEventListener("online", syncPendingTransactions);

    return () => {
      window.removeEventListener("online", syncPendingTransactions);
    };
  }, [family?.id, token, user]);

  return (
    <Layout className="app-phone-shell bg-transparent pb-10">
      <Layout.Header className="sticky top-0 z-20 !h-auto !px-3 !pb-3 !pt-3 finance-glass">
        <Card variant="borderless" className="finance-card !mb-0">
          <div className="flex items-start justify-between gap-3">
            <Space orientation="vertical" size={2}>
              <Typography.Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Catatan Keuangan Harian
              </Typography.Text>
              <Typography.Title level={3} className="!m-0 !text-[1.05rem] !font-extrabold">
                My Finance
              </Typography.Title>
              <Typography.Text className="!text-[13px] !text-ink">
                {profile?.fullName || user?.displayName || user?.email || "Sudah masuk"}
              </Typography.Text>
              <Typography.Text className="!text-[11px] !text-muted">
                {family?.name || "Keluarga Mugni"}
              </Typography.Text>
            </Space>

            <Space orientation="vertical" size={6} className="min-w-[94px]">
              <Badge count={pendingSyncCount} color="#8a3345" overflowCount={99}>
                <Card size="small" className="finance-soft-card !rounded-xl" styles={{ body: { padding: 10 } }}>
                  <Space size={5}>
                    <CloudSyncOutlined className="text-[13px] text-primary" />
                    <Typography.Text className="!text-[11px] !font-semibold">Sinkron</Typography.Text>
                  </Space>
                </Card>
              </Badge>
              <Button icon={<LogoutOutlined />} onClick={() => logout()} size="small" block>
                Keluar
              </Button>
            </Space>
          </div>
        </Card>
      </Layout.Header>

      <Layout.Content className="px-3 pb-24 pt-3">
        <Outlet />
      </Layout.Content>

      <Layout.Footer className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md !px-3 !pb-3 !pt-2 finance-glass">
        <Card variant="borderless" className="finance-card !mb-0">
          <ul className="grid grid-cols-5 gap-1.5">
            {bottomNavItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>
                  {({ isActive }) => (
                    <div
                      className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1.5 py-1.5 text-center transition ${
                        isActive ? "bg-primary text-white shadow-md" : "bg-[#141d29] text-muted"
                      }`}
                    >
                      <span className="text-[15px]">{navIconMap[item.to] || <HomeOutlined />}</span>
                      <span className="mt-1 text-[10px] font-semibold leading-none">{item.label}</span>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </Card>
      </Layout.Footer>
    </Layout>
  );
}
