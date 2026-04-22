import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Controller, useForm } from "react-hook-form";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, isFirebaseReady } = useAuth();
  const [submitAlert, setSubmitAlert] = useState(null);

  useEffect(() => {
    if (!submitAlert) return undefined;
    const timeoutId = window.setTimeout(() => setSubmitAlert(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [submitAlert]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values) => {
    setSubmitAlert(null);

    try {
      if (!isFirebaseReady) throw new Error("Konfigurasi Firebase di frontend belum lengkap.");
      const normalizedEmail = values.email?.trim().toLowerCase();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error("Format email tidak valid.");
      }

      await login({
        email: normalizedEmail,
        password: values.password
      });

      navigate("/", { replace: true });
    } catch (error) {
      setSubmitAlert({
        type: "error",
        title: error instanceof Error ? error.message : "Autentikasi gagal."
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <Card className="finance-card finance-soft-card w-full" styles={{ body: { padding: 24 } }}>
        <Space orientation="vertical" size={6} className="w-full">
          <Typography.Text className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Autentikasi
          </Typography.Text>
          <Typography.Title level={2} className="!m-0 !text-[1.8rem] !font-extrabold">
            Akses keluarga
          </Typography.Title>
          <Typography.Paragraph className="!m-0 !text-sm !leading-6 !text-muted">
            Semua halaman aplikasi dilindungi login. Akun dibuat langsung dari Firebase, jadi halaman ini hanya dipakai untuk masuk ke aplikasi.
          </Typography.Paragraph>
        </Space>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Email
            </span>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email wajib diisi.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Format email tidak valid."
                }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<MailOutlined className="text-muted" />}
                  type="email"
                  autoComplete="email"
                  size="large"
                  placeholder="anda@email.com"
                  status={errors.email ? "error" : ""}
                />
              )}
            />
            {errors.email ? <span className="mt-2 block text-xs text-expense">{errors.email.message}</span> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Kata sandi
            </span>
            <Controller
              name="password"
              control={control}
              rules={{ required: "Kata sandi wajib diisi." }}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined className="text-muted" />}
                  autoComplete="current-password"
                  size="large"
                  placeholder="Minimal 6 karakter"
                  status={errors.password ? "error" : ""}
                />
              )}
            />
            {errors.password ? <span className="mt-2 block text-xs text-expense">{errors.password.message}</span> : null}
          </label>

          {submitAlert ? (
            <Alert
              type={submitAlert.type}
              showIcon
              title={submitAlert.title}
              closable={{ closeIcon: true, onClose: () => setSubmitAlert(null), "aria-label": "close" }}
            />
          ) : null}

          <Button type="primary" htmlType="submit" loading={isSubmitting} size="large" block>
            Masuk ke aplikasi
          </Button>
        </form>

        <Card size="small" className="finance-soft-card !mt-5">
          <Typography.Text className="!text-xs !leading-6 !text-muted">
            Status login:
            <span className="ml-1 font-semibold text-ink">
              {isFirebaseReady ? "Firebase siap" : "Konfigurasi belum lengkap"}
            </span>
          </Typography.Text>
        </Card>
      </Card>
    </div>
  );
}
