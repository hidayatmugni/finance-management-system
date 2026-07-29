import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfigSection } from "../../shared/config/useAppConfig";
import { renderIcon } from "../../shared/config/iconRegistry";
import { Card, Field } from "../../shared/ui";
import { ThemeSwitcher } from "../../shared/ui/ThemeSwitcher";
import { useAuth } from "./AuthProvider";

/** Sign-in screen. Accounts are provisioned in Firebase, so there is no signup. */
export function AuthPage() {
  const navigate = useNavigate();
  const { login, isFirebaseReady, projectId } = useAuth();
  const general = useConfigSection("general");

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (candidate) => {
    const nextErrors = {};
    const email = candidate.email.trim().toLowerCase();

    if (!email) nextErrors.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Format email tidak valid.";

    if (!candidate.password) nextErrors.password = "Kata sandi wajib diisi.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!isFirebaseReady) {
      setSubmitError("Konfigurasi Firebase belum lengkap. Periksa variabel lingkungan aplikasi.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Autentikasi gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-fg">
              {renderIcon("wallet")}
            </span>
            <div className="min-w-0">
              <Typography.Text className="!block !truncate !font-display !text-body-lg !font-bold !text-ink">
                {general.appName}
              </Typography.Text>
              <Typography.Text className="!block !truncate !text-caption !text-muted">
                {general.tagline}
              </Typography.Text>
            </div>
          </div>
          <ThemeSwitcher />
        </div>

        <Card className="p-5 md:p-6">
          <Typography.Title level={1} className="!mb-1 !text-title !font-bold !text-ink">
            Masuk
          </Typography.Title>
          <Typography.Text className="!mb-5 !block !text-body !text-muted">
            Gunakan akun yang sudah terdaftar untuk melanjutkan.
          </Typography.Text>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email" required error={errors.email}>
              <Input
                size="large"
                type="email"
                autoComplete="email"
                autoFocus
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                prefix={<MailOutlined className="text-subtle" />}
                placeholder="nama@email.com"
                status={errors.email ? "error" : undefined}
              />
            </Field>

            <Field label="Kata sandi" required error={errors.password}>
              <Input.Password
                size="large"
                autoComplete="current-password"
                value={values.password}
                onChange={(event) => setValues({ ...values, password: event.target.value })}
                prefix={<LockOutlined className="text-subtle" />}
                placeholder="Minimal 6 karakter"
                status={errors.password ? "error" : undefined}
              />
            </Field>

            {submitError ? (
              <Alert type="error" showIcon title={submitError} closable />
            ) : null}

            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
              Masuk ke aplikasi
            </Button>
          </form>
        </Card>

        {/* Naming the project turns "kok tidak bisa login" into a one-glance
            diagnosis when the environment variables point somewhere else. */}
        <Typography.Text className="!mt-4 !block !text-center !text-caption !text-muted">
          Firebase:{" "}
          <span className={isFirebaseReady ? "text-success-ink" : "text-danger-ink"}>
            {isFirebaseReady ? "siap" : "konfigurasi belum lengkap"}
          </span>
          {projectId ? (
            <>
              {" · project "}
              <span className="font-mono text-ink">{projectId}</span>
            </>
          ) : null}
        </Typography.Text>
      </div>
    </div>
  );
}
