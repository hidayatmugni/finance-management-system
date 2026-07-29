import { ReloadOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Card } from "../shared/ui";

/** Router-level error boundary. */
export function AppErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Terjadi kesalahan yang tidak terduga.";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <span className="ds-eyebrow">Galat aplikasi</span>
        <Typography.Title level={1} className="!mb-2 !mt-1.5 !text-title !font-bold !text-ink">
          Halaman gagal dimuat
        </Typography.Title>
        <Typography.Text className="!block !text-body !leading-6 !text-muted">
          {message}
        </Typography.Text>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Muat ulang
          </Button>
          <Link to="/dashboard">
            <Button type="primary">Kembali ke dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
