import {
  BarChartOutlined,
  HomeOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  WalletOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Button, Card, Layout, Space, Typography } from "antd";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
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
import { formatCurrency } from "../../shared/utils/format";

const navIconMap = {
  "/dashboard": <HomeOutlined />,
  "/dashboard/add": <PlusCircleOutlined />,
  "/dashboard/transactions": <ProfileOutlined />,
  "/dashboard/debts": <WalletOutlined />,
  "/dashboard/reports": <BarChartOutlined />
};

export function AppShell() {
  const { logout, token, user, profile, isFirebaseReady } = useAuth();
  const location = useLocation();
  const family = useFinanceStore((state) => state.family);
  const setFamily = useFinanceStore((state) => state.setFamily);
  const setMembers = useFinanceStore((state) => state.setMembers);
  const setSavingsGoals = useFinanceStore((state) => state.setSavingsGoals);
  const setSavingContributions = useFinanceStore((state) => state.setSavingContributions);
  const setFinanceRecords = useFinanceStore((state) => state.setFinanceRecords);
  const setFinancePayments = useFinanceStore((state) => state.setFinancePayments);
  const setTransactions = useFinanceStore((state) => state.setTransactions);
  const resetHouseholdData = useFinanceStore((state) => state.resetHouseholdData);
  const transactions = useFinanceStore((state) => state.transactions);
  const isDashboardHome = location.pathname === "/dashboard";
  const todayLabel = useMemo(
    () => dayjs().locale("id").format("dddd, DD MMMM YYYY"),
    [],
  );
  const greeting = useMemo(() => {
    const hour = dayjs().hour();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);
  const runningBalance = useMemo(
    () =>
      transactions.reduce((total, item) => {
        const amount = Number(item.amount || 0);
        return item.type === "income" ? total + amount : total - amount;
      }, 0),
    [transactions],
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
      {isDashboardHome ? (
        <Layout.Header className="sticky top-0 z-20 !h-auto !px-0 !pb-0 !pt-0 bg-transparent">
          <Card
            variant="borderless"
            className="!mb-0 !overflow-hidden !rounded-[30px]"
              styles={{
                body: {
                  padding: 18,
                  background: "linear-gradient(180deg, #202020 0%, #15181f 100%)",
                boxShadow: "0 20px 42px rgba(33, 33, 34, 0.42)"
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <Space orientation="vertical" size={2} className="min-w-0">
                <Typography.Text className="!text-[14px] !font-semibold !uppercase !tracking-[0.18em] !text-muted">
                  {greeting}  {profile?.fullName || user?.displayName || user?.email || "Sudah masuk"}
                </Typography.Text>
                <Typography.Text className="!text-[12px] !text-muted">
                  {todayLabel}
                </Typography.Text>
              </Space>

              <Button
                icon={<LogoutOutlined />}
                onClick={() => logout()}
                size="small"
                className="!flex !h-10 !w-10 !items-center !justify-center !rounded-full !border !border-line !bg-panel !p-0 !text-muted hover:!border-primary/40 hover:!text-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[22px] mt-2 border borders-[#06392F] px-4 py-2 ">
              <Space orientation="vertical" size={4} className="min-w-0">
                <Typography.Text className="!text-[11px] !font-medium !tracking-[0.08em] !text-[#ddffef]">
                  Sisa saldo
                </Typography.Text>
                <Typography.Text className="!block !text-[25px] !font-semibold !leading-none !text-primary">
                  {formatCurrency(runningBalance)}
                </Typography.Text>
              </Space>

                <div className="flex  shrink-0 items-center justify-center rounded-[24px] border border-white/10 bg-black/10">
                <div className="relative h-11 w-14 rounded-[14px] border border-white/12 bg-[#0fa968]">
                  <div className="absolute left-3 top-3 h-2 w-8 rounded-full bg-[#eafff4]" />
                  <div className="absolute left-3 top-7 h-2 w-5 rounded-full bg-[#9cf1c5]" />
                </div>
              </div>
            </div>
          </Card>
        </Layout.Header>
      ) : null}

      <Layout.Content className={`px-3 pb-24 ${isDashboardHome ? "pt-3" : "pt-4"}`}>
        <Outlet />
      </Layout.Content>

      <Layout.Footer className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md !px-0 !pb-0 !pt-2 finance-glass bg-transparent">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78px] rounded-t-[26px] bg-panel" />
          <div className="pointer-events-none absolute left-1/2 top-[-18px] h-[54px] w-[116px] -translate-x-1/2 rounded-t-[999px] bg-panel" />
          <ul className="relative grid grid-cols-5 items-end gap-1.5 rounded-t-[26px] bg-panel px-2 pb-2 pt-2 shadow-[0_-10px_24px_rgba(0,0,0,0.24)]">
            {bottomNavItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/dashboard"} className="block !no-underline">
                  {({ isActive }) => (
                    item.to === "/dashboard/add" ? (
                      <div className="relative -mt-8 flex justify-center">
                        <div
                          className={`flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full border border-line bg-panel text-center shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition ${
                            isActive
                              ? "text-primary"
                              : "text-primary"
                          }`}
                        >
                          <span className="text-[24px] leading-none">{navIconMap[item.to] || <HomeOutlined />}</span>
                          <span className="mt-1 text-[11px] font-semibold leading-none">{item.label}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex min-h-[54px] flex-col items-center justify-center rounded-[18px] border border-transparent px-1 py-1.5 text-center transition ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-transparent text-muted"
                        }`}
                      >
                        <span className="text-[16px] leading-none">{navIconMap[item.to] || <HomeOutlined />}</span>
                        <span className="mt-1.5 text-[10px] font-medium leading-none">{item.label}</span>
                      </div>
                    )
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </Layout.Footer>
    </Layout>
  );
}
