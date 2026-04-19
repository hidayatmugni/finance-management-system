import { Button, Card, Space, Typography } from "antd";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function AppErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Terjadi error yang tidak terduga.";

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="finance-card finance-soft-card w-full">
        <Space orientation="vertical" size={10} className="w-full">
          <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Galat Aplikasi
          </Typography.Text>
          <Typography.Title level={2} className="!m-0 !text-2xl !font-extrabold">
            Ada masalah saat membuka halaman
          </Typography.Title>
          <Typography.Paragraph className="!m-0 !text-sm !leading-6 !text-muted">
            {message}
          </Typography.Paragraph>
          <Link to="/">
            <Button type="primary" size="large">
              Kembali ke beranda
            </Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
}
