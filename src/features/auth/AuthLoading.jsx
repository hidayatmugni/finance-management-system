import { Spin, Typography } from "antd";

/** Shown while Firebase resolves the session, on both guarded and public routes. */
export function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <Spin size="large" />
      <Typography.Text className="!text-body !text-muted">Memuat sesi…</Typography.Text>
    </div>
  );
}
